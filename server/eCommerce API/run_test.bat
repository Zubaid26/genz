@echo off
set PYTHON_EXE=C:\Users\PC\anaconda3\envs\virtual-tryon\python.exe

if not exist "%PYTHON_EXE%" (
    echo Error: Python executable not found.
    pause
    exit /b 1
)

"%PYTHON_EXE%" test_server.py
pause
