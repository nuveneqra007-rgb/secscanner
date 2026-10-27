import asyncio
import datetime
import httpx
from sqlalchemy.orm import Session
from androguard.core.apk import APK

from app.config import settings
from app.database import SessionLocal
from app.models.file_scan import FileScan
from app.scanner.deep_scanner import extract_file_metadata
from app.scanner.local_malware_db import check_local_malware

async def check_file_malware(file_path: str, file_hash: str) -> dict:
    try:
        with open(file_path, "rb") as f:
            content = f.read()
    except Exception as e:
        return {
            "scanned": False,
            "detected": False,
            "error": f"Cannot read file: {e}",
        }

    local_result = check_local_malware(content, is_html=False)
    vt_key = settings.VIRUSTOTAL_API_KEY
    
    if local_result["detected"] or not vt_key or settings.SCAN_MODE == "local":
        return {
            "scanned": True,
            "detected": local_result["detected"],
            "positives": local_result["positives"],
            "total": local_result["total"],
            "scan_date": datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
            "error": local_result.get("reason"),
        }
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            headers = {"x-apikey": vt_key}
            vt_resp = await client.get(
                f"https://www.virustotal.com/api/v3/files/{file_hash}",
                headers=headers,
            )

        if vt_resp.status_code == 404:
            return {
                "scanned": True,
                "detected": False,
                "positives": 0,
                "total": 0,
                "scan_date": datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
                "error": None,
            }

        if vt_resp.status_code != 200:
            return {
                "scanned": False,
                "detected": False,
                "error": f"VirusTotal API error: {vt_resp.status_code}",
            }

        data = vt_resp.json()
        attributes = data.get("data", {}).get("attributes", {})
        stats = attributes.get("last_analysis_stats", {})
        positives = stats.get("malicious", 0)
        total = sum(stats.values())

        last_analysis = attributes.get("last_analysis_date")
        scan_date_str = None
        if last_analysis:
            try:
                scan_date_str = datetime.datetime.fromtimestamp(last_analysis, datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
            except Exception:
                scan_date_str = str(last_analysis)

        return {
            "scanned": True,
            "detected": positives > 0,
            "positives": positives,
            "total": total,
            "scan_date": scan_date_str,
            "error": None,
        }
    except Exception as e:
        return {
            "scanned": False,
            "detected": False,
            "error": str(e),
        }


def analyze_apk(file_path: str) -> dict:
    try:
        apk = APK(file_path)
        if not apk.is_valid_APK():
            return None
        return {
            "package_name": apk.get_package(),
            "permissions": list(apk.get_permissions()),
            "activities": list(apk.get_activities()),
            "services": list(apk.get_services()),
        }
    except Exception:
        return None


def _compute_file_risk_level(malware: dict, apk_info: dict) -> str:
    score = 0
    if malware and malware.get("detected"):
        score += 5
    if apk_info:
        dangerous_perms = [
            "android.permission.SEND_SMS", 
            "android.permission.READ_CONTACTS",
            "android.permission.READ_SMS",
            "android.permission.RECEIVE_SMS",
            "android.permission.RECORD_AUDIO",
            "android.permission.CAMERA",
            "android.permission.ACCESS_FINE_LOCATION"
        ]
        perms = apk_info.get("permissions", [])
        for dp in dangerous_perms:
            if dp in perms:
                score += 1
    
    if score == 0:
        return "perfect"
    elif score >= 5:
        return "high"
    elif score >= 2:
        return "medium"
    return "low"


def _generate_file_recommendations(risk_level, malware, apk_info) -> list:
    recs = []
    if risk_level == 'high':
        recs.append({"title": "Evitar Ejecución del Archivo", "desc": "El archivo es altamente peligroso.", "type": "critical"})
    if malware and malware.get("scanned") and malware.get("positives", 0) > 0:
        recs.append({"title": "Infección de Malware Confirmada", "desc": f"VirusTotal reporta {malware.get('positives')} detecciones.", "type": "critical"})
    if apk_info and apk_info.get("permissions"):
        dangerous = ['READ_CONTACTS', 'READ_SMS', 'ACCESS_FINE_LOCATION', 'CAMERA', 'RECORD_AUDIO']
        perms = apk_info.get("permissions", [])
        has_dangerous = any(d in p for p in perms for d in dangerous)
        if has_dangerous:
            recs.append({"title": "Exceso de Permisos Peligrosos", "desc": "La aplicación solicita permisos altamente intrusivos.", "type": "warning"})
    if not recs:
        recs.append({"title": "Archivo Aparentemente Limpio", "desc": "No se detectaron firmas maliciosas.", "type": "info"})
    return recs

def run_file_scan(scan_id: int, file_path: str):
    db: Session = SessionLocal()
    try:
        scan = db.query(FileScan).filter(FileScan.id == scan_id).first()
        if not scan:
            return

        scan.status = "running"
        db.commit()

        malware_result = asyncio.run(check_file_malware(file_path, scan.file_hash))

        apk_info = None
        if scan.filename.lower().endswith(".apk"):
            apk_info = analyze_apk(file_path)

        file_type, metadata_info = extract_file_metadata(file_path)

        risk = _compute_file_risk_level(malware_result, apk_info)
        recs = _generate_file_recommendations(risk, malware_result, apk_info)

        scan.malware = malware_result
        scan.apk_info = apk_info
        scan.file_type = file_type
        scan.metadata_info = metadata_info
        scan.risk_level = risk
        scan.recommendations = recs
        scan.status = "completed"
        scan.completed_at = datetime.datetime.utcnow()
        db.commit()

    except Exception as e:
        scan = db.query(FileScan).filter(FileScan.id == scan_id).first()
        if scan:
            scan.status = "failed"
            scan.error = str(e)
            db.commit()
    finally:
        db.close()
