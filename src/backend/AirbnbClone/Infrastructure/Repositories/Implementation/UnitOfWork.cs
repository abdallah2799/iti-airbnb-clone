using Infrastructure.Data;
using Infrastructure.Repositories.Implementation;
using Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation for managing transactions
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;

    // Lazy initialization of repositories
    private IUserRepository? _users;
    private IConversationRepository? _conversations;
    private IMessageRepository? _messages;
    private IListingRepository? _listings;
    private IBookingRepository? _bookings;
    private IPhotoRepository? _photos;
    private IReviewRepository? _reviews;
    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users => 
        _users ??= new UserRepository(_context);

    public IConversationRepository Conversations => 
        _conversations ??= new ConversationRepository(_context);

    public IMessageRepository Messages => 
        _messages ??= new MessageRepository(_context);

    public IListingRepository Listings => 
        _listings ??= new ListingRepository(_context);

    public IBookingRepository Bookings => 
        _bookings ??= new BookingRepository(_context);

    public IPhotoRepository Photos => _photos ??= new PhotoRepository(_context);

    public async Task<int> CompleteAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }
    public IReviewRepository Reviews =>
    _reviews ??= new ReviewRepository(_context);
    public async Task CommitTransactionAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
            }
        }
        catch
        {
            await RollbackTransactionAsync();
            throw;
        }
        finally
        {
            if (_transaction != null)
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
