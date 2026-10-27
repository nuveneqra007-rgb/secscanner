import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  status: string
}

const config: Record<string, { bg: string, text: string, icon: any, label: string }> = {
  pending: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', icon: Clock, label: 'Pendiente' },
  running: { bg: 'bg-indigo-500/10 border-indigo-500/20', text: 'text-indigo-400', icon: Loader2, label: 'En progreso' },
  completed: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2, label: 'Completado' },
  failed: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', icon: XCircle, label: 'Fallido' },
}

export default function StatusBadge({ status }: Props) {
  const c = config[status] || config.pending
  const Icon = c.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${c.bg} ${c.text}`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'running' ? 'animate-spin' : ''}`} />
      {c.label}
    </span>
  )
}
