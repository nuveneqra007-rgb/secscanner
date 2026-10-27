FROM python:3.12-slim

WORKDIR /app

# Dependencias del sistema necesarias para psycopg2, androguard y Wappalyzer
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data /app/data/uploads

EXPOSE 8000

# Puerto configurable via env var (Koyeb usa PORT)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
