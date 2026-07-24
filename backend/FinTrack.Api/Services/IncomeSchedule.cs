using System.Globalization;
using FinTrack.Api.Data;
using FinTrack.Api.Models;

namespace FinTrack.Api.Services;

/// <summary>
/// Receive-date logic for income sources, plus the routine that auto-applies due
/// receives to the balance. The JET salary rule is hardcoded here.
/// </summary>
public static class IncomeSchedule
{
    public const string BalanceKey = "TotalOwnedMoney";

    /// <summary>The day this income should be received in the given month, or null if manual.</summary>
    public static DateOnly? EffectiveReceiveDate(int year, int month, Salary s) => s.ScheduleType switch
    {
        "JetSalary" => LastWeekdayOnOrBefore(new DateOnly(year, month, 24)),
        "MonthlyDay" when s.ScheduleDay is int d =>
            new DateOnly(year, month, Math.Clamp(d, 1, DateTime.DaysInMonth(year, month))),
        _ => null,
    };

    // JET salary: the 24th, but if that's Saturday/Sunday, step back to the last weekday.
    private static DateOnly LastWeekdayOnOrBefore(DateOnly date)
    {
        while (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            date = date.AddDays(-1);
        return date;
    }

    /// <summary>
    /// Applies any auto-receives that are due (date reached and not yet received this
    /// month) by adding their amount to the balance. Idempotent per month.
    /// Returns true if anything changed.
    /// </summary>
    public static bool ProcessDueAutoReceives(AppDbContext db, DateOnly today)
    {
        var ym = today.ToString("yyyy-MM");
        var due = db.Salaries
            .Where(s => s.AutoReceive && s.LastReceivedYearMonth != ym)
            .ToList();

        decimal added = 0;
        var changed = false;

        foreach (var s in due)
        {
            var eff = EffectiveReceiveDate(today.Year, today.Month, s);
            if (eff is null || today < eff.Value) continue;
            added += s.Amount;
            s.LastReceivedYearMonth = ym;
            changed = true;
        }

        if (changed)
        {
            AddToBalance(db, added);
            db.SaveChanges();
        }
        return changed;
    }

    public static decimal GetBalance(AppDbContext db)
    {
        var setting = db.Settings.FirstOrDefault(x => x.Key == BalanceKey);
        decimal.TryParse(setting?.Value, CultureInfo.InvariantCulture, out var value);
        return value;
    }

    public static decimal AddToBalance(AppDbContext db, decimal amount)
    {
        var setting = db.Settings.FirstOrDefault(x => x.Key == BalanceKey);
        var current = 0m;
        if (setting is null)
        {
            setting = new AppSetting { Key = BalanceKey, Value = "0" };
            db.Settings.Add(setting);
        }
        else
        {
            decimal.TryParse(setting.Value, CultureInfo.InvariantCulture, out current);
        }
        var next = current + amount;
        setting.Value = next.ToString(CultureInfo.InvariantCulture);
        return next;
    }
}
