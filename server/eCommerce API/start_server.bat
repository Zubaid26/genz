@echo off
echo Starting Virtual Try-On API Server...
echo.

REM Try to activate the conda environment
call conda activate virtual-tryon

if %errorlevel% neq 0 (
    echo Conda activation failed or not found. Using direct path...
    "C:\Users\PC\anaconda3\envs\virtual-tryon\python.exe" main.py
) else (
    echo Environment activated. Starting server...
    python main.py
)

pause
