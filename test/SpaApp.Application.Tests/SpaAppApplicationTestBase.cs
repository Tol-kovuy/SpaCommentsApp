using Volo.Abp.Modularity;

namespace SpaApp;

public abstract class SpaAppApplicationTestBase<TStartupModule> : SpaAppTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
