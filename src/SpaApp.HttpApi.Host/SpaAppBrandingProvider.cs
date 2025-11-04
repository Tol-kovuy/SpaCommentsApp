using Microsoft.Extensions.Localization;
using SpaApp.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace SpaApp;

[Dependency(ReplaceServices = true)]
public class SpaAppBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<SpaAppResource> _localizer;

    public SpaAppBrandingProvider(IStringLocalizer<SpaAppResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
