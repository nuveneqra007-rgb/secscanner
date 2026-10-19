import mimetypes
import asyncio
import re
import httpx
import PyPDF2
from PIL import Image
from PIL.ExifTags import TAGS


# ── Detección de tecnologías sin Wappalyzer (sin pkg_resources) ──────────────

_TECH_SIGNATURES: list[tuple[str, str]] = [
    # Server headers
    ("nginx", "Nginx"),
    ("apache", "Apache"),
    ("cloudflare", "Cloudflare"),
    ("litespeed", "LiteSpeed"),
    ("iis", "Microsoft IIS"),
    ("gunicorn", "Gunicorn"),
    ("uvicorn", "Uvicorn"),
    # Frameworks / CMS (en HTML o headers)
    ("wordpress", "WordPress"),
    ("wp-content", "WordPress"),
    ("joomla", "Joomla"),
    ("drupal", "Drupal"),
    ("shopify", "Shopify"),
    ("wix.com", "Wix"),
    ("squarespace", "Squarespace"),
    ("laravel", "Laravel"),
    ("django", "Django"),
    ("rails", "Ruby on Rails"),
    ("next.js", "Next.js"),
    ("nuxt", "Nuxt.js"),
    ("react", "React"),
    ("vue", "Vue.js"),
    ("angular", "Angular"),
    ("jquery", "jQuery"),
    ("bootstrap", "Bootstrap"),
    ("tailwind", "Tailwind CSS"),
    ("gatsby", "Gatsby"),
    # Analytics / Marketing
    ("google-analytics", "Google Analytics"),
    ("gtag", "Google Tag Manager"),
    ("facebook.net/en_US/fbevents", "Facebook Pixel"),
    ("hotjar", "Hotjar"),
    # CDN
    ("cdn.jsdelivr", "jsDelivr CDN"),
    ("unpkg.com", "unpkg CDN"),
    ("cdnjs.cloudflare", "cdnjs"),
    # Misc
    ("php", "PHP"),
    ("asp.net", "ASP.NET"),
    ("x-powered-by", ""),
]


def get_wappalyzer_tech(url: str) -> list[str]:
    """
    Detección de tecnologías mediante análisis de headers HTTP y HTML.
    Reemplaza python-Wappalyzer sin depender de pkg_resources.
    """
    try:
        target_url = url if url.startswith("http") else f"https://{url}"
        with httpx.Client(timeout=8, verify=False, follow_redirects=True) as client:
            resp = client.get(target_url)
    except Exception:
        return []

    detected: set[str] = set()
    content = resp.text.lower()
    headers_str = " ".join(f"{k}: {v}" for k, v in resp.headers.items()).lower()

    # X-Powered-By header
    powered_by = resp.headers.get("x-powered-by", "")
    if powered_by:
        detected.add(powered_by)

    # Server header
    server = resp.headers.get("server", "")
    if server:
        detected.add(server)

    # Buscar en headers + HTML
    combined = content + " " + headers_str
    for pattern, name in _TECH_SIGNATURES:
        if pattern.lower() in combined and name:
            detected.add(name)

    # Generator meta tag
    gen = re.search(r'<meta[^>]+name=["\']generator["\'][^>]+content=["\'](.*?)["\']', resp.text, re.I)
    if gen:
        detected.add(gen.group(1))

    return sorted(detected)


async def discover_web_assets(url: str) -> list[str]:
    common_paths = [
        "/robots.txt",
        "/sitemap.xml",
        "/.env",
        "/.git/config",
        "/.well-known/security.txt",
        "/wp-login.php",
        "/admin",
        "/api",
    ]
    target_url = url if url.startswith("http") else f"https://{url}"
    if target_url.endswith("/"):
        target_url = target_url[:-1]

    found = []
    async with httpx.AsyncClient(timeout=5, verify=False) as client:
        for path in common_paths:
            try:
                resp = await client.get(target_url + path)
                if resp.status_code in (200, 301, 302, 403):
                    if ".env" in path or "config" in path:
                        if "html" in resp.headers.get("content-type", "").lower() and resp.status_code == 200:
                            continue
                    found.append(f"{path} ({resp.status_code})")
            except Exception:
                continue
    return found


def extract_file_metadata(file_path: str) -> tuple[str, dict]:
    mime_type, _ = mimetypes.guess_type(file_path)
    file_type = mime_type or "application/octet-stream"
    metadata = {}

    try:
        if file_type.startswith("image/"):
            with Image.open(file_path) as img:
                metadata["format"] = img.format
                metadata["mode"] = img.mode
                metadata["size"] = f"{img.width}x{img.height}"
                exifdata = img.getexif()
                if exifdata:
                    exif_info = {}
                    for tag_id in exifdata:
                        tag = TAGS.get(tag_id, tag_id)
                        data = exifdata.get(tag_id)
                        if isinstance(data, bytes):
                            try:
                                data = data.decode()
                            except Exception:
                                data = str(data)
                        exif_info[str(tag)] = str(data)
                    metadata["exif"] = dict(list(exif_info.items())[:20])

        elif file_type == "application/pdf":
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                info = reader.metadata
                if info:
                    metadata = {k.strip("/"): str(v) for k, v in info.items()}
                metadata["pages"] = len(reader.pages)

    except Exception as e:
        metadata["error"] = str(e)

    return file_type, metadata
