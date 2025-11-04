using SpaApp.Localization;
using Volo.Abp.Application.Services;

namespace SpaApp;

/* Inherit your application services from this class.
 */
public abstract class SpaAppAppService : ApplicationService
{
    protected SpaAppAppService()
    {
        LocalizationResource = typeof(SpaAppResource);
    }
}
