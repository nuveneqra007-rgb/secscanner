import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Activity, History, LogOut, Globe, File as FileIcon, Clock, User, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { logout, user, isAuthenticated, isGuest } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-indigo-600/10 text-indigo-400' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`

  return (
    <div className="min-h-screen flex bg-slate-900">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
          <div className="p-1 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10 overflow-hidden flex items-center justify-center">
            <img src="/logo.jpg" alt="SecScanner Logo" className="w-8 h-8 object-cover rounded-lg mix-blend-screen" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">SecScanner</span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-medium mt-0.5">Versión 2.0</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">General</p>
            <div className="space-y-1">
              <NavLink to="/" end className={navLinkClass}>
                <Activity className="w-4 h-4" /> Dashboard
              </NavLink>
            </div>
          </div>
          
          <div>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Escaneos</p>
            <div className="space-y-1">
              <NavLink to="/scan" className={navLinkClass}>
                <Globe className="w-4 h-4" /> Escaneo Web
              </NavLink>
              <NavLink to="/new-file-scan" className={navLinkClass}>
                <FileIcon className="w-4 h-4" /> Escaneo de Archivos
              </NavLink>
              {isAuthenticated && (
                <NavLink to="/scheduled" className={navLinkClass}>
                  <Clock className="w-4 h-4" /> Monitoreo Continuo
                </NavLink>
              )}
            </div>
          </div>

          <div>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Historial</p>
            <div className="space-y-1">
              {isAuthenticated ? (
                <>
                  <NavLink to="/history" className={navLinkClass}>
                    <History className="w-4 h-4" /> Historial Web
                  </NavLink>
                  <NavLink to="/file-history" className={navLinkClass}>
                    <History className="w-4 h-4" /> Historial Archivos
                  </NavLink>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all w-full text-left"
                >
                  <History className="w-4 h-4" />
                  <span>Historial</span>
                  <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">Login</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          {isAuthenticated && user ? (
            <div className="mb-3 px-2 py-3 bg-slate-800/30 rounded-lg border border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                {user.is_admin && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-medium">Admin</span>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <div className="px-2 py-2.5 bg-slate-800/20 rounded-lg border border-slate-800 text-center">
                <p className="text-xs text-slate-500 mb-2">Modo invitado — datos temporales</p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-indigo-400 text-xs font-medium transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Crear cuenta
                </button>
              </div>
            </div>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 w-full transition-colors text-sm font-medium group"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" /> Cerrar Sesión
            </button>
          )}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-600">Uso ético · Sistemas autorizados</p>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPjwvc3ZnPg==')] opacity-50 z-0"></div>
        <div className="relative z-10 p-8 max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
