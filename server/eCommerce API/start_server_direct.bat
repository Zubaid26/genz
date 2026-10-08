@echo off
echo ================================================================
echo Starting Virtual Try-On API Server...
echo ================================================================
echo.
echo IMPORTANT: Once the server starts, open your browser to:
echo.
echo    http://localhost:8000/docs
echo.
echo (Do not use 0.0.0.0:8000, use localhost:8000)
echo.
echo Keep this window OPEN. If you close it, the server stops.
echo ================================================================
echo.

REM Set the path to the virtual-tryon Python executable
set PYTHON_EXE=C:\Users\PC\anaconda3\envs\virtual-tryon\python.exe

REM Check if Python executable exists
if not exist "%PYTHON_EXE%" (
    echo Error: Python executable not found at "%PYTHON_EXE%"
    echo Please make sure the 'virtual-tryon' conda environment is created.
    pause
    exit /b 1
)

REM Run main.py using the specific Python executable
"%PYTHON_EXE%" main.py

pause
