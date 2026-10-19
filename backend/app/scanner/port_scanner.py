import socket
from typing import Optional


def scan_ports(target: str, port_list: str) -> list[dict]:
    open_ports = []
    ports = [int(p.strip()) for p in port_list.split(",") if p.strip().isdigit()]

    for port in ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.5)
            result = sock.connect_ex((target, port))
            if result == 0:
                service = _get_service_name(port)
                open_ports.append({"port": port, "state": "open", "service": service})
            sock.close()
        except Exception:
            pass

    return open_ports


def _get_service_name(port: int) -> Optional[str]:
    common = {
        21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
        80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 3306: "MySQL",
        3389: "RDP", 5432: "PostgreSQL", 6379: "Redis", 8080: "HTTP-Proxy",
        8443: "HTTPS-Alt",
    }
    return common.get(port)
