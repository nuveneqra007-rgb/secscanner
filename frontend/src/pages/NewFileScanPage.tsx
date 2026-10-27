import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Upload, File as FileIcon, Loader2, Bug, Package, ShieldAlert } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createFileScan } from '../api/fileScans'

export default function NewFileScanPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Por favor selecciona un archivo o APK')
      return
    }
    setLoading(true)
    try {
      const scan = await createFileScan(file)
      toast.success('Archivo subido correctamente')
      navigate(`/file-report/${scan.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al iniciar el escaneo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <FileIcon className="w-8 h-8 text-indigo-400" />
          Análisis de Archivos y APKs
        </h1>
        <p className="text-slate-400 mt-2">
          Sube aplicaciones Android, documentos o cualquier archivo sospechoso para extraer metadata y analizarlo contra múltiples motores antivirus.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-2xl border border-slate-700/50 shadow-xl">
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-300 mb-4">Archivo a Analizar</label>
          
          <div 
            className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-2xl transition-all duration-200 ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-slate-600 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input 
              ref={inputRef}
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            
            <div className="flex flex-col items-center justify-center pointer-events-none p-6 text-center">
              <div className={`p-4 rounded-full mb-4 transition-colors ${dragActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                <Upload className="w-10 h-10" />
              </div>
              <p className="mb-2 text-base text-slate-300">
                <span className="font-semibold text-indigo-400">Haz click para buscar</span> o arrastra un archivo aquí
              </p>
              <p className="text-sm text-slate-500 max-w-xs">Soporta APKs de Android, PDFs, imágenes y binarios.</p>
            </div>
          </div>

          {file && (
            <div className="mt-6 flex items-center gap-4 p-4 bg-slate-900/80 border border-slate-700 rounded-xl animate-fade-in">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                {file.name.endsWith('.apk') ? <Package className="w-6 h-6" /> : <FileIcon className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span className="text-xs text-slate-500 uppercase">{file.name.split('.').pop() || 'File'}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Subiendo y Analizando...</span>
            </>
          ) : (
            <>
              <Shield className="w-6 h-6" />
              <span>Iniciar Análisis Seguro</span>
            </>
          )}
        </button>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-slate-500 border-t border-slate-700/50 pt-6">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-emerald-500" />
            <span>Escaneo integrado con VirusTotal</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-yellow-500" />
            <span>Descompilación de APKs</span>
          </div>
        </div>
      </form>
    </div>
  )
}
