using AirbnbClone.Infrastructure.Services.Interfaces;

namespace AirbnbClone.Api.BackgroundServices
{
    public class KnowledgeWatcher : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<KnowledgeWatcher> _logger;
        private FileSystemWatcher _watcher;
        private const string FileName = "knowledge.json";

        private static readonly object _lock = new object();
        private bool _isProcessing = false;

        public KnowledgeWatcher(IServiceScopeFactory scopeFactory, ILogger<KnowledgeWatcher> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // 1. Determine where the file lives (Same logic as your Service)
            var path = AppDomain.CurrentDomain.BaseDirectory;

            _logger.LogInformation($"🔭 KnowledgeWatcher started. Watching: {path}");

            // 2. Setup the FileSystemWatcher
            _watcher = new FileSystemWatcher(path)
            {
                Filter = FileName,
                NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.FileName,
                EnableRaisingEvents = true
            };

            // 3. Hook up the event handler
            _watcher.Changed += async (sender, e) => await OnChangedAsync(e);

            return Task.CompletedTask;
        }

        private async Task OnChangedAsync(FileSystemEventArgs e)
        {
            lock (_lock)
            {
                if (_isProcessing) return; // Ignore if already running
                _isProcessing = true;
            }

            try
            {
                _logger.LogInformation($"Detected change in {e.Name}. Waiting 2 seconds for write to complete...");

                // Wait longer to ensure VS Code/Windows finishes the file copy
                await Task.Delay(2000);

                using (var scope = _scopeFactory.CreateScope())
                {
                    var ragService = scope.ServiceProvider.GetRequiredService<IKnowledgeBaseService>();
                    await ragService.IngestKnowledgeAsync();
                }

                _logger.LogInformation("Brain updated successfully!");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating brain: {ex.Message}");
            }
            finally
            {
                lock (_lock)
                {
                    _isProcessing = false; // Allow next update
                }
            }
        }

        public override void Dispose()
        {
            _watcher?.Dispose();
            base.Dispose();
        }
    }
}