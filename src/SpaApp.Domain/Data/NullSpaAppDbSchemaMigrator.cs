using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace SpaApp.Data;

/* This is used if database provider does't define
 * ISpaAppDbSchemaMigrator implementation.
 */
public class NullSpaAppDbSchemaMigrator : ISpaAppDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
