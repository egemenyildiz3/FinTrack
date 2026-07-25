using System.Text.Json;
using FinTrack.Api.Controllers;
using FinTrack.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Services;

/// <summary>
/// On the 1st of each month, writes a full JSON backup into a "backups" folder next to
/// the SQLite database (inside the mounted volume), so data is snapshotted automatically.
/// Idempotent: at most one file per month. Keeps the most recent 12 backups.
/// </summary>
public class MonthlyBackupService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IConfiguration _config;
    private readonly ILogger<MonthlyBackupService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private const int KeepMonths = 12;

    public MonthlyBackupService(
        IServiceProvider services, IConfiguration config, ILogger<MonthlyBackupService> logger)
    {
        _services = services;
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await WriteBackupIfDueAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Monthly backup failed.");
            }

            // Poll a few times a day so the backup lands sometime on the 1st.
            await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
        }
    }

    private async Task WriteBackupIfDueAsync()
    {
        var today = DateTime.Now;
        if (today.Day != 1) return; // only on the 1st of the month

        var dir = GetBackupDir();
        Directory.CreateDirectory(dir);

        var file = Path.Combine(dir, $"fintrack-backup-{today:yyyy-MM}.json");
        if (File.Exists(file)) return; // this month is already backed up

        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var data = new BackupData
        {
            Version = 1,
            ExportedAt = DateTime.UtcNow,
            Payments = await db.Payments.OrderBy(p => p.SortOrder).ToListAsync(),
            Salaries = await db.Salaries.OrderBy(s => s.Id).ToListAsync(),
            Transfers = await db.Transfers.OrderBy(t => t.SortOrder).ToListAsync(),
            Settings = await db.Settings.ToListAsync(),
        };

        await File.WriteAllTextAsync(file, JsonSerializer.Serialize(data, JsonOptions));
        _logger.LogInformation("Wrote monthly backup: {File}", file);

        Prune(dir);
    }

    // Backups live next to the database file (e.g. /data/backups) so they're in the volume.
    private string GetBackupDir()
    {
        var dbPath = _config["DB_PATH"] ?? "fintrack.db";
        var dbDir = Path.GetDirectoryName(Path.GetFullPath(dbPath)) ?? ".";
        return Path.Combine(dbDir, "backups");
    }

    private void Prune(string dir)
    {
        var stale = Directory
            .GetFiles(dir, "fintrack-backup-*.json")
            .OrderByDescending(f => f) // filenames sort chronologically (yyyy-MM)
            .Skip(KeepMonths)
            .ToList();

        foreach (var f in stale)
        {
            try { File.Delete(f); }
            catch (Exception ex) { _logger.LogWarning(ex, "Could not delete old backup {File}", f); }
        }
    }
}
