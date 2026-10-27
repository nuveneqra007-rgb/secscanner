import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Shield, Globe, Lock, Fingerprint, Bug, ChevronDown, ChevronUp, Download, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getScan } from '../api/scans'
import RiskBadge from '../components/Shared/RiskBadge'
import StatusBadge from '../components/Shared/StatusBadge'
import type { Scan } from '../types'

function PortSection({ scan }: { scan: Scan }) {
  const [open, setOpen] = useState(true)
  if (!scan.ports) return null
  return (
    <SectionCard icon={<Globe className="w-5 h-5 text-indigo-400" />} title="Puertos Abiertos" open={open} onToggle={() => setOpen(!open)}>
      {scan.ports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-slate-500 bg-slate-900/30 rounded-lg border border-slate-800">
          <Shield className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Ningún puerto abierto en el rango escaneado</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700/50">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Puerto</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Servicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 bg-slate-900/50">
              {scan.ports.map((p) => (
                <tr key={p.port} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-300">{p.port}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> open
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p.service || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}

function HttpSection({ scan }: { scan: Scan }) {
  const [open, setOpen] = useState(true)
  if (!scan.http_headers) return null
  const present = scan.http_headers.filter((h) => h.present).length
  return (
    <SectionCard icon={<Shield className="w-5 h-5 text-indigo-400" />} title="Headers HTTP de Seguridad" open={open} onToggle={() => setOpen(!open)}>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
        <p className="text-sm text-slate-400">Análisis de cabeceras de seguridad recomendadas</p>
        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-300 border border-slate-700">
          Score: {present}/{scan.http_headers.length}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scan.http_headers.map((h) => (
          <div key={h.header} className={`flex items-center justify-between p-3 rounded-lg border ${h.present ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
            <span className="font-mono text-xs text-slate-300">{h.header}</span>
            {h.present ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function SslSection({ scan }: { scan: Scan }) {
  const [open, setOpen] = useState(true)
  if (!scan.ssl) return null
  const ssl = scan.ssl
  return (
    <SectionCard icon={<Lock className="w-5 h-5 text-indigo-400" />} title="Certificado SSL/TLS" open={open} onToggle={() => setOpen(!open)}>
      <div className="space-y-4 text-sm">
        {ssl.error ? (
          <div className="flex gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{ssl.error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 flex flex-wrap items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium border ${ssl.valid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {ssl.valid ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {ssl.valid ? 'Certificado Válido' : 'Certificado Inválido'}
              </div>
              {ssl.days_remaining !== null && (
                <div className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                  ssl.days_remaining > 30 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  ssl.days_remaining > 7 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                  'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {ssl.days_remaining} días restantes
                </div>
              )}
            </div>
            
            <div className="space-y-3 p-4 bg-slate-900/30 rounded-xl border border-slate-800">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Emisor (CA)</p>
                <p className="text-slate-200 font-medium">{ssl.issuer || 'Desconocido'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Sujeto (Dominio)</p>
                <p className="text-slate-200 font-medium">{ssl.subject || 'Desconocido'}</p>
              </div>
            </div>
            
            <div className="space-y-3 p-4 bg-slate-900/30 rounded-xl border border-slate-800">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Válido Desde</p>
                <p className="text-slate-200">{ssl.valid_from || 'Desconocido'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Válido Hasta</p>
                <p className="text-slate-200">{ssl.valid_to || 'Desconocido'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function FingerprintSection({ scan }: { scan: Scan }) {
  const [open, setOpen] = useState(true)
  if (!scan.fingerprint) return null
  const fp = scan.fingerprint
  return (
    <SectionCard icon={<Fingerprint className="w-5 h-5 text-indigo-400" />} title="Reconocimiento Tecnológico" open={open} onToggle={() => setOpen(!open)}>
      <div className="space-y-4 text-sm">
        {fp.server && (
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Software de Servidor</span>
            <span className="font-mono bg-slate-800 px-3 py-1 rounded text-slate-200">{fp.server}</span>
          </div>
        )}
        
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Tecnologías Detectadas</p>
          {fp.technologies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {fp.technologies.map((t) => (
                <span key={t} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-sm font-medium shadow-sm">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-slate-900/30 rounded-xl border border-slate-800 text-slate-400">
              <Info className="w-4 h-4" />
              <p>No se detectaron tecnologías específicas o frameworks.</p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  )
}

function MalwareSection({ scan }: { scan: Scan }) {
  const [open, setOpen] = useState(true)
  if (!scan.malware) return null
  const mw = scan.malware
  return (
    <SectionCard icon={<Bug className="w-5 h-5 text-indigo-400" />} title="Análisis de Reputación (VirusTotal)" open={open} onToggle={() => setOpen(!open)}>
      <div className="space-y-4 text-sm">
        {mw.error ? (
          <div className="flex gap-3 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-yellow-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{mw.error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`col-span-1 md:col-span-2 p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              mw.detected 
                ? 'bg-red-500/10 border-red-500/20' 
                : mw.scanned 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-slate-800 border-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                {mw.detected ? (
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                ) : mw.scanned ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                ) : (
                  <Shield className="w-8 h-8 text-slate-500" />
                )}
                <div>
                  <h3 className={`font-bold text-lg ${mw.detected ? 'text-red-400' : mw.scanned ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {mw.scanned ? (mw.detected ? 'Amenaza Detectada' : 'Limpio') : 'No Analizado'}
                  </h3>
                  {mw.scanned && (
                    <p className="text-slate-400 text-xs mt-1">Analizado por {mw.total} motores de seguridad</p>
                  )}
                </div>
              </div>
              
              {mw.scanned && (
                <div className="text-center bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 min-w-[100px]">
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Detecciones</p>
                  <p className={`text-2xl font-bold ${mw.detected ? 'text-red-400' : 'text-emerald-400'}`}>
                    {mw.positives}<span className="text-sm text-slate-500">/{mw.total}</span>
                  </p>
                </div>
              )}
            </div>
            
            {mw.scan_date && (
              <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Fecha del Análisis (VT)</p>
                <p className="text-slate-200">{mw.scan_date}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function SectionCard({ icon, title, children, open, onToggle }: { icon: React.ReactNode, title: string, children: React.ReactNode, open: boolean, onToggle: () => void }) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden shadow-sm">
      <button 
        onClick={onToggle} 
        className="w-full flex items-center justify-between p-5 hover:bg-slate-700/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900/50 rounded-xl border border-slate-700 group-hover:border-indigo-500/30 transition-colors">
            {icon}
          </div>
          <h2 className="font-bold text-slate-100">{title}</h2>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-900/50 text-slate-400 group-hover:text-slate-200 transition-colors border border-transparent group-hover:border-slate-600">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 animate-slide-up border-t border-slate-700/50 mt-1">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// Iconos adicionales locales
const ShieldCheck = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>;
const ShieldAlert = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>;


export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const { data: scan, isLoading, error } = useQuery({
    queryKey: ['scan', id],
    queryFn: () => getScan(Number(id)),
    refetchInterval: (query) => (query.state.data?.status === 'pending' || query.state.data?.status === 'running' ? 3000 : false),
  })

  const handleExportPDF = async () => {
    if (!reportRef.current || !scan) return
    setExporting(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a', // slate-950
        ignoreElements: (element) => element.classList.contains('no-export'),
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`SecScanner_Report_${scan.target}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error("Error exporting PDF", err)
    } finally {
      setExporting(false)
    }
  }

  // Generador simple de recomendaciones basado en los datos
  const generateRecommendations = (s: Scan) => {
    const recs: { title: string, desc: string, type: 'critical' | 'warning' | 'info' }[] = []
    
    if (s.risk_level === 'high') {
      recs.push({ title: "Atención Inmediata Requerida", desc: "El objetivo presenta múltiples fallos críticos. Se recomienda aislar el servicio hasta remediar los problemas.", type: 'critical' })
    }

    if (s.ssl && !s.ssl.valid && !s.ssl.error) {
      recs.push({ title: "Renovar/Corregir Certificado SSL", desc: "El certificado actual es inválido o ha expirado. Configura Let's Encrypt o renueva tu certificado comercial.", type: 'critical' })
    }

    if (s.http_headers) {
      const missing = s.http_headers.filter(h => !h.present)
      if (missing.length > 3) {
        recs.push({ title: "Endurecer Cabeceras HTTP", desc: `Faltan ${missing.length} cabeceras de seguridad importantes (ej. HSTS, CSP). Configura el servidor web para incluirlas.`, type: 'warning' })
      }
    }

    if (s.ports && s.ports.length > 3) {
      recs.push({ title: "Revisar Exposición de Puertos", desc: `Se detectaron ${s.ports.length} puertos abiertos. Verifica si todos son estrictamente necesarios para la operación pública.`, type: 'warning' })
    }

    if (s.discovered_assets && s.discovered_assets.length > 0) {
      recs.push({ title: "Ocultar Rutas Sensibles", desc: "Se encontraron rutas administrativas o de control de versiones expuestas. Restringe el acceso mediante .htaccess o reglas del proxy.", type: 'critical' })
    }

    if (s.malware && s.malware.detected) {
      recs.push({ title: "Investigar Infección por Malware", desc: `VirusTotal reporta ${s.malware.positives} detecciones. Revisa los archivos alojados y la integridad del sitio inmediatamente.`, type: 'critical' })
    }

    if (recs.length === 0) {
      recs.push({ title: "Mantener Monitoreo Continuo", desc: "No se encontraron problemas graves. Continúa realizando escaneos periódicos para prevenir futuras vulnerabilidades.", type: 'info' })
    }

    return recs
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-slate-400 font-medium animate-pulse">Cargando reporte seguro...</p>
    </div>
  )
  if (error || !scan) return (
    <div className="flex flex-col items-center justify-center py-20 text-red-400">
      <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
      <h2 className="text-xl font-bold">Error al cargar el reporte</h2>
      <p className="text-sm opacity-80 mt-2">El escaneo no existe o hubo un problema de conexión.</p>
    </div>
  )

  const recommendations = generateRecommendations(scan)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
        <div>
          <button onClick={() => window.history.back()} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mb-2 inline-flex items-center gap-1 transition-colors">
            ← Volver
          </button>
        </div>
        <div className="flex items-center gap-3">
          {(scan.status === 'completed' || scan.status === 'failed') && (
            <button 
              onClick={handleExportPDF}
              disabled={exporting}
              className="no-export flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {exporting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{exporting ? 'Generando PDF...' : 'Exportar PDF'}</span>
            </button>
          )}
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 bg-slate-900 p-2 sm:p-4 rounded-xl">
        {/* Report Title Area */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Shield className="w-5 h-5" />
              <span className="font-semibold uppercase tracking-wider text-xs">Reporte de Auditoría Web</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-100 break-all">{scan.target}</h1>
            <p className="text-slate-500 mt-2 text-sm flex items-center gap-2">
              <span>ID: {scan.id}</span>
              <span>•</span>
              <span>Fecha: {new Date(scan.created_at).toLocaleString()}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <RiskBadge level={scan.risk_level} />
            <StatusBadge status={scan.status} />
          </div>
        </div>

        {scan.status === 'pending' || scan.status === 'running' ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full" />
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Auditoría en progreso</h3>
            <p className="text-slate-400 text-sm max-w-md text-center">
              Estamos ejecutando los módulos de escaneo. Este proceso toma alrededor de 30 a 60 segundos. Los resultados aparecerán automáticamente.
            </p>
          </div>
        ) : scan.status === 'failed' ? (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-500 shrink-0">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Error Crítico en el Escaneo</h3>
              <p className="text-red-300 bg-red-900/20 p-3 rounded-lg border border-red-500/10 font-mono text-sm">
                {scan.error || 'Fallo desconocido durante la ejecución de los módulos.'}
              </p>
              <p className="text-sm text-red-400/80 mt-4">Sugerencia: Verifica que el objetivo esté escrito correctamente (ej: ejemplo.com) y que el host sea accesible desde internet.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800/40 p-6 sm:p-8 rounded-2xl border border-indigo-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Shield className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-400" /> Resumen Ejecutivo
                </h2>
                <p className="text-slate-300 leading-relaxed text-base max-w-3xl">
                  La auditoría sobre <strong className="text-white">{scan.target}</strong> concluyó con un nivel de riesgo <strong className="uppercase text-white border-b border-indigo-500/50 pb-0.5">{scan.risk_level}</strong>. 
                  {scan.fingerprint && scan.fingerprint.technologies && scan.fingerprint.technologies.length > 0 && (
                    ` Identificamos infraestructuras basadas en ${scan.fingerprint.technologies.slice(0, 3).join(', ')}.`
                  )}
                  {scan.ports && scan.ports.length > 0 ? (
                    ` Existen ${scan.ports.length} servicios de red expuestos públicamente.`
                  ) : (
                    ' No detectamos servicios de red no convencionales expuestos.'
                  )}
                  {scan.discovered_assets && scan.discovered_assets.length > 0 && (
                    ` Encontramos ${scan.discovered_assets.length} activos sensibles o rutas administrativas sin protección.`
                  )}
                  {scan.malware && scan.malware.detected && (
                    ' ALERTA: Múltiples motores antivirus marcaron el sitio como potencialmente malicioso.'
                  )}
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard 
                label="Puertos Expuestos" 
                value={scan.ports?.length ?? 0} 
                highlight={scan.ports && scan.ports.length > 3 ? 'warning' : 'normal'} 
              />
              <MetricCard 
                label="Headers Seguros" 
                value={`${scan.http_headers?.filter(h => h.present).length ?? 0}/${scan.http_headers?.length ?? 0}`} 
                highlight="normal" 
              />
              <MetricCard 
                label="Rutas Sensibles" 
                value={scan.discovered_assets?.length ?? 0} 
                highlight={scan.discovered_assets && scan.discovered_assets.length > 0 ? 'critical' : 'normal'} 
              />
              <MetricCard 
                label="Alertas VT" 
                value={scan.malware?.positives !== null ? `${scan.malware?.positives}/${scan.malware?.total}` : 'N/A'} 
                highlight={scan.malware?.detected ? 'critical' : 'normal'} 
              />
            </div>

            {/* Recommendations Module */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-700/50 bg-slate-800/80">
                <h2 className="font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-indigo-400" /> 
                  Plan de Acción Recomendado
                </h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((rec, i) => (
                    <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${
                      rec.type === 'critical' ? 'bg-red-500/5 border-red-500/20' : 
                      rec.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' : 
                      'bg-emerald-500/5 border-emerald-500/20'
                    }`}>
                      <div className={`mt-0.5 shrink-0 ${
                        rec.type === 'critical' ? 'text-red-400' : 
                        rec.type === 'warning' ? 'text-yellow-400' : 
                        'text-emerald-400'
                      }`}>
                        {rec.type === 'critical' ? <ShieldAlert className="w-5 h-5" /> : 
                         rec.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
                         <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className={`font-semibold text-sm mb-1 ${
                          rec.type === 'critical' ? 'text-red-200' : 
                          rec.type === 'warning' ? 'text-yellow-200' : 
                          'text-emerald-200'
                        }`}>{rec.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{rec.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Discovered Assets (if any) */}
            {scan.discovered_assets && scan.discovered_assets.length > 0 && (
              <SectionCard icon={<ShieldAlert className="w-5 h-5 text-red-500" />} title="Rutas y Archivos Sensibles Expuestos" open={true} onToggle={() => {}}>
                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                  <p className="text-sm text-red-300 mb-3">Se detectaron las siguientes rutas accesibles que podrían filtrar información sensible:</p>
                  <ul className="list-inside space-y-2 text-sm text-slate-300">
                    {scan.discovered_assets.map((asset, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Bug className="w-4 h-4 text-red-500/50" />
                        <span className="font-mono bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">{asset}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </SectionCard>
            )}

            {/* Detailed Modules */}
            <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-slate-200 px-2">Desglose Técnico</h3>
              <PortSection scan={scan} />
              <HttpSection scan={scan} />
              <SslSection scan={scan} />
              <FingerprintSection scan={scan} />
              <MalwareSection scan={scan} />
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, highlight = 'normal' }: { label: string; value: number | string, highlight?: 'normal' | 'warning' | 'critical' }) {
  const bg = highlight === 'critical' ? 'bg-red-500/10 border-red-500/20' : 
             highlight === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' : 
             'bg-slate-800 border-slate-700/50';
  const text = highlight === 'critical' ? 'text-red-400' : 
               highlight === 'warning' ? 'text-yellow-400' : 
               'text-slate-100';

  return (
    <div className={`p-4 rounded-2xl border ${bg} flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden group`}>
      <p className={`text-2xl sm:text-3xl font-bold mb-1 ${text}`}>{value}</p>
      <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  )
}
