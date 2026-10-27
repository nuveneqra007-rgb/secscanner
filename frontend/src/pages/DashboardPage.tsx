import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, CheckCircle, Activity, Globe, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { getScans, getScanStats } from '../api/scans'
import RiskBadge from '../components/Shared/RiskBadge'
import StatusBadge from '../components/Shared/StatusBadge'

// Nueva paleta adaptada al diseño de confianza
const COLORS = { perfect: '#10b981', low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['scans', 1, 100],
    queryFn: () => getScans(1, 100),
    refetchInterval: 5000,
  })

  const { data: statsData } = useQuery({
    queryKey: ['scanStats'],
    queryFn: getScanStats,
    refetchInterval: 30000,
  })

  const scans = data?.items || []
  const total = scans.length
  const completed = scans.filter((s) => s.status === 'completed')
  const highRisk = completed.filter((s) => s.risk_level === 'high').length
  const mediumRisk = completed.filter((s) => s.risk_level === 'medium').length
  const lowRisk = completed.filter((s) => s.risk_level === 'low').length
  const perfectRisk = completed.filter((s) => s.risk_level === 'perfect').length

  const pieData = [
    { name: 'Perfecto', value: perfectRisk, color: COLORS.perfect },
    { name: 'Bajo', value: lowRisk, color: COLORS.low },
    { name: 'Medio', value: mediumRisk, color: COLORS.medium },
    { name: 'Alto', value: highRisk, color: COLORS.high },
  ].filter((d) => d.value > 0)

  const recent = scans.slice(0, 5)

  // Mensaje de estado general
  let healthMessage = "Esperando datos..."
  let healthColor = "text-slate-400"
  if (completed.length > 0) {
    if (highRisk > 0) {
      healthMessage = "Existen vulnerabilidades críticas que requieren atención inmediata."
      healthColor = "text-red-400"
    } else if (mediumRisk > 0) {
      healthMessage = "El sistema requiere atención en algunos puntos de riesgo medio."
      healthColor = "text-yellow-400"
    } else {
      healthMessage = "Panorama general saludable. Sigue monitoreando periódicamente."
      healthColor = "text-emerald-400"
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-8">
      {/* Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-800/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <p className="text-indigo-400 font-medium mb-1">{getGreeting()}, Administrador</p>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Resumen de Seguridad</h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xl">{healthMessage}</p>
        </div>
        <button 
          onClick={() => navigate('/new-scan')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Globe className="w-4 h-4" />
          <span>Nuevo Escaneo</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 h-28 rounded-2xl border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="w-16 h-16 text-indigo-400" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-100">{total}</p>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Escaneos</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-100">{completed.length}</p>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completados</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/50 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertTriangle className="w-16 h-16 text-yellow-500" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-100">{mediumRisk}</p>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Riesgo Medio</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-16 h-16 text-red-500" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-100">{highRisk}</p>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Riesgo Alto</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-sm">
              <h2 className="text-base font-semibold text-slate-200 mb-6 flex items-center gap-2">
                Distribución de Riesgos
              </h2>
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
                        itemStyle={{ color: '#f1f5f9' }}
                      />
                      <Pie 
                        data={pieData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60}
                        outerRadius={80} 
                        paddingAngle={5}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="rgba(0,0,0,0)" />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                  <PieChart className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No hay datos de escaneos completados</p>
                </div>
              )}
            </div>

            {/* Recent Scans */}
            <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700/50 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                <h2 className="text-base font-semibold text-slate-200">Actividad Reciente</h2>
                <button onClick={() => navigate('/history')} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors">
                  Ver todo <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              
              <div className="flex-1 p-3">
                {recent.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                    <Globe className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm mb-4">No hay escaneos recientes en el historial</p>
                    <button 
                      onClick={() => navigate('/new-scan')}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                    >
                      Inicia tu primer escaneo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recent.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3.5 hover:bg-slate-700/30 rounded-xl cursor-pointer transition-colors group"
                        onClick={() => navigate(`/report/${s.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                            <Globe className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">{s.target}</p>
                            <p className="text-xs text-slate-500">{new Date(s.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={s.status} />
                          <RiskBadge level={s.risk_level} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-sm mt-6">
            <h2 className="text-base font-semibold text-slate-200 mb-6 flex items-center gap-2">
              Tendencia de Riesgos (Últimos 30 días)
            </h2>
            <div className="h-72">
              {statsData && statsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="high" name="Riesgo Alto" stroke={COLORS.high} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="medium" name="Riesgo Medio" stroke={COLORS.medium} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="low" name="Riesgo Bajo" stroke={COLORS.low} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="perfect" name="Sin Riesgo" stroke={COLORS.perfect} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Activity className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No hay datos históricos suficientes</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
