@echo off
echo Setting up AptosCade Backend Development Environment...
echo.

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo Error installing dependencies!
    pause
    exit /b 1
)

echo.
echo [2/4] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo Error generating Prisma client!
    pause
    exit /b 1
)

echo.
echo [3/4] Building TypeScript...
call npm run build
if errorlevel 1 (
    echo Error building TypeScript!
    pause
    exit /b 1
)

echo.
echo [4/4] Setup complete!
echo.
echo =========================================
echo  AptosCade Backend Setup Complete!
echo =========================================
echo.
echo Next steps:
echo 1. Set up your PostgreSQL database
echo 2. Update .env file with your database URL
echo 3. Run: npm run prisma:migrate
echo 4. Run: npm run prisma:seed
echo 5. Start development: npm run dev
echo.
echo For Docker setup: docker-compose up -d
echo.
pause
