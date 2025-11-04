using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SpaApp.EntityFrameworkCore;

/* This class is needed for EF Core console commands
 * (like Add-Migration and Update-Database commands) */
public class SpaAppDbContextFactory : IDesignTimeDbContextFactory<SpaAppDbContext>
{
    public SpaAppDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();
        
        SpaAppEfCoreEntityExtensionMappings.Configure();

        var builder = new DbContextOptionsBuilder<SpaAppDbContext>()
            .UseSqlServer(configuration.GetConnectionString("Default"));
        
        return new SpaAppDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../SpaApp.DbMigrator/"))
            .AddJsonFile("appsettings.json", optional: false);

        return builder.Build();
    }
}
