using SpaApp.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using Volo.Abp.MultiTenancy;

namespace SpaApp.Permissions;

public class SpaAppPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(SpaAppPermissions.GroupName);

        var booksPermission = myGroup.AddPermission(SpaAppPermissions.Books.Default, L("Permission:Books"));
        booksPermission.AddChild(SpaAppPermissions.Books.Create, L("Permission:Books.Create"));
        booksPermission.AddChild(SpaAppPermissions.Books.Edit, L("Permission:Books.Edit"));
        booksPermission.AddChild(SpaAppPermissions.Books.Delete, L("Permission:Books.Delete"));
        //Define your own permissions here. Example:
        //myGroup.AddPermission(SpaAppPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<SpaAppResource>(name);
    }
}
