using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using PhotoRating.API.Data;
using PhotoRating.API.Filters;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration["AllowedOrigins"]?.Split(';')
            ?? ["http://localhost:3000"];
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddScoped<AdminAuthFilter>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// Serve uploaded photos as static files
var uploadPath = builder.Configuration["UploadPath"]
    ?? Path.Combine(builder.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.GetFullPath(uploadPath)),
    RequestPath = "/uploads"
});

app.UseCors();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();
