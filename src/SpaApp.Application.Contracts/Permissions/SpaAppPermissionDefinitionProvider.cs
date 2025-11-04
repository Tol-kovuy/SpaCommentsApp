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

        var booksPermission = myGroup.AddPermission(SpaAppPermissions.Comments.Default, L("Permission:Books"));
        booksPermission.AddChild(SpaAppPermissions.Comments.Create, L("Permission:Books.Create"));
        booksPermission.AddChild(SpaAppPermissions.Comments.Edit, L("Permission:Books.Edit"));
        booksPermission.AddChild(SpaAppPermissions.Comments.Delete, L("Permission:Books.Delete"));
        //Define your own permissions here. Example:
        //myGroup.AddPermission(SpaAppPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<SpaAppResource>(name);
    }
}
