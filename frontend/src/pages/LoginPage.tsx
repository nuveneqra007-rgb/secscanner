import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Lock, Mail, User, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Tab = 'login' | 'register'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8 caracteres', ok: password.length >= 8 },
    { label: 'Mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-emerald-500']
  const labels = ['Débil', 'Media', 'Fuerte']

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`text-xs transition-colors ${c.ok ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-xs font-medium ${colors[score - 1].replace('bg-', 'text-')}`}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login fields
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')

  // Register fields
  const [regName, setRegName] = useState('')
  const [regUser, setRegUser] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPassConfirm, setRegPassConfirm] = useState('')

  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(loginUser, loginPass)
      navigate('/', { replace: true })
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (typeof detail === 'string' && detail.includes('bloqueada')) {
        setError(detail)
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (regPass !== regPassConfirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await register({ username: regUser, email: regEmail, full_name: regName, password: regPass })
      navigate('/', { replace: true })
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || 'Error de validación')
      } else if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError('No se pudo crear la cuenta. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex flex-col w-[46%] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 relative overflow-hidden p-14">
        {/* Orbes decorativos */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl" />

        {/* Logo + Nombre */}
        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 backdrop-blur">
            <img src="/logo.jpg" alt="SecScanner" className="w-7 h-7 object-cover rounded-lg" />
          </div>
          <span className="text-xl font-bold text-slate-100 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SecScanner</span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6 w-fit">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Plataforma de Ciberseguridad</span>
          </div>
          <h1
            className="text-4xl xl:text-5xl font-bold text-slate-100 leading-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
          >
            Analiza. Detecta.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Protégete.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            Herramienta de auditoría que funciona{' '}
            <strong className="text-slate-200 font-semibold">sin internet</strong>. Escanea puertos,
            SSL, headers y malware en tiempo real.
          </p>

          {/* Features con iconos SVG personalizados */}
          <div className="mt-10 space-y-5">

            {/* Feature 1 — Escaneo público */}
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  <circle cx="11" cy="11" r="8" stroke="url(#sg1)" />
                  <circle cx="11" cy="11" r="3" stroke="url(#sg1)" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="url(#sg1)" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Escaneo sin cuenta</p>
                <p className="text-xs text-slate-500 mt-0.5">Abierto a cualquier usuario, sin registro</p>
              </div>
            </div>

            {/* Feature 2 — Historial */}
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="url(#sg2)" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Historial y estadísticas</p>
                <p className="text-xs text-slate-500 mt-0.5">Guardado y visible solo en tu cuenta</p>
              </div>
            </div>

            {/* Feature 3 — Local */}
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="sg3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="url(#sg3)" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="url(#sg3)" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>100% local y privado</p>
                <p className="text-xs text-slate-500 mt-0.5">Tus datos nunca salen de tu máquina</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs z-10 font-medium tracking-wide">
          Solo para sistemas propios o con autorización explícita.
        </p>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        {/* Orbe de fondo mobile */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md z-10">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <img src="/logo.jpg" alt="SecScanner" className="w-7 h-7 object-cover rounded-lg" />
            </div>
            <span className="text-xl font-bold text-slate-100">SecScanner</span>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-100">
              {tab === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
            </h2>
            <p className="text-slate-400 mt-1 text-sm">
              {tab === 'login'
                ? 'Accede a tu historial y estadísticas de seguridad'
                : 'Empieza a guardar y gestionar tus análisis'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-900 rounded-xl p-1 mb-8 border border-slate-800">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Formulario Login */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Usuario o Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="usuario o correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-100 placeholder-slate-500 transition-all"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-900/60 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-100 placeholder-slate-500 transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Acceder <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {/* Formulario Registro */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-100 placeholder-slate-500 transition-all"
                    required
                    minLength={2}
                    maxLength={60}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
                  <input
                    type="text"
                    value={regUser}
                    onChange={(e) => setRegUser(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
                    placeholder="mi_usuario"
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-100 placeholder-slate-500 transition-all"
                    required
                    minLength={3}
                    maxLength={30}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full pl-9 pr-3 py-3 bg-slate-900/60 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-100 placeholder-slate-500 transition-all"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-11 py-3 bg-slate-900/60 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-100 placeholder-slate-500 transition-all"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={regPass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassConfirm}
                    onChange={(e) => setRegPassConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-900/60 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-100 placeholder-slate-500 transition-all ${
                      regPassConfirm && regPass !== regPassConfirm
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-slate-700 focus:border-indigo-500'
                    }`}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {regPassConfirm && regPass !== regPassConfirm && (
                  <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Crear cuenta <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {/* Separador - Modo invitado */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-500 text-xs">o continúa sin cuenta</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <button
            onClick={() => navigate('/scan')}
            className="mt-4 w-full py-3 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 hover:bg-slate-800/40"
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            Analizar sin registrarse (resultado temporal)
          </button>

          <p className="text-center text-slate-600 text-xs mt-6">
            Uso ético exclusivo · Solo sistemas autorizados
          </p>
        </div>
      </div>
    </div>
  )
}
