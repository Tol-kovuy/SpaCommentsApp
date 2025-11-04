using Xunit;

namespace SpaApp.EntityFrameworkCore;

[CollectionDefinition(SpaAppTestConsts.CollectionDefinitionName)]
public class SpaAppEntityFrameworkCoreCollection : ICollectionFixture<SpaAppEntityFrameworkCoreFixture>
{

}
