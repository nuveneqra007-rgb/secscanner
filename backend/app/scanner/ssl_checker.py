import ssl
import socket
from datetime import datetime


def check_ssl(target: str) -> dict:
    host = target.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]

    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                cert = ssock.getpeercert()

        issuer = dict(cert.get("issuer", []))
        subject = dict(cert.get("subject", []))
        valid_from = cert.get("notBefore")
        valid_to = cert.get("notAfter")

        issuer_str = ", ".join(f"{k}={v}" for item in cert.get("issuer", []) for k, v in item)
        subject_str = ", ".join(f"{k}={v}" for item in cert.get("subject", []) for k, v in item)

        if valid_to:
            exp_date = datetime.strptime(valid_to, "%b %d %H:%M:%S %Y %Z")
            days_remaining = (exp_date - datetime.utcnow()).days
        else:
            days_remaining = None

        return {
            "valid": days_remaining is not None and days_remaining > 0,
            "issuer": issuer_str,
            "subject": subject_str,
            "valid_from": valid_from,
            "valid_to": valid_to,
            "days_remaining": days_remaining,
            "error": None,
        }
    except Exception as e:
        return {
            "valid": False,
            "issuer": None,
            "subject": None,
            "valid_from": None,
            "valid_to": None,
            "days_remaining": None,
            "error": str(e),
        }
