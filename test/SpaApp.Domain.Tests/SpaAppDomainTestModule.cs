using Volo.Abp.Modularity;

namespace SpaApp;

[DependsOn(
    typeof(SpaAppDomainModule),
    typeof(SpaAppTestBaseModule)
)]
public class SpaAppDomainTestModule : AbpModule
{

}
