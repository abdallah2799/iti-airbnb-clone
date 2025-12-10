using System.Text.Json;
using Core.Entities;
using Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Infragentic.Interfaces; // <--- NEW NAMESPACE

namespace AirbnbClone.Api.BackgroundServices
{
    public class KnowledgeWatcher : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<KnowledgeWatcher> _logger;
        private FileSystemWatcher? _watcher;
        private const string FileName = "knowledge.json";

        // Lock to prevent the FileWatcher and the Periodic Timer from syncing at the exact same time
        private static readonly SemaphoreSlim _syncLock = new SemaphoreSlim(1, 1);

        // Simple DTO for the JSON structure
        private class KnowledgeItem
        {
            public string id { get; set; } = "";
            public string question { get; set; } = "";
            public string answer { get; set; } = "";
        }

        public KnowledgeWatcher(IServiceScopeFactory scopeFactory, ILogger<KnowledgeWatcher> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var path = AppDomain.CurrentDomain.BaseDirectory;
            _logger.LogInformation($"🔭 KnowledgeWatcher started. Watching path: {path}");

            // 1. Setup File Watcher
            _watcher = new FileSystemWatcher(path)
            {
                Filter = FileName,
                NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.FileName,
                EnableRaisingEvents = true
            };

            _watcher.Changed += async (sender, e) => await OnFileChangedAsync();

            // 2. Initial Startup Delay
            await Task.Delay(5000, stoppingToken);

            // 3. Periodic Sync Loop
            while (!stoppingToken.IsCancellationRequested)
            {
                await SyncFullKnowledgeBaseAsync();
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        private async Task OnFileChangedAsync()
        {
            _logger.LogInformation("📄 knowledge.json changed. Triggering sync...");
            await Task.Delay(2000);
            await SyncFullKnowledgeBaseAsync();
        }

        /// <summary>
        /// The Master Sync Method: Combines SQL + JSON and pushes to Qdrant via Infragentic
        /// </summary>
        private async Task SyncFullKnowledgeBaseAsync()
        {
            if (!await _syncLock.WaitAsync(0))
            {
                _logger.LogWarning("⚠️ Sync already in progress. Skipping.");
                return;
            }

            try
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                    // --- CHANGED: Use the new Infragentic Interface ---
                    var knowledgeBase = scope.ServiceProvider.GetRequiredService<IAgenticKnowledgeBase>();

                    var allKnowledgeDocs = new List<string>();

                    // --- SOURCE 1: STATIC JSON (Rules) ---
                    var jsonPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, FileName);
                    if (File.Exists(jsonPath))
                    {
                        var jsonContent = await File.ReadAllTextAsync(jsonPath);
                        var rules = JsonSerializer.Deserialize<List<KnowledgeItem>>(jsonContent);

                        if (rules != null)
                        {
                            foreach (var rule in rules)
                            {
                                allKnowledgeDocs.Add($"Policy Q: {rule.question} A: {rule.answer}");
                            }
                            _logger.LogInformation($"✅ Loaded {rules.Count} static rules from JSON.");
                        }
                    }

                    // --- SOURCE 2: SQL DATABASE (Listings) ---
                    var listings = await unitOfWork.Listings.GetAllAsync();
                    foreach (var listing in listings)
                    {
                        var listingText = $@"
                            Listing: {listing.Title}
                            Location: {listing.City}, {listing.Country}
                            Price: {listing.PricePerNight} {listing.Currency} per night
                            Description: {listing.Description}
                            Amenities: {(listing.ListingAmenities != null ? string.Join(Environment.NewLine, listing.ListingAmenities
                                .GroupBy(a => a.Amenity.Category)
                                .Select(g => $"{g.Key}: {string.Join(", ", g.Select(a => a.Amenity.Name))}")) : "Standard items")}
                            Property Type: {listing.PropertyType}
                        ".Trim();

                        allKnowledgeDocs.Add(listingText);
                    }
                    _logger.LogInformation($"✅ Loaded {listings.Count()} listings from SQL Database.");

                    // --- ACTION: PUSH TO QDRANT (Using Infragentic Layer) ---
                    if (allKnowledgeDocs.Any())
                    {
                        _logger.LogInformation("🚀 Uploading combined knowledge to Qdrant via Infragentic...");

                        // --- CHANGED: Call the Upsert method from the new Interface ---
                        await knowledgeBase.UpsertKnowledgeAsync(allKnowledgeDocs);

                        _logger.LogInformation("✨ Brain update complete!");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error syncing knowledge base.");
            }
            finally
            {
                _syncLock.Release();
            }
        }

        public override void Dispose()
        {
            _watcher?.Dispose();
            _syncLock?.Dispose();
            base.Dispose();
        }
    }
}