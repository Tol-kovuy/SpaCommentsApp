FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/SpaApp.HttpApi.Host/SpaApp.HttpApi.Host.csproj", "SpaApp.HttpApi.Host/"]
COPY ["common.props", "NuGet.Config", "./"]
RUN dotnet restore "SpaApp.HttpApi.Host/SpaApp.HttpApi.Host.csproj"
COPY src/ ./src/
COPY . .
WORKDIR "/src/src/SpaApp.HttpApi.Host"
RUN dotnet build "SpaApp.HttpApi.Host.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SpaApp.HttpApi.Host.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SpaApp.HttpApi.Host.dll"]