import re
from typing import Optional

TECH_PATTERNS = {
    "WordPress": [r"wp-content", r"wp-includes"],
    "Drupal": [r"drupal\.js", r"Drupal\.", r"sites/default"],
    "Joomla": [r"joomla", r"Joomla"],
    "Laravel": [r"laravel", r"_token"],
    "Django": [r"django", r"csrftoken", r"__admin"],
    "nginx": [r"nginx/?", re.IGNORECASE],
    "Apache": [r"Apache/?", r"Apache"],
    "IIS": [r"IIS/?", r"IIS"],
    "Node.js": [r"Node\.?js", r"Express"],
    "React": [r"react", r"__NEXT_DATA__"],
    "Angular": [r"angular", r"ng-"],
    "Vue.js": [r"vue", r"__VUE__"],
    "jQuery": [r"jquery"],
    "Bootstrap": [r"bootstrap"],
    "Cloudflare": [r"cloudflare"],
}


def fingerprint(html: str, headers: dict[str, str]) -> list[str]:
    technologies = []

    server = headers.get("Server") or headers.get("server") or headers.get("X-Powered-By")
    if server:
        for tech, patterns in TECH_PATTERNS.items():
            for pat in patterns:
                if isinstance(pat, re.Pattern):
                    if pat.search(server):
                        technologies.append(tech)
                        break
                elif isinstance(pat, str) and pat.lower() in server.lower():
                    technologies.append(tech)
                    break

    if html:
        for tech, patterns in TECH_PATTERNS.items():
            for pat in patterns:
                if isinstance(pat, re.Pattern):
                    if pat.search(html):
                        technologies.append(tech)
                        break
                elif isinstance(pat, str) and pat.lower() in html.lower():
                    technologies.append(tech)
                    break

    return list(set(technologies))


def get_server_header(headers: dict[str, str]) -> Optional[str]:
    for k, v in headers.items():
        if k.lower() in ("server", "x-powered-by", "x-generator"):
            return v
    return None
