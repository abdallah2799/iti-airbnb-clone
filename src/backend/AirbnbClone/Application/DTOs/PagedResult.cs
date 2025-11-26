namespace Application.DTOs;

/// <summary>
/// Represents a paginated collection of items for API responses.
/// </summary>
/// <remarks>
/// Used by admin and public endpoints to return consistent pagination metadata.
/// 
/// **Sprint 6 Focus**: Admin dashboard pagination support
/// 
/// **Properties**:
/// - Items: The current page of results
/// - Page: Current page number (1-based)
/// - PageSize: Number of items per page
/// - TotalCount: Total number of items across all pages
/// - TotalPages: Calculated total pages (readOnly)
/// </remarks>
/// <typeparam name="T">Type of items in the collection</typeparam>
public class PagedResult<T>
{
    /// <summary>
    /// The items on the current page.
    /// </summary>
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();

    /// <summary>
    /// The current page number (starts at 1).
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Number of items per page.
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of items matching the query.
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Total number of pages available.
    /// Calculated as Ceiling(TotalCount / PageSize).
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}