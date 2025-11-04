using System.Threading.Tasks;

namespace SpaApp.Data;

public interface ISpaAppDbSchemaMigrator
{
    Task MigrateAsync();
}
