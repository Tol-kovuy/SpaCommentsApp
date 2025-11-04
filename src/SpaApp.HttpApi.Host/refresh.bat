@echo off
echo =======================================
echo 🔄 Updating Angular service proxies...
echo =======================================

cd /d "%~dp0SpaApp.HttpApi.Host"
nswag run service.config.nswag

echo.
echo Service proxies successfully refreshed!
pause