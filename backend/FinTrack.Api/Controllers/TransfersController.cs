using FinTrack.Api.Data;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransfersController : ControllerBase
{
    private readonly AppDbContext _db;
    public TransfersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<Transfer>> Get() =>
        await _db.Transfers.OrderBy(t => t.SortOrder).ThenBy(t => t.Id).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<Transfer>> Create(Transfer t)
    {
        t.Id = 0;
        _db.Transfers.Add(t);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = t.Id }, t);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Transfer t)
    {
        var existing = await _db.Transfers.FindAsync(id);
        if (existing is null) return NotFound();

        existing.Name = t.Name;
        existing.Amount = t.Amount;
        existing.Currency = t.Currency;
        existing.Direction = t.Direction;
        existing.Day = t.Day;
        existing.IsDone = t.IsDone;
        existing.SortOrder = t.SortOrder;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _db.Transfers.FindAsync(id);
        if (existing is null) return NotFound();
        _db.Transfers.Remove(existing);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/toggle")]
    public async Task<IActionResult> Toggle(int id)
    {
        var existing = await _db.Transfers.FindAsync(id);
        if (existing is null) return NotFound();
        existing.IsDone = !existing.IsDone;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset()
    {
        await _db.Transfers.ExecuteUpdateAsync(s => s.SetProperty(t => t.IsDone, false));
        return NoContent();
    }

    /// <summary>Set the order of transfers from a list of ids (index becomes SortOrder).</summary>
    [HttpPost("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<int> orderedIds)
    {
        var transfers = await _db.Transfers.ToListAsync();
        for (var i = 0; i < orderedIds.Count; i++)
        {
            var t = transfers.FirstOrDefault(x => x.Id == orderedIds[i]);
            if (t is not null) t.SortOrder = i;
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
