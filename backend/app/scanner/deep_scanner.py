import mimetypes
import asyncio
import httpx
from Wappalyzer import Wappalyzer, WebPage
import PyPDF2
from PIL import Image
from PIL.ExifTags import TAGS

def get_wappalyzer_tech(url: str) -> list[str]:
    try:
        wappalyzer = Wappalyzer.latest()
        target_url = url if url.startswith("http") else f"https://{url}"
        webpage = WebPage.new_from_url(target_url, verify=False)
        results = wappalyzer.analyze_with_versions_and_categories(webpage)
        
        techs = []
        for tech, data in results.items():
            version = data.get("versions", [""])
            ver_str = version[0] if version else ""
            name = f"{tech} {ver_str}".strip()
            techs.append(name)
        return techs
    except Exception as e:
        return []

async def discover_web_assets(url: str) -> list[str]:
    common_paths = [
        "/robots.txt",
        "/sitemap.xml",
        "/.env",
        "/.git/config",
        "/.well-known/security.txt",
        "/wp-login.php"
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
                            except:
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
