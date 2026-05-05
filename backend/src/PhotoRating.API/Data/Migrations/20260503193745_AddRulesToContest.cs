using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhotoRating.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRulesToContest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Rules",
                table: "Contests",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rules",
                table: "Contests");
        }
    }
}
