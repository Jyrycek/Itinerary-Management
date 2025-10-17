using System.Text;
using Azure.Identity;
using ItineraryManagement.Server;
using ItineraryManagement.Server.Helpers;
using ItineraryManagement.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<AppSettings>(builder.Configuration);

var vaultUri = builder.Configuration["KeyVault:Uri"];
if (string.IsNullOrWhiteSpace(vaultUri))
{
    throw new InvalidOperationException("KeyVault:Uri is missing in configuration appsettings.json");
}
builder.Configuration.AddAzureKeyVault(new Uri(vaultUri), new DefaultAzureCredential());

var keyVaultEndpoint = new Uri(vaultUri);
builder.Configuration.AddAzureKeyVault(keyVaultEndpoint, new DefaultAzureCredential());

var jwtKey = builder.Configuration["JwtPrivateKey"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("JWT private key is missing in configuration");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddMemoryCache();

builder.Services.AddAuthorization();
builder.Services.Configure<AppSettings>(builder.Configuration);
builder.Services.AddTransient<AuthService>();
builder.Services.AddTransient<DashboardService>();
builder.Services.AddHttpClient<MapService>();
builder.Services.AddTransient<UploadService>();
builder.Services.AddTransient<EmailService>();
builder.Services.AddSingleton<GeoService>(sp => new GeoService("CZE_geo.json"));
builder.Services.AddSingleton<RouteService>();
builder.Services.AddSingleton<LocationService>();
builder.Services.AddSingleton<OpenAIService>();
builder.Services.AddSingleton<ImageService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ItineraryManagement.cors",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});

builder.Configuration.AddUserSecrets<Program>();

builder.Services.AddControllers();

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(x =>
{
    x.TokenValidationParameters = new TokenValidationParameters
    {
        IssuerSigningKey = signingKey,
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "ItineraryManagement.Server",
        ValidAudience = "ItineraryManagement.Client"
    };
});


builder.Services.AddDbContext<DatabaseManager>(options => options.UseSqlServer(builder.Configuration["ConnectionStrings:UserDatabase"]));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.OperationFilter<SwaggerFileOperationFilter>();
});

var sentryDsn = builder.Configuration["Sentry"];
if (sentryDsn == null)
{
    throw new InvalidOperationException("Sentrykey is missing in azure key vault");
}

builder.WebHost.UseSentry(o =>
{
    o.Dsn = sentryDsn;
    o.Debug = true; 
    o.TracesSampleRate = 1.0;
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<DatabaseManager>();
    await dbContext.Database.EnsureCreatedAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseSentryTracing();
app.UseStaticFiles();

app.UseHttpsRedirection();
app.UseCors("ItineraryManagement.cors");

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.MapFallbackToFile("index.html");

await app.RunAsync();
