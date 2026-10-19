export interface PortInfo {
  port: number
  state: string
  service: string | null
}

export interface HttpHeaderResult {
  header: string
  present: boolean
  value: string | null
}

export interface SslResult {
  valid: boolean
  issuer: string | null
  subject: string | null
  valid_from: string | null
  valid_to: string | null
  days_remaining: number | null
  error: string | null
}

export interface FingerprintResult {
  server: string | null
  technologies: string[]
  raw_headers: Record<string, string>
}

export interface MalwareResult {
  scanned: boolean
  detected: boolean
  positives: number | null
  total: number | null
  scan_date: string | null
  error: string | null
}

export interface Scan {
  id: number
  target: string
  status: string
  risk_level: string | null
  ports: PortInfo[] | null
  http_headers: HttpHeaderResult[] | null
  ssl: SslResult | null
  fingerprint: FingerprintResult | null
  malware: MalwareResult | null
  discovered_assets: string[] | null
  error: string | null
  created_at: string
  completed_at: string | null
}

export interface ScanListItem {
  id: number
  target: string
  status: string
  risk_level: string | null
  created_at: string
  completed_at: string | null
}

export interface PaginatedScans {
  items: ScanListItem[]
  total: number
  page: number
  page_size: number
}

export interface ScanCreate {
  target: string
  ports?: string
  scan_ports?: boolean
  scan_http?: boolean
  scan_ssl?: boolean
  scan_fingerprint?: boolean
  scan_malware?: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface ApkInfoResult {
  package_name: string | null
  permissions: string[]
  activities: string[]
  services: string[]
}

export interface FileScan {
  id: number
  filename: string
  file_hash: string
  file_size: number
  status: string
  risk_level: string | null
  file_type: string | null
  metadata_info: Record<string, any> | null
  malware: MalwareResult | null
  apk_info: ApkInfoResult | null
  error: string | null
  created_at: string
  completed_at: string | null
}

export interface FileScanListItem {
  id: number
  filename: string
  status: string
  risk_level: string | null
  created_at: string
}

export interface PaginatedFileScans {
  items: FileScanListItem[]
  total: number
  page: number
  page_size: number
}

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  is_admin: boolean
  created_at: string
}

export interface RegisterRequest {
  username: string
  email: string
  full_name: string
  password: string
}
