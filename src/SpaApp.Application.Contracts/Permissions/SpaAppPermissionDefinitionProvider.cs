using SpaApp.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using Volo.Abp.MultiTenancy;

namespace SpaApp.Permissions;

public class SpaAppPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var commentGroup = context.AddGroup(SpaAppPermissions.GroupName, L("Permission:SpaApp"));

        var comments = commentGroup.AddPermission(SpaAppPermissions.Comments.Default, L("Permission:Comments"));
        comments.AddChild(SpaAppPermissions.Comments.Create, L("Permission:Comments.Create"));
        comments.AddChild(SpaAppPermissions.Comments.Edit, L("Permission:Comments.Edit"));
        comments.AddChild(SpaAppPermissions.Comments.Delete, L("Permission:Comments.Delete"));
        //Define your own permissions here. Example:
        //myGroup.AddPermission(SpaAppPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<SpaAppResource>(name);
    }
}