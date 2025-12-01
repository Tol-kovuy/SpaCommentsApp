@ECHO off
cls

if "%1"=="" goto :error
ECHO Base folder: %1

ECHO IIS stop
iisreset /stop
ECHO.

ECHO Deleting all generated folders...
ECHO.

FOR /d /r %1 %%d in (bin,obj,logs) DO (
	IF EXIST "%%d" (		 	 
		ECHO %%d | FIND /I "\node_modules\" > Nul && ( 
			ECHO.Skipping: %%d
		) || (
			ECHO.Deleting: %%d
			rd /s/q "%%d"
		)
	)
)

ECHO.
ECHO.All generated folders have been successfully deleted.

ECHO IIS start
iisreset /start
ECHO.

ECHO.Press any key to exit.
goto :exit 

:error
echo delete-folders: folder path parameter is not valid. enter valid existing directory path
exit /b 1

:exit 
exit /b 0