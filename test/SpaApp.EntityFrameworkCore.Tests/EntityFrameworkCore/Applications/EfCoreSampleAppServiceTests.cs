using SpaApp.Samples;
using Xunit;

namespace SpaApp.EntityFrameworkCore.Applications;

[Collection(SpaAppTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<SpaAppEntityFrameworkCoreTestModule>
{

}
