import time
from collections import defaultdict
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting por IP para proteger endpoints sensibles.
    Usa una ventana deslizante simple en memoria.
    """

    # (ip, path_prefix) -> list of timestamps
    _requests: dict = defaultdict(list)

    # Configuración: (path_prefix, max_requests, window_seconds)
    LIMITS = [
        ("/auth/login", 10, 60),       # 10 intentos por minuto
        ("/auth/register", 5, 60),     # 5 registros por minuto
        ("/scans", 20, 60),            # 20 escaneos por minuto (autenticados o no)
        ("/file-scans", 10, 60),       # 10 escaneos de archivo por minuto
    ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        client_ip = self._get_client_ip(request)
        now = time.time()

        for prefix, max_req, window in self.LIMITS:
            if path.startswith(prefix) and request.method in ("POST",):
                key = (client_ip, prefix)
                # Limpiar timestamps fuera de la ventana
                self._requests[key] = [
                    ts for ts in self._requests[key] if now - ts < window
                ]
                if len(self._requests[key]) >= max_req:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": f"Demasiadas solicitudes. Intenta en {window} segundos.",
                            "retry_after": window,
                        },
                        headers={"Retry-After": str(window)},
                    )
                self._requests[key].append(now)
                break

        return await call_next(request)

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """Obtiene la IP real del cliente, considerando proxies."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
