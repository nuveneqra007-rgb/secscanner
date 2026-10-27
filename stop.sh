#!/bin/bash

echo "[*] Deteniendo SecScanner..."

if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null
    rm .backend.pid
    echo "[+] Backend (PID $BACKEND_PID) detenido."
else
    echo "[-] No se encontró PID del backend."
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    # En Node/Vite a veces kill no mata los subprocesos. Hacemos un kill al proceso hijo si es necesario, 
    # pero el kill directo al npm suele bastar o pkill -P
    pkill -P $FRONTEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    rm .frontend.pid
    echo "[+] Frontend (PID $FRONTEND_PID) detenido."
else
    echo "[-] No se encontró PID del frontend."
fi

# Por si quedaron colgados
pkill -f "uvicorn app.main:app"
pkill -f "vite"

echo "SecScanner detenido completamente."
