import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { History, Trash2, File as FileIcon, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { getFileScans, deleteFileScan } from '../api/fileScans'
import StatusBadge from '../components/Shared/StatusBadge'
import RiskBadge from '../components/Shared/RiskBadge'
import ConfirmDialog from '../components/Shared/ConfirmDialog'
import toast from 'react-hot-toast'

export default function FileHistoryPage() {
  const [page, setPage] = useState(1)
  const [scanToDelete, setScanToDelete] = useState<number | null>(null)
  const pageSize = 10
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['fileScans', page],
    queryFn: () => getFileScans(page, pageSize),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFileScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fileScans'] })
      toast.success('Análisis de archivo eliminado')
      setScanToDelete(null)
    },
    onError: () => {
      toast.error('Error al eliminar el análisis')
      setScanToDelete(null)
    }
  })

  const items = data?.items || []
  const totalPages = data ? Math.ceil(data.total / pageSize) : 1

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" /> Historial de Archivos
          </h1>
          <p className="text-sm text-slate-400 mt-1">Lista de archivos y aplicaciones analizadas previamente.</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Cargando historial...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium text-slate-400">No hay archivos en el historial</p>
            <p className="text-sm mt-1">Inicia un nuevo análisis de archivo para ver los resultados aquí.</p>
            <button onClick={() => navigate('/new-file')} className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
              Analizar Archivo
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-300">Archivo</th>
                    <th className="px-6 py-4 font-semibold text-slate-300">Estado</th>
                    <th className="px-6 py-4 font-semibold text-slate-300">Nivel de Riesgo</th>
                    <th className="px-6 py-4 font-semibold text-slate-300">Fecha</th>
                    <th className="px-6 py-4 font-semibold text-right text-slate-300">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {items.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-700/30 transition-colors cursor-pointer group" onClick={() => navigate(`/file-report/${scan.id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-indigo-300 group-hover:text-indigo-400 font-medium transition-colors">
                          <FileIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-[300px]" title={scan.filename}>
                            {scan.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={scan.status} /></td>
                      <td className="px-6 py-4"><RiskBadge level={scan.risk_level} /></td>
                      <td className="px-6 py-4 text-slate-400">{new Date(scan.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setScanToDelete(scan.id)
                          }} 
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between bg-slate-900/30">
                <span className="text-sm text-slate-400 font-medium">
                  Página <span className="text-slate-200">{page}</span> de <span className="text-slate-200">{totalPages}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)} 
                    className="p-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={page === totalPages} 
                    onClick={() => setPage(p => p + 1)} 
                    className="p-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={scanToDelete !== null}
        title="Eliminar Reporte de Archivo"
        message="¿Estás seguro de que deseas eliminar este reporte de análisis de archivo? Esta acción no se puede deshacer y los datos se perderán permanentemente."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={() => {
          if (scanToDelete) deleteMutation.mutate(scanToDelete)
        }}
        onCancel={() => setScanToDelete(null)}
      />
    </div>
  )
}
