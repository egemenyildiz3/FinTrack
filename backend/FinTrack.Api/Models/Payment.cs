namespace FinTrack.Api.Models;

/// <summary>
/// A recurring payment. This is the single source of truth: the checklist,
/// the dashboard and the account split are all derived from these rows.
/// </summary>
public class Payment
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    /// <summary>
    /// Account the money is paid from, e.g. "ING", "Revolut". Null when no bank is
    /// assigned. Payments whose account is null or not in the enabled banks setting
    /// are excluded from all calculations.
    /// </summary>
    public string? Account { get; set; }

    public decimal Amount { get; set; }

    /// <summary>"EUR" or "TL".</summary>
    public string Currency { get; set; } = "EUR";

    /// <summary>"Monthly" or "Yearly".</summary>
    public string Recurrence { get; set; } = "Monthly";

    /// <summary>Spending category used by the dashboard grouping.</summary>
    public string Category { get; set; } = "Other";

    /// <summary>Day of month the payment is due (1-31). Null if not set.</summary>
    public int? DayOfMonth { get; set; }

    /// <summary>Month of year (1-12) for yearly payments. Null for monthly.</summary>
    public int? Month { get; set; }

    /// <summary>Whether this item has been checked off in the current cycle.</summary>
    public bool IsDone { get; set; }

    public int SortOrder { get; set; }
}
