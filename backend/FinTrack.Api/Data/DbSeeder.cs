using FinTrack.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        db.Database.EnsureCreated();

        db.Database.ExecuteSqlRaw(
            """
            CREATE TABLE IF NOT EXISTS "Transfers" (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_Transfers" PRIMARY KEY AUTOINCREMENT,
                "Name" TEXT NOT NULL,
                "Amount" "decimal(18,2)" NOT NULL,
                "Currency" TEXT NOT NULL,
                "Direction" TEXT NOT NULL,
                "Day" INTEGER NULL,
                "IsDone" INTEGER NOT NULL,
                "SortOrder" INTEGER NOT NULL
            );
            """);
        EnsureColumn(db, "Salaries", "ScheduleType", "TEXT NOT NULL DEFAULT 'Manual'");
        EnsureColumn(db, "Salaries", "ScheduleDay", "INTEGER NULL");
        EnsureColumn(db, "Salaries", "AutoReceive", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn(db, "Salaries", "LastReceivedYearMonth", "TEXT NULL");

        EnsureSetting(db, "TotalOwnedMoney", "0");
        EnsureSetting(db, BankSettings.Key, "ING,Revolut");
        EnsureSetting(db, CategorySettings.Key, CategorySettings.Default);
    }

    private static void EnsureSetting(AppDbContext db, string key, string value)
    {
        if (db.Settings.Any(s => s.Key == key)) return;
        db.Settings.Add(new AppSetting { Key = key, Value = value });
        db.SaveChanges();
    }

    // Adds a column to an existing SQLite table only if it isn't already present.
    private static void EnsureColumn(AppDbContext db, string table, string column, string columnDef)
    {
        var existing = db.Database
            .SqlQueryRaw<string>($"SELECT name AS \"Value\" FROM pragma_table_info('{table}')")
            .ToList();
        if (existing.Contains(column)) return;
        db.Database.ExecuteSqlRaw($"ALTER TABLE \"{table}\" ADD COLUMN \"{column}\" {columnDef}");
    }
}
