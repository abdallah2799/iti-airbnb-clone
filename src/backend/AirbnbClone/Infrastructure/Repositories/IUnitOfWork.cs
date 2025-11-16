namespace Infrastructure.Repositories;

/// <summary>
/// Unit of Work pattern interface to manage transactions across multiple repositories
/// </summary>
public interface IUnitOfWork : IDisposable
{
    /// <summary>
    /// User repository for Sprint 0 authentication operations
    /// </summary>
    IUserRepository Users { get; }

    /// <summary>
    /// Conversation repository for Sprint 3 messaging features
    /// </summary>
    IConversationRepository Conversations { get; }

    /// <summary>
    /// Message repository for Sprint 3 messaging features
    /// </summary>
    IMessageRepository Messages { get; }

    /// <summary>
    /// Listing repository for Sprint 1 CRUD operations
    /// </summary>
    IListingRepository Listings { get; }

    /// <summary>
    /// Booking repository for Sprint 2 payment integration
    /// </summary>
    IBookingRepository Bookings { get; }

    /// <summary>
    /// Save all pending changes to the database
    /// </summary>
    Task<int> CompleteAsync();

    /// <summary>
    /// Begin a database transaction
    /// </summary>
    Task BeginTransactionAsync();

    /// <summary>
    /// Commit the current transaction
    /// </summary>
    Task CommitTransactionAsync();

    /// <summary>
    /// Rollback the current transaction
    /// </summary>
    Task RollbackTransactionAsync();
}
