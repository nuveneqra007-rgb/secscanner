#!/bin/bash

# SecScanner - Script de Arranque Unificado (Modo Local)

echo "=============================================="
echo "    Iniciando SecScanner (Modo Local)         "
echo "=============================================="

# 1. Backend
echo "[*] Iniciando Backend..."
cd backend

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "[*] Creando entorno virtual de Python..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "[*] Instalando dependencias del Backend..."
pip install -r requirements.txt > /dev/null

# Arrancar backend en segundo plano
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "[+] Backend iniciado (PID: $BACKEND_PID) en http://localhost:8000"

# Volver a la raíz
cd ..

# 2. Frontend
echo "[*] Iniciando Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "[*] Instalando dependencias del Frontend..."
    npm install > /dev/null
fi

# Arrancar frontend en segundo plano
npm run dev &
FRONTEND_PID=$!
echo "[+] Frontend iniciado (PID: $FRONTEND_PID) en http://localhost:5173"

echo "=============================================="
echo " SecScanner está en ejecución.                "
echo " Accede a http://localhost:5173               "
echo " Presiona Ctrl+C para detener todos los       "
echo " servicios.                                   "
echo "=============================================="

# Guardar PIDs para stop.sh
echo $BACKEND_PID > ../.backend.pid
echo $FRONTEND_PID > ../.frontend.pid

# Capturar Ctrl+C
trap "echo -e '\n[*] Deteniendo servicios...'; kill $BACKEND_PID $FRONTEND_PID; rm ../.backend.pid ../.frontend.pid; exit" INT TERM

# Esperar a que terminen
wait
