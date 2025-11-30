using Serilog;

namespace Api.Helpers;

/// <summary>
/// Logging helper to provide easy access to Serilog logger throughout the application
/// Usage: LogHelper.Information("User logged in successfully", userId);
/// </summary>
public static class LogHelper
{
    /// <summary>
    /// Log informational message
    /// </summary>
    public static void Information(string message, params object[] args)
    {
        Log.Information(message, args);
    }

    /// <summary>
    /// Log warning message
    /// </summary>
    public static void Warning(string message, params object[] args)
    {
        Log.Warning(message, args);
    }

    /// <summary>
    /// Log error message with exception
    /// </summary>
    public static void Error(Exception ex, string message, params object[] args)
    {
        Log.Error(ex, message, args);
    }

    /// <summary>
    /// Log error message without exception
    /// </summary>
    public static void Error(string message, params object[] args)
    {
        Log.Error(message, args);
    }

    /// <summary>
    /// Log debug message (only in development)
    /// </summary>
    public static void Debug(string message, params object[] args)
    {
        Log.Debug(message, args);
    }

    /// <summary>
    /// Log fatal error
    /// </summary>
    public static void Fatal(Exception ex, string message, params object[] args)
    {
        Log.Fatal(ex, message, args);
    }

    /// <summary>
    /// Log verbose message (detailed tracing)
    /// </summary>
    public static void Verbose(string message, params object[] args)
    {
        Log.Verbose(message, args);
    }
}

