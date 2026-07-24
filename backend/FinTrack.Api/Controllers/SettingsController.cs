using FinTrack.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

public record SettingDto(string Value);

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;
    public SettingsController(AppDbContext db) => _db = db;

    [HttpGet("{key}")]
    public async Task<ActionResult<SettingDto>> Get(string key)
    {
        var s = await _db.Settings.FirstOrDefaultAsync(x => x.Key == key);
        return Ok(new SettingDto(s?.Value ?? ""));
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Set(string key, SettingDto dto)
    {
        var s = await _db.Settings.FirstOrDefaultAsync(x => x.Key == key);
        if (s is null)
        {
            s = new Models.AppSetting { Key = key, Value = dto.Value };
            _db.Settings.Add(s);
        }
        else
        {
            s.Value = dto.Value;
        }
        await _db.SaveChangesAsync();
        return Ok(new SettingDto(s.Value));
    }
}
