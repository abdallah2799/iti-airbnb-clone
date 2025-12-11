namespace Core.Interfaces
{
    public interface ISqlWriteExecutor
    {
        // Notice we REQUIRE userId for every write operation
        Task<bool> ExecuteSafeUpdateAsync(string sql, Dictionary<string, object> parameters, string userId);
    }
}