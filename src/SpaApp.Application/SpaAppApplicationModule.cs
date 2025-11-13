using Microsoft.Extensions.DependencyInjection;
using SpaApp.CommentQueue;
using SpaApp.Comments;
using Volo.Abp.Account;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.AutoMapper;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement;
using Volo.Abp.SettingManagement;
using Volo.Abp.TenantManagement;

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
    typeof(AbpAspNetCoreMvcModule) 
    )]
public class SpaAppApplicationModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpAutoMapperOptions>(options =>
        {
            options.AddMaps<SpaAppApplicationModule>();
        });

        Configure<AbpAspNetCoreMvcOptions>(options =>
        {
            options.ConventionalControllers.Create(typeof(SpaAppApplicationModule).Assembly);
        });

        context.Services.AddTransient<ICaptchaService, CaptchaService>();
        context.Services.AddSingleton<ICommentQueueService, CommentQueueService>();
    }
}