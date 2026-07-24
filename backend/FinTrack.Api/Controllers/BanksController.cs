using FinTrack.Api.Data;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BanksController : ControllerBase
{
    private readonly AppDbContext _db;
    public BanksController(AppDbContext db) => _db = db;

    /// <summary>The enabled banks (source of truth for which payments are counted).</summary>
    [HttpGet]
    public async Task<IEnumerable<string>> Get() =>
        await BankSettings.GetEnabledBanksAsync(_db);

    /// <summary>Replace the enabled banks list.</summary>
    [HttpPut]
    public async Task<IEnumerable<string>> Set([FromBody] List<string> banks)
    {
        var cleaned = banks
            .Select(b => b?.Trim() ?? "")
            .Where(b => b.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var value = string.Join(",", cleaned);
        var setting = await _db.Settings.FirstOrDefaultAsync(s => s.Key == BankSettings.Key);
        if (setting is null)
        {
            _db.Settings.Add(new AppSetting { Key = BankSettings.Key, Value = value });
        }
        else
        {
            setting.Value = value;
        }
        await _db.SaveChangesAsync();
        return cleaned;
    }
}
