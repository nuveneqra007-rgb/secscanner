import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Search, Globe, Shield, Lock, Fingerprint, Bug, AlertTriangle, Loader2, BookmarkPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createScan } from '../api/scans'
import { useAuth } from '../context/AuthContext'

export default function NewScanPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [target, setTarget] = useState('')
  const [validationError, setValidationError] = useState('')

  const mutation = useMutation({
    mutationFn: createScan,
    onSuccess: (data) => {
      toast.success('Escaneo iniciado correctamente')
      navigate(`/report/${data.id}`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.message || 'Error al iniciar escaneo')
    }
  })

  const validateTarget = (val: string) => {
    if (!val) return 'El objetivo es requerido'
    const domainOrIpRegex = /^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/
    const stripped = val.replace('https://', '').replace('http://', '').split('/')[0]
    if (!domainOrIpRegex.test(stripped)) {
      return 'Formato inválido. Ingresa un dominio o IP (ej: ejemplo.com)'
    }
    return ''
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const err = validateTarget(target.trim())
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError('')
    mutation.mutate({ target: target.trim() })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Banner modo invitado */}
      {!isAuthenticated && (
        <div className="flex items-center gap-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <BookmarkPlus className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-indigo-300 font-medium">Modo invitado — resultado temporal</p>
            <p className="text-xs text-slate-400 mt-0.5">El resultado no se guardará en historial. <button onClick={() => navigate('/login')} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Crea tu cuenta</button> para guardar tus análisis.</p>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <Globe className="w-8 h-8 text-indigo-400" />
          Auditoría de Seguridad Web
        </h1>
        <p className="text-slate-400 mt-2">Analiza un dominio o dirección IP en busca de vulnerabilidades, puertos abiertos y configuraciones inseguras.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-2xl border border-slate-700/50 shadow-xl space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Objetivo del Escaneo (URL o IP)</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value)
                  if (validationError) setValidationError('')
                }}
                placeholder="ej: ejemplo.com o 192.168.1.1"
                className={`w-full px-4 py-3 bg-slate-900/50 border ${validationError ? 'border-red-500/50 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'} rounded-xl focus:ring-2 transition-all outline-none text-slate-100 placeholder-slate-500`}
                required
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending || !target}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 whitespace-nowrap"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Escanear
                </>
              )}
            </button>
          </div>
          {validationError && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> {validationError}
            </p>
          )}
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Solo escanea sistemas propios o con autorización explícita.
            </p>
            <p className="text-xs text-slate-500">
              Tiempo estimado: ~30-60 seg
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Fases de la Auditoría</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-800">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0"><Globe className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-medium text-slate-200">Puertos Abiertos</p>
                <p className="text-xs text-slate-400">Escaneo de los 15 puertos TCP más críticos (HTTP, SSH, DBs).</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-800">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0"><Shield className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-medium text-slate-200">Headers de Seguridad</p>
                <p className="text-xs text-slate-400">Verificación de CSP, HSTS, X-Frame-Options y políticas anti-XSS.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-800">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0"><Lock className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-medium text-slate-200">Criptografía SSL/TLS</p>
                <p className="text-xs text-slate-400">Validación de certificados, caducidad e identidad del emisor.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-800">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0"><Fingerprint className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-medium text-slate-200">Fingerprinting & Assets</p>
                <p className="text-xs text-slate-400">Detección de tecnologías y rutas sensibles expuestas (.env, .git).</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-800 sm:col-span-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0"><Bug className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-medium text-slate-200">Análisis de Reputación (VirusTotal)</p>
                <p className="text-xs text-slate-400">Cruce de la huella del sitio con +70 motores antivirus globales para detectar malware y phishing.</p>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  )
}
