namespace FinTrack.Api.Models;

/// <summary>
/// A money-movement step in the monthly routine, e.g. an incoming transfer (In) or an
/// outgoing one (Out). Shown as a checklist on the home page. These are transfers,
/// not spending, so they never affect the dashboard totals.
/// </summary>
public class Transfer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";

    /// <summary>"In" (money you receive) or "Out" (money you send).</summary>
    public string Direction { get; set; } = "Out";

    /// <summary>Day of month the transfer happens (optional).</summary>
    public int? Day { get; set; }

    public bool IsDone { get; set; }
    public int SortOrder { get; set; }
}
