using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Data;

/// <summary>
/// Helper around the enabled-banks setting. Enabled banks are the source of truth:
/// any payment whose account is null or not in this list is excluded from calculations.
/// </summary>
public static class BankSettings
{
    public const string Key = "EnabledBanks";

    public static async Task<List<string>> GetEnabledBanksAsync(AppDbContext db)
    {
        var setting = await db.Settings.FirstOrDefaultAsync(s => s.Key == Key);
        return Parse(setting?.Value);
    }

    public static List<string> Parse(string? value) =>
        (value ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    public static bool IsEnabled(string? account, ICollection<string> enabled) =>
        account is not null && enabled.Contains(account);
}
