using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrVideo.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "admin_users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "videos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    FilePath = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    CoverPath = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Duration = table.Column<TimeSpan>(type: "interval", nullable: true),
                    ContentType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_videos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "play_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VideoId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientInfo = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    WatchedDuration = table.Column<TimeSpan>(type: "interval", nullable: true),
                    Completed = table.Column<bool>(type: "boolean", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_play_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_play_logs_videos_VideoId",
                        column: x => x.VideoId,
                        principalTable: "videos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "qr_codes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeValue = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    VideoId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_qr_codes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_qr_codes_videos_VideoId",
                        column: x => x.VideoId,
                        principalTable: "videos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "scan_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QrCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientInfo = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    FailReason = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_scan_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_scan_logs_qr_codes_QrCodeId",
                        column: x => x.QrCodeId,
                        principalTable: "qr_codes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_admin_users_Username",
                table: "admin_users",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_play_logs_VideoId",
                table: "play_logs",
                column: "VideoId");

            migrationBuilder.CreateIndex(
                name: "IX_qr_codes_CodeValue",
                table: "qr_codes",
                column: "CodeValue",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_qr_codes_VideoId",
                table: "qr_codes",
                column: "VideoId");

            migrationBuilder.CreateIndex(
                name: "IX_scan_logs_QrCodeId",
                table: "scan_logs",
                column: "QrCodeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_users");

            migrationBuilder.DropTable(
                name: "play_logs");

            migrationBuilder.DropTable(
                name: "scan_logs");

            migrationBuilder.DropTable(
                name: "qr_codes");

            migrationBuilder.DropTable(
                name: "videos");
        }
    }
}
