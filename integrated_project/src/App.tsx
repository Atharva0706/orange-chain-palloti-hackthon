import { useState } from 'react'
import Landing from './pages/Landing'
import FarmerDashboard from './pages/FarmerDashboard'
import BuyerDashboard from './pages/BuyerDashboard'
import MissionControl from './pages/MissionControl'
import Sidebar from './components/layout/Sidebar'
import Auth from './pages/Auth'
import Wallet from './pages/Wallet'
import TransportMap from './pages/TransportMap'
import TransportBooking from './pages/TransportBooking'
import Notifications from './components/common/Notifications'
import { useAuth } from './context/AuthContext'
import { Search, Bell, User, LogOut } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('landing')
  const { user, logout, isAuthenticated } = useAuth()

  const handleLaunch = () => setActiveTab('auth')

  const handleAuthSuccess = (role: string) => {
    // Route to the correct dashboard based on role
    if (role === 'buyer') {
      setActiveTab('buyer')
    } else {
      setActiveTab('farmer')
    }
  }

  const handleLogout = () => {
    logout()
    setActiveTab('landing')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'landing':    return <Landing onLaunch={handleLaunch} />
      case 'auth':       return <Auth onSuccess={handleAuthSuccess} />
      case 'farmer':     return <FarmerDashboard />
      case 'buyer':      return <BuyerDashboard />
      case 'forecast':   return <FarmerDashboard />
      case 'mission':    return <MissionControl />
      case 'transport':  return <TransportBooking />
      case 'market':     return <TransportMap />
      case 'quality':    return <FarmerDashboard />
      case 'wallet':     return <Wallet />
      default:           return <Landing onLaunch={handleLaunch} />
    }
  }

  const showShell = isAuthenticated && activeTab !== 'landing' && activeTab !== 'auth'

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Notifications />
      {showShell ? (
        <>
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} />
          <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column' }}>
            {/* Top header */}
            <header style={{
              height: '70px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 2.5rem', position: 'sticky', top: 0, zIndex: 90,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
            }}>
              <div style={{ position: 'relative' }}>
                <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search produce, transactions..."
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.65rem 1rem 0.65rem 2.8rem', width: '360px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {/* Network status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'white', border: '1px solid #e2e8f0', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
                  <div style={{ width: '7px', height: '7px', background: '#10b981', borderRadius: '50%' }} className="glow-pulse" />
                  BLOCKCHAIN ACTIVE
                </div>
                <button style={{ color: '#64748b' }}><Bell size={20} /></button>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px', height: '38px',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                  }}>
                    <User size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{user?.name || 'User'}</p>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    style={{ color: '#94a3b8', marginLeft: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <LogOut size={17} />
                  </button>
                </div>
              </div>
            </header>

            <main style={{ flex: 1 }}>
              {renderContent()}
            </main>
          </div>
        </>
      ) : (
        <main style={{ flex: 1 }}>
          {renderContent()}
        </main>
      )}
    </div>
  )
}

export default App
