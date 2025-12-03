using Application.DTOs.Bookings;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services.Implementation;

/// <summary>
/// Booking service implementation handling guest CRUD and related business rules
/// </summary>
public class BookingService : IBookingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<BookingService> _logger;
    private readonly IEmailService _emailService;

    public BookingService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<BookingService> logger,
        IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task<BookingDto> CreateBookingAsync(CreateBookingRequestDto request, string guestId)
    {
        if (request.EndDate <= request.StartDate)
            throw new ArgumentException("EndDate must be after StartDate");

        var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(request.ListingId);
        if (listing == null)
            throw new ArgumentException("Listing not found");

        if (listing.HostId == guestId)
            throw new UnauthorizedAccessException("Cannot book your own listing");

        var available = await _unitOfWork.Bookings.IsListingAvailableAsync(listing.Id, request.StartDate, request.EndDate);
        if (!available)
            throw new InvalidOperationException("Listing is not available for the selected dates");

        var nights = (request.EndDate.Date - request.StartDate.Date).Days;
        var total = listing.PricePerNight * nights + (listing.CleaningFee ?? 0m) + (listing.ServiceFee ?? 0m);

        var booking = new Booking
        {
            ListingId = listing.Id,
            GuestId = guestId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Guests = request.Guests,
            TotalPrice = decimal.Round(total, 2),
            CleaningFee = listing.CleaningFee,
            ServiceFee = listing.ServiceFee,
            Status = BookingStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Bookings.AddAsync(booking);
        await _unitOfWork.CompleteAsync();

        _logger.LogInformation("Created booking {BookingId} for guest {GuestId} on listing {ListingId}",
            booking.Id, guestId, listing.Id);

        var dto = _mapper.Map<BookingDto>(booking);
        // Fill listing/host details for DTO
        dto.ListingTitle = listing.Title ?? dto.ListingTitle;
        dto.ListingCoverPhoto = listing.Photos?.FirstOrDefault(p => p.IsCover)?.Url;
        dto.HostId = listing.HostId ?? dto.HostId;
        dto.HostName = listing.Host?.FullName ?? dto.HostName;

        return dto;
    }

    public async Task<IEnumerable<BookingDto>> GetGuestBookingsAsync(string guestId)
    {
        var bookings = await _unitOfWork.Bookings.GetGuestBookingsAsync(guestId);
        var dtos = _mapper.Map<IEnumerable<BookingDto>>(bookings);

        // Enrich DTOs with listing/host data where needed
        foreach (var pair in bookings.Zip(dtos, (b, d) => (b, d)))
        {
            pair.d.ListingTitle = pair.b.Listing?.Title ?? pair.d.ListingTitle;
            pair.d.ListingCoverPhoto = pair.b.Listing?.Photos?.FirstOrDefault(p => p.IsCover)?.Url;
            pair.d.HostId = pair.b.Listing?.HostId ?? pair.d.HostId;
            pair.d.HostName = pair.b.Listing?.Host?.FullName ?? pair.d.HostName;
        }

        return dtos;
    }

    public async Task<BookingDetailDto?> GetBookingByIdAsync(int bookingId, string guestId)
    {
        var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
        if (booking == null) return null;
        if (booking.GuestId != guestId) throw new UnauthorizedAccessException("Access denied to booking");

        var dto = _mapper.Map<BookingDetailDto>(booking);

        // Fill nested listing and guest info
        dto.Listing = new BookingListingDto
        {
            Id = booking.Listing.Id,
            Title = booking.Listing.Title ?? string.Empty,
            CoverPhotoUrl = booking.Listing.Photos?.FirstOrDefault(p => p.IsCover)?.Url,
            HostId = booking.Listing.HostId,
            HostName = booking.Listing.Host?.FullName ?? string.Empty
        };

        dto.Guest = new BookingGuestDto
        {
            GuestId = booking.GuestId,
            GuestName = booking.Guest?.FullName ?? string.Empty,
            GuestProfilePicture = booking.Guest?.ProfilePictureUrl
        };

        return dto;
    }

    public async Task<BookingDto?> UpdateBookingAsync(int bookingId, UpdateBookingRequestDto request, string guestId)
    {
        var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
        if (booking == null) return null;
        if (booking.GuestId != guestId) throw new UnauthorizedAccessException("Access denied to booking");
        if (booking.Status != BookingStatus.Pending)
            throw new InvalidOperationException("Only pending bookings can be updated by guest");

        var changed = false;

        if (request.Guests.HasValue && request.Guests.Value != booking.Guests)
        {
            booking.Guests = request.Guests.Value;
            changed = true;
        }

        // Support guest-driven cancellation via update (optional)
        if (!string.IsNullOrWhiteSpace(request.CancellationReason))
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = request.CancellationReason;
            booking.CancelledAt = DateTime.UtcNow;
            changed = true;
        }

        if (changed)
        {
            _unitOfWork.Bookings.Update(booking);
            await _unitOfWork.CompleteAsync();
        }

        var dto = _mapper.Map<BookingDto>(booking);
        dto.ListingTitle = booking.Listing?.Title ?? dto.ListingTitle;
        dto.ListingCoverPhoto = booking.Listing?.Photos?.FirstOrDefault(p => p.IsCover)?.Url;
        dto.HostId = booking.Listing?.HostId ?? dto.HostId;
        dto.HostName = booking.Listing?.Host?.FullName ?? dto.HostName;

        return dto;
    }

    public async Task CancelBookingAsync(int bookingId, string guestId, string? reason = null)
    {
        var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
        if (booking == null) throw new ArgumentException("Booking not found");
        if (booking.GuestId != guestId) throw new UnauthorizedAccessException("Access denied to booking");

        if (booking.Status == BookingStatus.Cancelled)
        {
            _logger.LogInformation("Booking {BookingId} already cancelled", bookingId);
            return;
        }

        // Validate Start Date
        if (booking.StartDate <= DateTime.UtcNow.Date)
        {
            throw new InvalidOperationException("Cannot cancel a booking that has already started or is in the past.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.CancellationReason = reason;

        _unitOfWork.Bookings.Update(booking);
        await _unitOfWork.CompleteAsync();

        _logger.LogInformation("Booking {BookingId} cancelled by guest {GuestId}", bookingId, guestId);

        // Send Cancellation Email
        try
        {
            var guestEmail = booking.Guest?.Email;
            var guestName = booking.Guest?.FullName ?? "Guest";
            var listingTitle = booking.Listing?.Title ?? "Airbnb Listing";

            if (!string.IsNullOrEmpty(guestEmail))
            {
                await _emailService.SendBookingCancellationEmailAsync(guestEmail, guestName, listingTitle, booking.StartDate);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send cancellation email for booking {BookingId}", bookingId);
            // Don't throw, cancellation was successful
        }
    }
}

