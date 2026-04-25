using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhotoRating.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class SplitEndDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "EndDate",
                table: "Contests",
                newName: "UploadEndDate");

            migrationBuilder.AddColumn<DateTime>(
                name: "RatingEndDate",
                table: "Contests",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RatingEndDate",
                table: "Contests");

            migrationBuilder.RenameColumn(
                name: "UploadEndDate",
                table: "Contests",
                newName: "EndDate");
        }
    }
}
