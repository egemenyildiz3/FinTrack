using FinTrack.Api.Data;

namespace FinTrack.Api.Services;

/// <summary>Periodically applies any due auto-receives to the balance.</summary>
public class AutoReceiveService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<AutoReceiveService> _logger;

    public AutoReceiveService(IServiceProvider services, ILogger<AutoReceiveService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var changed = IncomeSchedule.ProcessDueAutoReceives(db, DateOnly.FromDateTime(DateTime.Now));
                if (changed) _logger.LogInformation("Applied due auto-receives to the balance.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auto-receive processing failed.");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }
}
