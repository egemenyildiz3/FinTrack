using FinTrack.Api.Data;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PaymentsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<Payment>> Get() =>
        await _db.Payments.OrderBy(p => p.SortOrder).ThenBy(p => p.Id).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<Payment>> Create(Payment p)
    {
        p.Id = 0;
        _db.Payments.Add(p);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = p.Id }, p);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Payment p)
    {
        var existing = await _db.Payments.FindAsync(id);
        if (existing is null) return NotFound();

        existing.Name = p.Name;
        existing.Account = p.Account;
        existing.Amount = p.Amount;
        existing.Currency = p.Currency;
        existing.Recurrence = p.Recurrence;
        existing.Category = p.Category;
        existing.DayOfMonth = p.DayOfMonth;
        existing.Month = p.Month;
        existing.IsDone = p.IsDone;
        existing.SortOrder = p.SortOrder;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _db.Payments.FindAsync(id);
        if (existing is null) return NotFound();
        _db.Payments.Remove(existing);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Toggle the done state of a single checklist item.</summary>
    [HttpPost("{id:int}/toggle")]
    public async Task<IActionResult> Toggle(int id)
    {
        var existing = await _db.Payments.FindAsync(id);
        if (existing is null) return NotFound();
        existing.IsDone = !existing.IsDone;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    /// <summary>Reset all done flags (the monthly RESET step).</summary>
    [HttpPost("reset")]
    public async Task<IActionResult> Reset()
    {
        await _db.Payments.ExecuteUpdateAsync(s => s.SetProperty(p => p.IsDone, false));
        return NoContent();
    }
}
