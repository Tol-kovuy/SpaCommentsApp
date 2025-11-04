using SpaApp.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace SpaApp.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class SpaAppController : AbpControllerBase
{
    protected SpaAppController()
    {
        LocalizationResource = typeof(SpaAppResource);
    }
}
