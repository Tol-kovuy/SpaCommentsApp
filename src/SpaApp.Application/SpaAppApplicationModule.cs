using Volo.Abp.PermissionManagement;
using Volo.Abp.SettingManagement;
using Volo.Abp.Account;
using Volo.Abp.Identity;
using Volo.Abp.AutoMapper;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Modularity;
using Volo.Abp.TenantManagement;
using Volo.Abp.AspNetCore.Mvc; // Теперь это будет работать

namespace SpaApp;

[DependsOn(
    typeof(SpaAppDomainModule),
    typeof(SpaAppApplicationContractsModule),
    typeof(AbpPermissionManagementApplicationModule),
    typeof(AbpFeatureManagementApplicationModule),
    typeof(AbpIdentityApplicationModule),
    typeof(AbpAccountApplicationModule),
    typeof(AbpTenantManagementApplicationModule),
    typeof(AbpSettingManagementApplicationModule),
    typeof(AbpAspNetCoreMvcModule) // Добавьте эту зависимость
    )]
public class SpaAppApplicationModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        // Настройка AutoMapper
        Configure<AbpAutoMapperOptions>(options =>
        {
            options.AddMaps<SpaAppApplicationModule>();
        });

        // Настройка Conventional Controllers
        Configure<AbpAspNetCoreMvcOptions>(options =>
        {
            options.ConventionalControllers.Create(typeof(SpaAppApplicationModule).Assembly);
        });
    }
}