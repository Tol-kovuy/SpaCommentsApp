using SpaApp.Books;
using Xunit;

namespace SpaApp.EntityFrameworkCore.Applications.Books;

[Collection(SpaAppTestConsts.CollectionDefinitionName)]
public class EfCoreBookAppService_Tests : BookAppService_Tests<SpaAppEntityFrameworkCoreTestModule>
{

}