import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { File as FileIcon, Bug, Shield, ChevronDown, ChevronUp, Package, ShieldCheck, ShieldAlert, Download, AlertTriangle, XCircle, Info, Database } from 'lucide-react'
import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getFileScan } from '../api/fileScans'
import RiskBadge from '../components/Shared/RiskBadge'
import StatusBadge from '../components/Shared/StatusBadge'
import type { FileScan } from '../types'

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

function MalwareSection({ scan }: { scan: FileScan }) {
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
              mw.positives && mw.positives > 0 
                ? 'bg-red-500/10 border-red-500/20' 
                : mw.scanned 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-slate-800 border-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                {mw.positives && mw.positives > 0 ? (
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                ) : mw.scanned ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                ) : (
                  <Shield className="w-8 h-8 text-slate-500" />
                )}
                <div>
                  <h3 className={`font-bold text-lg ${mw.positives && mw.positives > 0 ? 'text-red-400' : mw.scanned ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {mw.scanned ? (mw.positives && mw.positives > 0 ? 'Amenaza Detectada' : 'Archivo Limpio') : 'No Analizado'}
                  </h3>
                  {mw.scanned && (
                    <p className="text-slate-400 text-xs mt-1">Analizado por {mw.total} motores antivirus</p>
                  )}
                </div>
              </div>
              
              {mw.scanned && (
                <div className="text-center bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 min-w-[100px]">
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Detecciones</p>
                  <p className={`text-2xl font-bold ${mw.positives && mw.positives > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {mw.positives || 0}<span className="text-sm text-slate-500">/{mw.total}</span>
                  </p>
                </div>
              )}
            </div>
            
            {mw.scan_date && (
              <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Fecha del Análisis</p>
                <p className="text-slate-200">{mw.scan_date}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function ApkSection({ scan }: { scan: FileScan }) {
  const [open, setOpen] = useState(true)
  if (!scan.apk_info) return null
  const apk = scan.apk_info

  // Función para determinar si un permiso es peligroso
  const isDangerousPermission = (perm: string) => {
    const dangerous = ['READ_CONTACTS', 'WRITE_CONTACTS', 'READ_SMS', 'SEND_SMS', 'ACCESS_FINE_LOCATION', 'CAMERA', 'RECORD_AUDIO', 'READ_PHONE_STATE']
    return dangerous.some(d => perm.includes(d))
  }

  return (
    <SectionCard icon={<Package className="w-5 h-5 text-indigo-400" />} title="Análisis Estático APK" open={open} onToggle={() => setOpen(!open)}>
      <div className="space-y-6 text-sm">
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Nombre del Paquete</span>
          <span className="font-mono bg-slate-800 px-3 py-1 rounded text-slate-200 font-medium">{apk.package_name || 'Desconocido'}</span>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Permisos Solicitados</p>
            <span className="px-2 py-0.5 bg-slate-800 rounded-md text-xs font-medium text-slate-300 border border-slate-700">Total: {apk.permissions.length}</span>
          </div>
          <div className="h-48 overflow-y-auto bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 custom-scrollbar">
            {apk.permissions.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No se detectaron permisos solicitados.</p>
            ) : (
              apk.permissions.map((p, i) => {
                const dangerous = isDangerousPermission(p)
                return (
                  <div key={i} className={`text-xs font-mono p-2 rounded border ${dangerous ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-300'}`}>
                    {dangerous && <AlertTriangle className="w-3 h-3 inline mr-1.5 -mt-0.5 text-red-500" />}
                    {p}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Actividades</p>
              <span className="text-xs text-slate-400">{apk.activities.length}</span>
            </div>
            <div className="h-32 overflow-y-auto bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 custom-scrollbar">
              {apk.activities.length === 0 ? (
                 <p className="text-slate-500 text-center py-2 text-xs">Ninguna</p>
              ) : (
                apk.activities.map((a, i) => (
                  <div key={i} className="text-[10px] sm:text-xs text-slate-300 font-mono truncate">{a}</div>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Servicios</p>
              <span className="text-xs text-slate-400">{apk.services.length}</span>
            </div>
            <div className="h-32 overflow-y-auto bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 custom-scrollbar">
              {apk.services.length === 0 ? (
                 <p className="text-slate-500 text-center py-2 text-xs">Ninguno</p>
              ) : (
                apk.services.map((s, i) => (
                  <div key={i} className="text-[10px] sm:text-xs text-slate-300 font-mono truncate">{s}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function FileMetadataSection({ scan }: { scan: FileScan }) {
  const [open, setOpen] = useState(true)
  if (!scan.metadata_info || Object.keys(scan.metadata_info).length === 0) return null
  
  return (
    <SectionCard icon={<Database className="w-5 h-5 text-indigo-400" />} title="Metadatos Extraídos" open={open} onToggle={() => setOpen(!open)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(scan.metadata_info).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="col-span-1 sm:col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{key}</p>
                <div className="bg-slate-900 p-4 rounded-xl text-sm text-slate-300 overflow-x-auto border border-slate-800">
                  <pre className="font-mono text-xs">{JSON.stringify(value, null, 2)}</pre>
                </div>
              </div>
            )
          }
          return (
            <div key={key} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{key}</p>
              <p className="font-mono text-sm text-slate-200 break-all">{String(value)}</p>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

export default function FileReportPage() {
  const { id } = useParams<{ id: string }>()
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const { data: scan, isLoading, error } = useQuery({
    queryKey: ['fileScan', id],
    queryFn: () => getFileScan(Number(id)),
    refetchInterval: (query) => (query.state.data?.status === 'pending' || query.state.data?.status === 'running' ? 3000 : false),
  })

  const handleExportPDF = async () => {
    if (!reportRef.current || !scan) return
    setExporting(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        ignoreElements: (element) => element.classList.contains('no-export'),
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`SecScanner_FileReport_${scan.filename}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error("Error exporting PDF", err)
    } finally {
      setExporting(false)
    }
  }

  // Generador de recomendaciones
  const generateRecommendations = (s: FileScan) => {
    const recs: { title: string, desc: string, type: 'critical' | 'warning' | 'info' }[] = []
    
    if (s.risk_level === 'high') {
      recs.push({ title: "Evitar Ejecución del Archivo", desc: "El archivo es altamente peligroso. No lo ejecutes ni lo abras en tu sistema principal. Aísla el archivo inmediatamente.", type: 'critical' })
    }

    if (s.malware && s.malware.scanned && s.malware.positives && s.malware.positives > 0) {
      recs.push({ title: "Infección de Malware Confirmada", desc: `VirusTotal reporta ${s.malware.positives} detecciones de malware. El archivo está infectado y debe ser eliminado de forma segura.`, type: 'critical' })
    }

    if (s.apk_info && s.apk_info.permissions) {
      const dangerous = ['READ_CONTACTS', 'READ_SMS', 'ACCESS_FINE_LOCATION', 'CAMERA', 'RECORD_AUDIO']
      const hasDangerous = s.apk_info.permissions.some(p => dangerous.some(d => p.includes(d)))
      
      if (hasDangerous) {
        recs.push({ title: "Exceso de Permisos Peligrosos", desc: "La aplicación solicita permisos altamente intrusivos (ej: contactos, ubicación, SMS). Si el propósito de la app no justifica estos permisos, puede tratarse de spyware.", type: 'warning' })
      }
    }

    if (recs.length === 0) {
      recs.push({ title: "Archivo Aparentemente Limpio", desc: "No se detectaron firmas maliciosas conocidas ni comportamientos sospechosos a nivel estático. Sin embargo, mantén precaución al ejecutar archivos desconocidos.", type: 'info' })
    }

    return recs
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-slate-400 font-medium animate-pulse">Analizando archivo...</p>
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
              {scan.apk_info ? <Package className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
              <span className="font-semibold uppercase tracking-wider text-xs">Auditoría de Archivo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 break-all">{scan.filename}</h1>
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
                <Shield className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Analizando el archivo</h3>
            <p className="text-slate-400 text-sm max-w-md text-center">
              Estamos extrayendo metadatos y consultando motores antivirus. Esto puede tardar hasta 1 minuto.
            </p>
          </div>
        ) : scan.status === 'failed' ? (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-500 shrink-0">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Error en el Análisis</h3>
              <p className="text-red-300 bg-red-900/20 p-3 rounded-lg border border-red-500/10 font-mono text-sm">
                {scan.error || 'Ocurrió un error al procesar el archivo.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800/40 p-6 sm:p-8 rounded-2xl border border-indigo-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FileIcon className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-400" /> Detalles del Archivo
                </h2>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-1 space-y-2">
                    <p className="text-slate-300 leading-relaxed text-base">
                      El archivo analizado tiene un tamaño de <strong>{(scan.file_size / 1024 / 1024).toFixed(2)} MB</strong>. 
                      El tipo detectado es <strong className="text-white">{scan.file_type || (scan.apk_info ? 'APK Android' : 'Binario/Desconocido')}</strong>. 
                    </p>
                    {scan.malware && scan.malware.scanned && (
                      <p className={`font-medium ${scan.malware.positives && scan.malware.positives > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {scan.malware.positives && scan.malware.positives > 0 
                          ? `⚠ VirusTotal marcó ${scan.malware.positives} detecciones maliciosas.`
                          : '✓ No se detectaron firmas maliciosas en VirusTotal.'}
                      </p>
                    )}
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50 w-full sm:w-auto shrink-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">SHA-256 Hash (Firma única)</p>
                    <p className="text-xs font-mono break-all text-indigo-300">{scan.file_hash}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Module */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-700/50 bg-slate-800/80">
                <h2 className="font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-indigo-400" /> 
                  Veredicto y Recomendaciones
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

            {/* Detailed Modules */}
            <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-slate-200 px-2">Desglose Técnico</h3>
              <MalwareSection scan={scan} />
              <ApkSection scan={scan} />
              <FileMetadataSection scan={scan} />
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
