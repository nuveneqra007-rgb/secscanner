import { ShieldCheck, ShieldAlert, AlertTriangle, Bug } from 'lucide-react'

interface Props {
  level: string | null
}

const config: Record<string, { bg: string, text: string, icon: any, label: string, desc: string }> = {
  perfect: { 
    bg: 'bg-emerald-500/10 border-emerald-500/20', 
    text: 'text-emerald-400', 
    icon: ShieldCheck, 
    label: 'Perfecto',
    desc: 'Sin vulnerabilidades detectadas'
  },
  low: { 
    bg: 'bg-green-500/10 border-green-500/20', 
    text: 'text-green-400', 
    icon: ShieldCheck, 
    label: 'Bajo',
    desc: 'Riesgo mínimo'
  },
  medium: { 
    bg: 'bg-yellow-500/10 border-yellow-500/20', 
    text: 'text-yellow-400', 
    icon: AlertTriangle, 
    label: 'Medio',
    desc: 'Atención requerida'
  },
  high: { 
    bg: 'bg-red-500/10 border-red-500/20', 
    text: 'text-red-400', 
    icon: ShieldAlert, 
    label: 'Alto',
    desc: 'Acción inmediata necesaria'
  },
}

export default function RiskBadge({ level }: Props) {
  if (!level || !config[level]) return null
  
  const c = config[level]
  const Icon = c.icon

  return (
    <div className="group relative inline-flex">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${c.bg} ${c.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {c.label}
      </span>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
        {c.desc}
      </div>
    </div>
  )
}
