using Volo.Abp.Modularity;

namespace SpaApp;

[DependsOn(
    typeof(SpaAppApplicationModule),
    typeof(SpaAppDomainTestModule)
)]
public class SpaAppApplicationTestModule : AbpModule
{

}
