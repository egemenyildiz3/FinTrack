using FinTrack.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Salary> Salaries => Set<Salary>();
    public DbSet<Transfer> Transfers => Set<Transfer>();
    public DbSet<AppSetting> Settings => Set<AppSetting>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Payment>().Property(p => p.Amount).HasColumnType("decimal(18,2)");
        b.Entity<Salary>().Property(s => s.Amount).HasColumnType("decimal(18,2)");
        b.Entity<Transfer>().Property(t => t.Amount).HasColumnType("decimal(18,2)");
        b.Entity<AppSetting>().HasKey(s => s.Key);
    }
}
