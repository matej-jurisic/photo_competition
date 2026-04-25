FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /app

COPY src/PhotoRating.API/*.csproj ./PhotoRating.API/
COPY src/PhotoRating.API/ ./PhotoRating.API/

RUN dotnet restore PhotoRating.API/PhotoRating.API.csproj
RUN dotnet publish PhotoRating.API/PhotoRating.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5000

EXPOSE 5000

ENTRYPOINT ["dotnet", "PhotoRating.API.dll"]
