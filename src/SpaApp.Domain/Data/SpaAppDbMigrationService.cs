using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using OpenIddict.Abstractions;
using SpaApp.MultiTenancy;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.MultiTenancy;
using Volo.Abp.TenantManagement;

namespace SpaApp.Data;

public class SpaAppDbMigrationService : ITransientDependency
{
    public ILogger<SpaAppDbMigrationService> Logger { get; set; }

    private readonly IDataSeeder _dataSeeder;
    private readonly IEnumerable<ISpaAppDbSchemaMigrator> _dbSchemaMigrators;
    private readonly ITenantRepository _tenantRepository;
    private readonly ICurrentTenant _currentTenant;

    public SpaAppDbMigrationService(
        IDataSeeder dataSeeder,
        ITenantRepository tenantRepository,
        ICurrentTenant currentTenant,
        IEnumerable<ISpaAppDbSchemaMigrator> dbSchemaMigrators)
    {
        _dataSeeder = dataSeeder;
        _tenantRepository = tenantRepository;
        _currentTenant = currentTenant;
        _dbSchemaMigrators = dbSchemaMigrators;

        Logger = NullLogger<SpaAppDbMigrationService>.Instance;
    }

    public async Task MigrateAsync()
    {
        var initialMigrationAdded = AddInitialMigrationIfNotExist();

        if (initialMigrationAdded)
        {
            return;
        }

        Logger.LogInformation("Started database migrations...");

        await MigrateDatabaseSchemaAsync();
        await SeedDataAsync();

        Logger.LogInformation($"Successfully completed host database migrations.");

        if (MultiTenancyConsts.IsEnabled)
        {

            var tenants = await _tenantRepository.GetListAsync(includeDetails: true);

            var migratedDatabaseSchemas = new HashSet<string>();
            foreach (var tenant in tenants)
            {
                using (_currentTenant.Change(tenant.Id))
                {
                    if (tenant.ConnectionStrings.Any())
                    {
                        var tenantConnectionStrings = tenant.ConnectionStrings
                            .Select(x => x.Value)
                            .ToList();

                        if (!migratedDatabaseSchemas.IsSupersetOf(tenantConnectionStrings))
                        {
                            await MigrateDatabaseSchemaAsync(tenant);

                            migratedDatabaseSchemas.AddIfNotContains(tenantConnectionStrings);
                        }
                    }

                    await SeedDataAsync(tenant);
                }

                Logger.LogInformation($"Successfully completed {tenant.Name} tenant database migrations.");
            }

            Logger.LogInformation("Successfully completed all database migrations.");
        }
        Logger.LogInformation("You can safely end this process...");
    }

    private async Task MigrateDatabaseSchemaAsync(Tenant? tenant = null)
    {
        Logger.LogInformation(
            $"Migrating schema for {(tenant == null ? "host" : tenant.Name + " tenant")} database...");

        foreach (var migrator in _dbSchemaMigrators)
        {
            await migrator.MigrateAsync();
        }
    }

    private async Task SeedDataAsync(Tenant? tenant = null)
    {
        Logger.LogInformation($"Executing {(tenant == null ? "host" : tenant.Name + " tenant")} database seed...");

        await _dataSeeder.SeedAsync(new DataSeedContext(tenant?.Id)
            .WithProperty(IdentityDataSeedContributor.AdminEmailPropertyName,
                SpaAppConsts.AdminEmailDefaultValue)
            .WithProperty(IdentityDataSeedContributor.AdminPasswordPropertyName,
                SpaAppConsts.AdminPasswordDefaultValue)
        );
    }

    private bool AddInitialMigrationIfNotExist()
    {
        try
        {
            if (!DbMigrationsProjectExists())
            {
                return false;
            }
        }
        catch (Exception)
        {
            return false;
        }

        try
        {
            if (!MigrationsFolderExists())
            {
                AddInitialMigration();
                return true;
            }
            else
            {
                return false;
            }
        }
        catch (Exception e)
        {
            Logger.LogWarning("Couldn't determinate if any migrations exist : " + e.Message);
            return false;
        }
    }

    private bool DbMigrationsProjectExists()
    {
        var dbMigrationsProjectFolder = GetEntityFrameworkCoreProjectFolderPath();

        return dbMigrationsProjectFolder != null;
    }

    private bool MigrationsFolderExists()
    {
        var dbMigrationsProjectFolder = GetEntityFrameworkCoreProjectFolderPath();

        return dbMigrationsProjectFolder != null && Directory.Exists(Path.Combine(dbMigrationsProjectFolder, "Migrations"));
    }

