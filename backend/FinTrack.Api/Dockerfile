# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY FinTrack.Api.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o /app

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

# Store the SQLite database on a mounted volume so data survives restarts.
ENV DB_PATH=/data/fintrack.db
ENV ASPNETCORE_URLS=http://+:8080
RUN mkdir -p /data
VOLUME /data

EXPOSE 8080
ENTRYPOINT ["dotnet", "FinTrack.Api.dll"]
