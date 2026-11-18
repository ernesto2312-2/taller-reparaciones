@echo off
setlocal
set "ROOT=%~dp0.."
set "EXE=%ROOT%\Poket Base\pocketbase.exe"
if not exist "%EXE%" set "EXE=%ROOT%\pocketbase.exe"
if not exist "%EXE%" (
  echo No se encontro pocketbase.exe.
  echo Descarguelo de https://pocketbase.io/docs/ y coloquelo en "Poket Base\" o en la raiz del proyecto.
  exit /b 1
)
if not exist "%ROOT%\Poket Base\pb_data" mkdir "%ROOT%\Poket Base\pb_data"

echo PocketBase: %EXE%
echo Datos:       %ROOT%\Poket Base\pb_data
echo Migraciones: %ROOT%\pb_migrations
echo Hooks:       %ROOT%\pb_hooks
echo.

"%EXE%" serve --http=127.0.0.1:8090 --dir="%ROOT%\Poket Base\pb_data" --migrationsDir="%ROOT%\pb_migrations" --hooksDir="%ROOT%\pb_hooks" %*