    private void AddInitialMigration()
    {
        Logger.LogInformation("Creating initial migration...");

        string argumentPrefix;
        string fileName;

        if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX) || RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            argumentPrefix = "-c";
            fileName = "/bin/bash";
        }
        else
        {
            argumentPrefix = "/C";
            fileName = "cmd.exe";
        }

        var procStartInfo = new ProcessStartInfo(fileName,
            $"{argumentPrefix} \"abp create-migration-and-run-migrator \"{GetEntityFrameworkCoreProjectFolderPath()}\"\""
        );

        try
        {
            Process.Start(procStartInfo);
        }
        catch (Exception)
        {
            throw new Exception("Couldn't run ABP CLI...");
        }
    }

    private string? GetEntityFrameworkCoreProjectFolderPath()
    {
        var slnDirectoryPath = GetSolutionDirectoryPath();

        if (slnDirectoryPath == null)
        {
            throw new Exception("Solution folder not found!");
        }

        var srcDirectoryPath = Path.Combine(slnDirectoryPath, "src");

        return Directory.GetDirectories(srcDirectoryPath)
            .FirstOrDefault(d => d.EndsWith(".EntityFrameworkCore"));
    }

    private string? GetSolutionDirectoryPath()
    {
        var currentDirectory = new DirectoryInfo(Directory.GetCurrentDirectory());

        while (currentDirectory != null && Directory.GetParent(currentDirectory.FullName) != null)
        {
            currentDirectory = Directory.GetParent(currentDirectory.FullName);

            if (currentDirectory != null && Directory.GetFiles(currentDirectory.FullName).FirstOrDefault(f => f.EndsWith(".sln")) != null)
            {
                return currentDirectory.FullName;
            }
        }

        return null;
    }

    private async Task CreateClientsAsync()
    {
        var scope = _currentTenant as IServiceProvider ??
                    (IServiceProvider)AppDomain.CurrentDomain.GetData("IServiceProvider");

        if (scope == null)
        {
            Logger.LogWarning("Cannot resolve service provider to create OpenIddict clients.");
            return;
        }

        var sp = scope.CreateScope().ServiceProvider;
        var applicationManager = sp.GetRequiredService<IOpenIddictApplicationManager>();

        await CreateClientAsync(
            applicationManager,
            name: "SpaApp_Swagger",
            displayName: "Swagger UI",
            scopes: new[] { "SpaApp" },
            grantTypes: new[] { "password", "client_credentials" },
            secret: "1q2w3e*"
        );

        await CreateClientAsync(
            applicationManager,
            name: "SpaApp_App",
            displayName: "Angular SPA",
            scopes: new[] { "SpaApp" },
            grantTypes: new[] { "authorization_code", "refresh_token", "implicit" },
            redirectUris: new[] { "http://localhost:4200" },
            postLogoutRedirectUris: new[] { "http://localhost:4200" },
            corsOrigins: new[] { "http://localhost:4200" }
        );
    }

    private static async Task CreateClientAsync(
        IOpenIddictApplicationManager applicationManager,
        string name,
        string displayName,
        string[] scopes,
        string[] grantTypes,
        string? secret = null,
        string[]? redirectUris = null,
        string[]? postLogoutRedirectUris = null,
        string[]? corsOrigins = null)
    {
        if (await applicationManager.FindByClientIdAsync(name) != null)
            return;

        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = "swagger",
            ClientSecret = "swagger-secret",
            DisplayName = "Swagger UI",
            RedirectUris =
              {
                  new Uri("https://localhost:5001/swagger/oauth2-redirect.html")
              },
                      Permissions =
              {
                  OpenIddictConstants.Permissions.Endpoints.Authorization,
                  OpenIddictConstants.Permissions.Endpoints.Token,
                  OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode,
                  OpenIddictConstants.Permissions.ResponseTypes.Code,
                  OpenIddictConstants.Permissions.Scopes.Email,
                  OpenIddictConstants.Permissions.Scopes.Profile
              }
        };

        var grantTypeMap = new Dictionary<string, string>
        {
            ["authorization_code"] = OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode,
            ["refresh_token"] = OpenIddictConstants.Permissions.GrantTypes.RefreshToken,
            ["client_credentials"] = OpenIddictConstants.Permissions.GrantTypes.ClientCredentials,
            ["password"] = OpenIddictConstants.Permissions.GrantTypes.Password
        };

        foreach (var grantType in grantTypes)
        {
            if (grantTypeMap.TryGetValue(grantType, out var permission))
                descriptor.Permissions.Add(permission);
        }
    }
}
