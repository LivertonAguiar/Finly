@echo off
echo ========================================================
echo   Finly - Script de Compilacao Local de APK Android
echo ========================================================

echo.
echo [1/3] Compilando aplicacao web com Vite e TypeScript...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao compilar o bundle web.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Sincronizando assets e configuracoes com Capacitor Android...
call npx.cmd cap sync android
if %errorlevel% neq 0 (
    echo [ERRO] Falha na sincronizacao do Capacitor.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Verificando ambiente Gradle e compilando APK...
cd android
call gradlew.bat assembleDebug
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ========================================================
    echo  SUCESSO! APK gerado com sucesso:
    echo  android\app\build\outputs\apk\debug\app-debug.apk
    echo ========================================================
) else (
    echo.
    echo [INFO] Para compilar localmente na maquina, e necessario ter:
    echo   1. JDK 17 ou 21 instalado (variavel JAVA_HOME configurada)
    echo   2. Android SDK Command-line Tools (variavel ANDROID_HOME configurada)
    echo   OU abrir diretamente no Android Studio com: npm run cap:open
    echo   OU usar o workflow automatizado do GitHub Actions em .github/workflows/build-apk.yml
)
pause
