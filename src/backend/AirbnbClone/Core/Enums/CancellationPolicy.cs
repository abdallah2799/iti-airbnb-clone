namespace Core.Enums;

public enum CancellationPolicy
{
    Flexible = 0,      // Full refund 1 day prior to arrival
    Moderate = 1,      // Full refund 5 days prior to arrival
    Strict = 2,        // Full refund 7 days prior to arrival
    SuperStrict = 3    // 50% refund up to 30 days, no refund after
}
