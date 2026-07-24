using FinTrack.Api.Data;
using FinTrack.Api.Models;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

/// <summary>Salary plus the computed receive info the UI needs.</summary>
public record SalaryDto(
    int Id, string Name, decimal Amount, string Currency,
    string ScheduleType, int? ScheduleDay, bool AutoReceive,
    string? LastReceivedYearMonth,
    DateOnly? EffectiveReceiveDate, bool ReceivedThisMonth);

public record ReceiveResult(decimal Balance);

[ApiController]
[Route("api/[controller]")]
public class SalariesController : ControllerBase
{
    private readonly AppDbContext _db;
    public SalariesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<SalaryDto>> Get()
    {
        // Apply anything that's become due since the last check, then return current state.
        var today = DateOnly.FromDateTime(DateTime.Now);
        IncomeSchedule.ProcessDueAutoReceives(_db, today);

        var ym = today.ToString("yyyy-MM");
        var salaries = await _db.Salaries.OrderBy(s => s.Id).ToListAsync();

        return salaries.Select(s => new SalaryDto(
            s.Id, s.Name, s.Amount, s.Currency,
            s.ScheduleType, s.ScheduleDay, s.AutoReceive, s.LastReceivedYearMonth,
            IncomeSchedule.EffectiveReceiveDate(today.Year, today.Month, s),
            s.LastReceivedYearMonth == ym));
    }

    [HttpPost]
    public async Task<ActionResult<Salary>> Create(Salary s)
    {
        s.Id = 0;
        _db.Salaries.Add(s);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = s.Id }, s);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Salary s)
    {
        var existing = await _db.Salaries.FindAsync(id);
        if (existing is null) return NotFound();
        existing.Name = s.Name;
        existing.Amount = s.Amount;
        existing.Currency = s.Currency;
        existing.ScheduleType = s.ScheduleType;
        existing.ScheduleDay = s.ScheduleDay;
        existing.AutoReceive = s.AutoReceive;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _db.Salaries.FindAsync(id);
        if (existing is null) return NotFound();
        _db.Salaries.Remove(existing);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Manually receive this income: add its amount to the balance.</summary>
    [HttpPost("{id:int}/receive")]
    public async Task<ActionResult<ReceiveResult>> Receive(int id)
    {
        var s = await _db.Salaries.FindAsync(id);
        if (s is null) return NotFound();

        var balance = IncomeSchedule.AddToBalance(_db, s.Amount);
        // Mark received this month so an auto-receive won't add it again.
        s.LastReceivedYearMonth = DateOnly.FromDateTime(DateTime.Now).ToString("yyyy-MM");
        await _db.SaveChangesAsync();
        return Ok(new ReceiveResult(balance));
    }
}
