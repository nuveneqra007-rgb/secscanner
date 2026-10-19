import httpx

SECURITY_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "X-XSS-Protection",
    "Referrer-Policy",
    "Permissions-Policy",
    "Access-Control-Allow-Origin",
]


async def check_http_headers(target: str) -> tuple[list[dict], dict[str, str]]:
    url = f"https://{target}" if not target.startswith("http") else target
    headers = {}

    try:
        async with httpx.AsyncClient(verify=False, timeout=15) as client:
            resp = await client.get(url, follow_redirects=True)
            headers = dict(resp.headers)
    except httpx.ConnectError:
        try:
            url = f"http://{target}"
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url, follow_redirects=True)
                headers = dict(resp.headers)
        except Exception as e:
            return [{"header": h, "present": False} for h in SECURITY_HEADERS], {}
    except Exception:
        return [{"header": h, "present": False} for h in SECURITY_HEADERS], {}

    results = []
    for h in SECURITY_HEADERS:
        lower = h.lower()
        found = None
        for k, v in headers.items():
            if k.lower() == lower:
                found = v
                break
        results.append({"header": h, "present": found is not None, "value": found})

    return results, headers
