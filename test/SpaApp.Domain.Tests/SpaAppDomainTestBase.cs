using Volo.Abp.Modularity;

namespace SpaApp;

/* Inherit from this class for your domain layer tests. */
public abstract class SpaAppDomainTestBase<TStartupModule> : SpaAppTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
