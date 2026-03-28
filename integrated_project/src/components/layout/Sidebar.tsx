import { 
  LayoutDashboard, TrendingUp, Map, Truck, Search, 
  Wallet, ShoppingCart, LogOut, Link2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: string;
}

const farmerNav = [
  { id: 'farmer',    label: 'Dashboard',          icon: LayoutDashboard, color: '#10b981' },
  { id: 'forecast',  label: 'Price Forecast',      icon: TrendingUp,      color: '#f59e0b' },
  { id: 'mission',   label: 'Mission Control',     icon: Map,             color: '#ef4444' },
  { id: 'transport', label: 'Transport Booking',   icon: Truck,           color: '#0ea5e9' },
  { id: 'quality',   label: 'Quality Analysis',    icon: Search,          color: '#8b5cf6' },
  { id: 'wallet',    label: 'Blockchain Ledger',   icon: Link2,           color: '#6366f1' },
];

const buyerNav = [
  { id: 'buyer',     label: 'Market',              icon: ShoppingCart,    color: '#10b981' },
  { id: 'market',    label: 'Market Map',          icon: Map,             color: '#ef4444' },
  { id: 'transport', label: 'Transport Booking',   icon: Truck,           color: '#0ea5e9' },
  { id: 'wallet',    label: 'Blockchain Ledger',   icon: Link2,           color: '#6366f1' },
];

const Sidebar = ({ activeTab, setActiveTab, userRole }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navItems = userRole === 'buyer' ? buyerNav : farmerNav;

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: '#0f172a',
      position: 'fixed',
      left: 0, top: 0,
      display: 'flex', flexDirection: 'column',
      padding: '0',
      zIndex: 100,
      borderRight: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Logo */}
      <div style={{ padding: '1.8rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--accent-orange)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>🍊</span>
          </div>
          <div>
            <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>OrangeChain</p>
            <p style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {userRole === 'buyer' ? 'Buyer Portal' : 'Farmer Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1.25rem 1rem', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>Navigation</p>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.8rem 1rem', borderRadius: '10px', border: 'none',
                marginBottom: '4px',
                background: isActive ? `rgba(249, 115, 22, 0.12)` : 'transparent',
                color: isActive ? 'var(--accent-orange)' : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s',
                borderLeft: isActive ? `3px solid var(--accent-orange)` : '3px solid transparent'
              }}
            >
              <Icon size={18} color={isActive ? 'var(--accent-orange)' : '#64748b'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: '1.25rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.5rem' }}>
          <div style={{ width: '34px', height: '34px', background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</p>
            <p style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
          <button onClick={logout} title="Logout" style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
