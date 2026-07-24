using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Data;

/// <summary>
/// Helper around the payment-categories setting (the source of truth for categories).
/// "Other" is always kept as a fallback and cannot be removed.
/// </summary>
public static class CategorySettings
{
    public const string Key = "Categories";
    public const string Fallback = "Other";
    public const string Default = "Rent,Bills,Insurance,Subscriptions,Food,Other";

    public static async Task<List<string>> GetAsync(AppDbContext db)
    {
        var setting = await db.Settings.FirstOrDefaultAsync(s => s.Key == Key);
        var list = Parse(setting?.Value);
        if (list.Count == 0) list = Parse(Default);
        if (!list.Contains(Fallback, StringComparer.OrdinalIgnoreCase)) list.Add(Fallback);
        return list;
    }

    public static List<string> Parse(string? value) =>
        (value ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
}
