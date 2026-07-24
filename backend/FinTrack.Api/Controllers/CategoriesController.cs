using FinTrack.Api.Data;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<string>> Get() => await CategorySettings.GetAsync(_db);

    /// <summary>
    /// Replace the category list. Any payment whose category is no longer present is
    /// reassigned to "Other" so no payment is ever left pointing at a deleted category.
    /// </summary>
    [HttpPut]
    public async Task<IEnumerable<string>> Set([FromBody] List<string> categories)
    {
        var cleaned = categories
            .Select(c => c?.Trim() ?? "")
            .Where(c => c.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (!cleaned.Contains(CategorySettings.Fallback, StringComparer.OrdinalIgnoreCase))
            cleaned.Add(CategorySettings.Fallback);

        var value = string.Join(",", cleaned);
        var setting = await _db.Settings.FirstOrDefaultAsync(s => s.Key == CategorySettings.Key);
        if (setting is null)
            _db.Settings.Add(new AppSetting { Key = CategorySettings.Key, Value = value });
        else
            setting.Value = value;

        // Reassign orphaned payments to the fallback category.
        var allowed = new HashSet<string>(cleaned, StringComparer.OrdinalIgnoreCase);
        var payments = await _db.Payments.ToListAsync();
        foreach (var p in payments.Where(p => !allowed.Contains(p.Category)))
            p.Category = CategorySettings.Fallback;

        await _db.SaveChangesAsync();
        return cleaned;
    }
}
