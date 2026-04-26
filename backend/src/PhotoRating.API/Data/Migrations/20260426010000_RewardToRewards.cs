using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhotoRating.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class RewardToRewards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "Rewards",
                table: "Contests",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.Sql(@"
                UPDATE ""Contests""
                SET ""Rewards"" = ARRAY[""Reward""]
                WHERE ""Reward"" IS NOT NULL AND ""Reward"" <> ''
            ");

            migrationBuilder.DropColumn(
                name: "Reward",
                table: "Contests");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Reward",
                table: "Contests",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Contests""
                SET ""Reward"" = ""Rewards""[1]
                WHERE array_length(""Rewards"", 1) > 0
            ");

            migrationBuilder.DropColumn(
                name: "Rewards",
                table: "Contests");
        }
    }
}
