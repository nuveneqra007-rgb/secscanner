import asyncio
import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.scan import Scan
from app.scanner.port_scanner import scan_ports
from app.scanner.http_auditor import check_http_headers
from app.scanner.ssl_checker import check_ssl
from app.scanner.fingerprinter import fingerprint, get_server_header
from app.scanner.malware_checker import check_malware
from app.scanner.deep_scanner import get_wappalyzer_tech, discover_web_assets

def _compute_risk_level(ports: list, http_headers: list, ssl: dict, fingerprint_data: dict, malware: dict, assets: list) -> str:
    score = 0

    if ports:
        critical_ports = {21, 23, 3389, 3306, 5432, 6379}
        open_critical = sum(1 for p in ports if p.get("port") in critical_ports)
        open_total = len(ports)
        if open_total > 5 or open_critical > 1:
            score += 3
        elif open_total > 2 or open_critical > 0:
            score += 2

    if http_headers:
        present = sum(1 for h in http_headers if h.get("present"))
        if present < 4:
            score += 3
        elif present < 7:
            score += 2

    if ssl:
        days = ssl.get("days_remaining")
        if days is None or days < 0:
            score += 3
        elif days < 7:
            score += 3
        elif days < 30:
            score += 2

    if fingerprint_data and fingerprint_data.get("server"):
        score += 2
        
    if assets:
        for a in assets:
            if ".env" in a or "config" in a or "wp-login" in a:
                score += 3

    if malware and malware.get("detected"):
        score += 3

    if score == 0:
        return "perfect"
    elif score >= 10:
        return "high"
    elif score >= 5:
        return "medium"
    return "low"


def _generate_recommendations(risk_level, ports, http_headers, ssl, malware, assets) -> list:
    recs = []
    if risk_level == 'high':
        recs.append({"title": "Atención Inmediata Requerida", "desc": "El objetivo presenta múltiples fallos críticos.", "type": "critical"})
    if ssl and not ssl.get("valid") and not ssl.get("error"):
        recs.append({"title": "Renovar/Corregir Certificado SSL", "desc": "El certificado actual es inválido o ha expirado.", "type": "critical"})
    if http_headers:
        missing = [h for h in http_headers if not h.get("present")]
        if len(missing) > 3:
            recs.append({"title": "Endurecer Cabeceras HTTP", "desc": f"Faltan {len(missing)} cabeceras de seguridad importantes.", "type": "warning"})
    if ports and len(ports) > 3:
        recs.append({"title": "Revisar Exposición de Puertos", "desc": f"Se detectaron {len(ports)} puertos abiertos.", "type": "warning"})
    if assets and len(assets) > 0:
        recs.append({"title": "Ocultar Rutas Sensibles", "desc": "Se encontraron rutas expuestas.", "type": "critical"})
    if malware and malware.get("detected"):
        recs.append({"title": "Investigar Infección por Malware", "desc": "VirusTotal reporta detecciones.", "type": "critical"})
    if not recs:
        recs.append({"title": "Mantener Monitoreo Continuo", "desc": "No se encontraron problemas graves.", "type": "info"})
    return recs

def run_scan(scan_id: int):
    db: Session = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return

        scan.status = "running"
        db.commit()

        ports = scan_ports(scan.target, "80,443,22,21,23,25,53,110,143,3306,3389,5432,6379,8080,8443")

        headers_list, raw_headers = asyncio.run(check_http_headers(scan.target))
        http_headers = headers_list
        server_h = get_server_header(raw_headers)
        
        # Deep Web Scanning
        techs = fingerprint("", raw_headers) if server_h else []
        wappalyzer_techs = get_wappalyzer_tech(scan.target)
        merged_techs = list(set(techs + wappalyzer_techs))
        
        assets = asyncio.run(discover_web_assets(scan.target))

        fingerprint_result = {
            "server": server_h or "Unknown",
            "technologies": merged_techs,
            "raw_headers": dict(list(raw_headers.items())[:30]),
        }

        ssl_result = check_ssl(scan.target)

        malware_result = asyncio.run(check_malware(scan.target))

        risk = _compute_risk_level(ports, http_headers, ssl_result, fingerprint_result, malware_result, assets)
        recs = _generate_recommendations(risk, ports, http_headers, ssl_result, malware_result, assets)

        scan.ports = ports
        scan.http_headers = http_headers
        scan.ssl = ssl_result
        scan.fingerprint = fingerprint_result
        scan.malware = malware_result
        scan.discovered_assets = assets
        scan.risk_level = risk
        scan.recommendations = recs
        scan.status = "completed"
        scan.completed_at = datetime.datetime.utcnow()
        db.commit()

    except Exception as e:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            scan.status = "failed"
            scan.error = str(e)
            db.commit()
    finally:
        db.close()
