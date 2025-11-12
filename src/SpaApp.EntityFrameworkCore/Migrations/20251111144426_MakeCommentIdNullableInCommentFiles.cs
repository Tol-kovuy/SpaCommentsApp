using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpaApp.Migrations
{
    /// <inheritdoc />
    public partial class MakeCommentIdNullableInCommentFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CommentFiles_AppComments_CommentId",
                table: "CommentFiles");

            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "AppComments");

            migrationBuilder.DropColumn(
                name: "FileType",
                table: "AppComments");

            migrationBuilder.AlterColumn<string>(
                name: "FilePath",
                table: "CommentFiles",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<string>(
                name: "TextContent",
                table: "CommentFiles",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommentFiles_FileType",
                table: "CommentFiles",
                column: "FileType");

            migrationBuilder.AddForeignKey(
                name: "FK_CommentFiles_AppComments_CommentId",
                table: "CommentFiles",
                column: "CommentId",
                principalTable: "AppComments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CommentFiles_AppComments_CommentId",
                table: "CommentFiles");

            migrationBuilder.DropIndex(
                name: "IX_CommentFiles_FileType",
                table: "CommentFiles");

            migrationBuilder.DropColumn(
                name: "TextContent",
                table: "CommentFiles");

            migrationBuilder.AlterColumn<string>(
                name: "FilePath",
                table: "CommentFiles",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "AppComments",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileType",
                table: "AppComments",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_CommentFiles_AppComments_CommentId",
                table: "CommentFiles",
                column: "CommentId",
                principalTable: "AppComments",
                principalColumn: "Id");
        }
    }
}
