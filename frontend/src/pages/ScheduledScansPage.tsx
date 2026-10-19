import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Play, Square, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { getScheduledScans, createScheduledScan, deleteScheduledScan, toggleScheduledScan } from '../api/scheduled'

export default function ScheduledScansPage() {
  const queryClient = useQueryClient()
  const [target, setTarget] = useState('')
  const [interval, setInterval] = useState(24)

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['scheduled-scans'],
    queryFn: getScheduledScans,
    refetchInterval: 10000,
  })

  const createMutation = useMutation({
    mutationFn: createScheduledScan,
    onSuccess: () => {
      toast.success('Escaneo programado creado')
      setTarget('')
      queryClient.invalidateQueries({ queryKey: ['scheduled-scans'] })
    },
    onError: () => toast.error('Error al programar escaneo'),
  })

  const toggleMutation = useMutation({
    mutationFn: toggleScheduledScan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-scans'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteScheduledScan,
    onSuccess: () => {
      toast.success('Escaneo eliminado')
      queryClient.invalidateQueries({ queryKey: ['scheduled-scans'] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!target) return
    createMutation.mutate({ target, interval_hours: interval })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Monitoreo Continuo</h1>
        <p className="text-slate-400 mt-2 text-sm max-w-xl">Programa escaneos para que se ejecuten automáticamente cada cierto tiempo.</p>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-sm">
        <form onSubmit={handleCreate} className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-400 mb-2">Dominio o IP</label>
            <input 
              type="text" 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="ej: example.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-400 mb-2">Horas</label>
            <input 
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button 
            type="submit" 
            disabled={createMutation.isPending || !target}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 h-11"
          >
            <Plus className="w-5 h-5" /> Programar
          </button>
        </form>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Cargando programaciones...</div>
        ) : schedules.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <Clock className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No tienes escaneos programados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {schedules.map((schedule: any) => (
              <div key={schedule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-700/20 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${schedule.is_active ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700 text-slate-500'}`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">{schedule.target}</p>
                    <p className="text-xs text-slate-400">Cada {schedule.interval_hours} horas {schedule.last_run_at ? `· Última vez: ${new Date(schedule.last_run_at).toLocaleString()}` : '· Nunca ejecutado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleMutation.mutate(schedule.id)}
                    className={`p-2 rounded-lg border transition-colors ${schedule.is_active ? 'border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10' : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'}`}
                    title={schedule.is_active ? 'Pausar' : 'Reanudar'}
                  >
                    {schedule.is_active ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => deleteMutation.mutate(schedule.id)}
                    className="p-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
