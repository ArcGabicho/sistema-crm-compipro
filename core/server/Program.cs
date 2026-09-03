using Server.Config;

var builder = WebApplication.CreateBuilder(args);

builder.AddCrm();

var app = builder.Build();

await app.UseCrmAsync();

app.Run();
