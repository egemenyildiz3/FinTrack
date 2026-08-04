using FinTrack.Api.Data;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

public record MoneyGroup(string Label, Dictionary<string, decimal> Totals);

public record DashboardDto(
    Dictionary<string, decimal> SalaryTotals,
    Dictionary<string, decimal> MonthlySpendingTotals,
    Dictionary<string, decimal> Savings,
    List<MoneyGroup> Categories,
    List<MoneyGroup> Accounts,
    Dictionary<string, decimal> YearlyTotals,
    decimal TotalOwnedMoney);

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<DashboardDto> Get()
    {
        var allPayments = await _db.Payments.ToListAsync();
        var salaries = await _db.Salaries.ToListAsync();
        var enabledBanks = await BankSettings.GetEnabledBanksAsync(_db);

        // Enabled banks are the source of truth: only count payments whose account is enabled.
        var payments = allPayments
            .Where(p => BankSettings.IsEnabled(p.Account, enabledBanks))
            .ToList();

        // Monthly spending explicitly excludes yearly payments (requirement 5).
        var monthly = payments.Where(p => p.Recurrence == "Monthly").ToList();
        var yearly = payments.Where(p => p.Recurrence == "Yearly").ToList();

        static Dictionary<string, decimal> SumByCurrency(IEnumerable<(string Currency, decimal Amount)> items)
        {
            return items
                .GroupBy(i => i.Currency)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.Amount));
        }

        var salaryTotals = SumByCurrency(salaries.Select(s => (s.Currency, s.Amount)));
        var spendingTotals = SumByCurrency(monthly.Select(p => (p.Currency, p.Amount)));
        var yearlyTotals = SumByCurrency(yearly.Select(p => (p.Currency, p.Amount)));

        // Savings = salary - monthly spending, per currency.
        var savings = new Dictionary<string, decimal>();
        foreach (var (cur, amt) in salaryTotals)
            savings[cur] = amt - (spendingTotals.TryGetValue(cur, out var s) ? s : 0);
        foreach (var (cur, amt) in spendingTotals)
            if (!savings.ContainsKey(cur)) savings[cur] = -amt;

        var categories = monthly
            .GroupBy(p => p.Category)
            .Select(g => new MoneyGroup(g.Key, SumByCurrency(g.Select(p => (p.Currency, p.Amount)))))
            .OrderByDescending(g => g.Totals.TryGetValue("EUR", out var e) ? e : 0)
            .ToList();

        var accounts = monthly
            .GroupBy(p => p.Account!)
            .Select(g => new MoneyGroup(g.Key, SumByCurrency(g.Select(p => (p.Currency, p.Amount)))))
            .OrderByDescending(g => g.Totals.TryGetValue("EUR", out var e) ? e : 0)
            .ToList();

        var balanceSetting = await _db.Settings.FirstOrDefaultAsync(s => s.Key == "TotalOwnedMoney");
        decimal.TryParse(balanceSetting?.Value, System.Globalization.CultureInfo.InvariantCulture, out var balance);

        return new DashboardDto(salaryTotals, spendingTotals, savings, categories, accounts, yearlyTotals, balance);
    }
}
