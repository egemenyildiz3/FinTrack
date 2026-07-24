using FinTrack.Api.Data;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

/// <summary>A full snapshot of the app's data, used for backup and restore.</summary>
public class BackupData
{
    public int Version { get; set; } = 1;
    public DateTime ExportedAt { get; set; }
    public List<Payment> Payments { get; set; } = new();
    public List<Salary> Salaries { get; set; } = new();
    public List<Transfer> Transfers { get; set; } = new();
    public List<AppSetting> Settings { get; set; } = new();
}

[ApiController]
[Route("api/[controller]")]
public class BackupController : ControllerBase
{
    private readonly AppDbContext _db;
    public BackupController(AppDbContext db) => _db = db;

    /// <summary>Export every table as a single JSON snapshot.</summary>
    [HttpGet]
    public async Task<BackupData> Get() => new BackupData
    {
        Version = 1,
        ExportedAt = DateTime.UtcNow,
        Payments = await _db.Payments.OrderBy(p => p.SortOrder).ToListAsync(),
        Salaries = await _db.Salaries.OrderBy(s => s.Id).ToListAsync(),
        Transfers = await _db.Transfers.OrderBy(t => t.SortOrder).ToListAsync(),
        Settings = await _db.Settings.ToListAsync(),
    };

    /// <summary>
    /// Replace ALL current data with the supplied snapshot. Runs in a transaction so a
    /// bad import can't leave the database half-written.
    /// </summary>
    [HttpPost("restore")]
    public async Task<IActionResult> Restore([FromBody] BackupData data)
    {
        if (data is null) return BadRequest("No backup data provided.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        _db.Payments.RemoveRange(_db.Payments);
        _db.Salaries.RemoveRange(_db.Salaries);
        _db.Transfers.RemoveRange(_db.Transfers);
        _db.Settings.RemoveRange(_db.Settings);
        await _db.SaveChangesAsync();

        // Insert fresh copies (Ids regenerate; they aren't referenced anywhere).
        _db.Payments.AddRange(data.Payments.Select(p => new Payment
        {
            Name = p.Name, Account = p.Account, Amount = p.Amount, Currency = p.Currency,
            Recurrence = p.Recurrence, Category = p.Category, DayOfMonth = p.DayOfMonth,
            Month = p.Month, IsDone = p.IsDone, SortOrder = p.SortOrder,
        }));
        _db.Salaries.AddRange(data.Salaries.Select(s => new Salary
        {
            Name = s.Name, Amount = s.Amount, Currency = s.Currency,
            ScheduleType = s.ScheduleType, ScheduleDay = s.ScheduleDay,
            AutoReceive = s.AutoReceive, LastReceivedYearMonth = s.LastReceivedYearMonth,
        }));
        _db.Transfers.AddRange(data.Transfers.Select(t => new Transfer
        {
            Name = t.Name, Amount = t.Amount, Currency = t.Currency,
            Direction = t.Direction, Day = t.Day, IsDone = t.IsDone, SortOrder = t.SortOrder,
        }));
        _db.Settings.AddRange(data.Settings
            .Where(s => !string.IsNullOrWhiteSpace(s.Key))
            .Select(s => new AppSetting { Key = s.Key, Value = s.Value }));

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { restored = true });
    }
}
