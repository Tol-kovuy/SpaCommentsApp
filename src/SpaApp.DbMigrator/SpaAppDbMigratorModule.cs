using SpaApp.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace SpaApp.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(SpaAppEntityFrameworkCoreModule),
    typeof(SpaAppApplicationContractsModule)
)]
public class SpaAppDbMigratorModule : AbpModule
{
}
