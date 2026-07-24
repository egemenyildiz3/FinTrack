namespace FinTrack.Api.Models;

/// <summary>Incoming money. There can be a primary salary plus extra ones.</summary>
public class Salary
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";

    /// <summary>
    /// How the receive date is determined:
    /// "Manual"     – no automatic date, receive by hand only,
    /// "MonthlyDay" – a fixed day of the month (see <see cref="ScheduleDay"/>),
    /// "JetSalary"  – the 24th, rolled back to the last weekday if it lands on a weekend.
    /// </summary>
    public string ScheduleType { get; set; } = "Manual";

    /// <summary>Day of month used when ScheduleType is "MonthlyDay".</summary>
    public int? ScheduleDay { get; set; }

    /// <summary>When true, the income is added to the balance automatically on its date.</summary>
    public bool AutoReceive { get; set; }

    /// <summary>"yyyy-MM" of the last month this income was received, to avoid double-adding.</summary>
    public string? LastReceivedYearMonth { get; set; }
}
