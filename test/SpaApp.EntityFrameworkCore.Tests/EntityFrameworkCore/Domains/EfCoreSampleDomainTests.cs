using SpaApp.Samples;
using Xunit;

namespace SpaApp.EntityFrameworkCore.Domains;

[Collection(SpaAppTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<SpaAppEntityFrameworkCoreTestModule>
{

}
