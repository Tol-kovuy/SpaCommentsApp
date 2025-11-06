using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpaApp.Migrations
{
    /// <inheritdoc />
    public partial class CommentIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppComments_AppComments_ParentId",
                table: "AppComments");

            migrationBuilder.RenameIndex(
                name: "IX_AppComments_ParentId",
                table: "AppComments",
                newName: "IX_Comments_ParentId");

            migrationBuilder.AlterColumn<string>(
                name: "Text",
                table: "AppComments",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2048)",
                oldMaxLength: 2048);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_CreationTime",
                table: "AppComments",
                column: "CreationTime");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_Email",
                table: "AppComments",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_ParentId_CreationTime",
                table: "AppComments",
                columns: new[] { "ParentId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Comments_UserName",
                table: "AppComments",
                column: "UserName");

            migrationBuilder.AddForeignKey(
                name: "FK_AppComments_AppComments_ParentId",
                table: "AppComments",
                column: "ParentId",
                principalTable: "AppComments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppComments_AppComments_ParentId",
                table: "AppComments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_CreationTime",
                table: "AppComments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_Email",
                table: "AppComments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_ParentId_CreationTime",
                table: "AppComments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_UserName",
                table: "AppComments");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_ParentId",
                table: "AppComments",
                newName: "IX_AppComments_ParentId");

            migrationBuilder.AlterColumn<string>(
                name: "Text",
                table: "AppComments",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(4000)",
                oldMaxLength: 4000);

            migrationBuilder.AddForeignKey(
                name: "FK_AppComments_AppComments_ParentId",
                table: "AppComments",
                column: "ParentId",
                principalTable: "AppComments",
                principalColumn: "Id");
        }
    }
}
