@echo off
echo Attempting to close Astra...

REM Try to close gracefully first
taskkill /f /im "Astra Console.exe" 2>nul
taskkill /f /im "astra-electron.exe" 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Force kill any remaining processes
wmic process where "name like '%%Astra Console%%'" call terminate 2>nul
wmic process where "name like '%%astra-electron%%'" call terminate 2>nul

REM Additional cleanup
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq Astra.exe" /fo table /nh 2^>nul') do (
    if not "%%i"=="PID" (
        taskkill /f /pid %%i 2>nul
    )
)

echo Application closure completed.
