using FinTrack.Api.Data;
using Microsoft.Extensions.Hosting;

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
                var today = DateOnly.FromDateTime(DateTime.Now);
                var changedReceive = IncomeSchedule.ProcessDueAutoReceives(db, today);
                var changedReserved = await IncomeSchedule.ProcessReservedPaymentsAsync(db, today);
                if (changedReceive) _logger.LogInformation("Applied due auto-receives to the balance.");
                if (changedReserved) _logger.LogInformation("Applied reserved monthly payments to the balance.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auto-receive processing failed.");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }
}
