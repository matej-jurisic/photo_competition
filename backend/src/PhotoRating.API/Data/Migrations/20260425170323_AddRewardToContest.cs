using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhotoRating.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRewardToContest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Reward",
                table: "Contests",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Reward",
                table: "Contests");
        }
    }
}
