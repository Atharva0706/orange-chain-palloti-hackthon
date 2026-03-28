import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, AlertCircle, RefreshCw, Plus, Package, Trash2, Truck, Calendar, ChevronDown } from 'lucide-react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ALL_MARKETS = [
  'Nagpur APMC','Hingna APMC','Kamthi APMC','Narkhed APMC','Varud APMC',
  'Varud(Rajura Bazar) APMC','Chandrapur(Ganjwad) APMC',
  'Amrawati(Frui & Veg. Market) APMC','Jalgaon APMC',
  'Chattrapati Sambhajinagar APMC','Ahmednagar APMC','Rahuri APMC',
  'Rahata APMC','Shrirampur APMC','Nasik APMC','Pune APMC',
  'Pune(Moshi) APMC','Sangli(Phale, Bhajipura Market) APMC',
  'Kalyan APMC','Mumbai- Fruit Market APMC'
];

const ML_URL      = 'http://localhost:8000';
const BACKEND_URL = 'http://localhost:5000';
const todayISO    = () => new Date().toISOString().split('T')[0];

const recColor = (r) => {
  const u = (r||'').toUpperCase();
  if (u.includes('SELL NOW'))    return '#16a34a';
  if (u.includes('REROUTE'))     return '#ef4444';
  if (u.includes('HOLD'))        return '#f59e0b';
  if (u.includes('SELL'))        return '#f97316';
  return '#4a5568';
};
const recBg = (r) => {
  const u = (r||'').toUpperCase();
  if (u.includes('SELL NOW'))    return '#f0fdf4';
  if (u.includes('REROUTE'))     return '#fef2f2';
  if (u.includes('HOLD'))        return '#fffbeb';
  if (u.includes('SELL'))        return '#fff7ed';
  return '#f8fafc';
};

const STATUS_STEPS = ['Pending Deposit', 'Deposited', 'In Transit', 'Delivered', 'Payment Released'];
const statusColor  = (s) => {
  if (s === 'Payment Released') return '#16a34a';
  if (s === 'Delivered')        return '#3b82f6';
  if (s === 'In Transit')       return '#f59e0b';
  if (s === 'Deposited')        return '#f97316';
  return '#94a3b8';
};

const FarmerDashboard = ({ initialTab = 'list' }: { initialTab?: string }) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // ── Publish Listing form ────────────────────────────────────────────────
  const [produceName,  setProduceName]  = useState('Nagpur Oranges');
  const [quantity,     setQuantity]     = useState('');
  const [pricePerKg,   setPricePerKg]   = useState('');
  const [location,     setLocation]     = useState('Nagpur, Maharashtra');
  const [listing,      setListing]      = useState(false);
  const [listMsg,      setListMsg]      = useState('');
  const [listErr,      setListErr]      = useState('');

  // ── My Listings ─────────────────────────────────────────────────────────
  const [myListings,   setMyListings]   = useState([]);
  const [loadingList,  setLoadingList]  = useState(false);

  // ── Sales & Orders ───────────────────────────────────────────────────────
  const [orders,       setOrders]       = useState([]);
  const [loadingOrders,setLoadingOrders]= useState(false);
  const [shipMsg,      setShipMsg]      = useState<Record<string,string>>({});
  const [shipLoading,  setShipLoading]  = useState<Record<string,boolean>>({});

  // ── Price Forecast ────────────────────────────────────────────────────────
  const [predMarket,   setPredMarket]   = useState('Nagpur APMC');
  const [predDate,     setPredDate]     = useState(todayISO());
  const [mlData,       setMlData]       = useState(null);
  const [predLoading,  setPredLoading]  = useState(false);
  const [predError,    setPredError]    = useState('');
  const [forecastData, setForecastData] = useState([]);

  useEffect(() => {
    if (activeTab === 'mylistings') fetchMyListings();
    if (activeTab === 'orders')     fetchOrders();
    if (activeTab === 'prediction') fetchPrediction();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'prediction') fetchPrediction();
  }, [predMarket, predDate]);

  // ── API: Fetch my listings ───────────────────────────────────────────────
  const fetchMyListings = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farmer/produce`, {
        headers: { 'x-auth-token': token || '' }
      });
      if (res.ok) setMyListings(await res.json());
      else setMyListings([]);
    } catch { setMyListings([]); }
    finally { setLoadingList(false); }
  };

  // ── API: Fetch orders ─────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farmer/transactions`, {
        headers: { 'x-auth-token': token || '' }
      });
      if (res.ok) setOrders(await res.json());
      else setOrders([]);
    } catch { setOrders([]); }
    finally { setLoadingOrders(false); }
  };

  // ── API: Confirm shipment ─────────────────────────────────────────────────
  const confirmShipment = async (txId: string) => {
    setShipLoading(prev => ({ ...prev, [txId]: true }));
    setShipMsg(prev => ({ ...prev, [txId]: '' }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/farmer/transactions/${txId}/ship`, {
        method: 'PATCH',
        headers: { 'x-auth-token': token || '' }
      });
      const data = await res.json();
      if (res.ok) {
        setShipMsg(prev => ({ ...prev, [txId]: '✓ Shipment confirmed! Status updated to In Transit.' }));
        fetchOrders(); // refresh
      } else {
        setShipMsg(prev => ({ ...prev, [txId]: data.msg || 'Failed to confirm shipment.' }));
      }
    } catch {
      setShipMsg(prev => ({ ...prev, [txId]: 'Backend unreachable.' }));
    } finally {
      setShipLoading(prev => ({ ...prev, [txId]: false }));
    }
  };

  // ── API: Delete a listing ────────────────────────────────────────────────
  const deleteListing = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/farmer/produce/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token || '' }
      });
      fetchMyListings();
    } catch {}
  };

  // ── API: Publish listing ─────────────────────────────────────────────────
  const handlePublish = async () => {
    setListErr(''); setListMsg('');
    if (!produceName.trim() || !quantity || !pricePerKg || !location.trim()) {
      setListErr('Please fill in all fields.'); return;
    }
    setListing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farmer/produce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({
          name: produceName.trim(), quantity: Number(quantity),
          pricePerKg: Number(pricePerKg), location: location.trim()
        })
      });
      const data = await res.json();
      if (res.ok) { setListMsg('✓ Listing published successfully!'); setQuantity(''); setPricePerKg(''); }
      else { setListErr(data.msg || 'Failed to publish listing.'); }
    } catch { setListErr('Backend unreachable. Is the Node server running on port 5000?'); }
    finally { setListing(false); }
  };

  // ── API: Fetch ML prediction ─────────────────────────────────────────────
  const fetchPrediction = async () => {
    setPredLoading(true); setPredError(''); setMlData(null);
    try {
      const r1 = await fetch(`${ML_URL}/predict?market=${encodeURIComponent(predMarket)}&date=${predDate}`);
      if (!r1.ok) throw new Error(`HTTP ${r1.status}`);
      setMlData(await r1.json());
      const r2 = await fetch(`${ML_URL}/forecast?market=${encodeURIComponent(predMarket)}&days=7`);
      if (r2.ok) setForecastData((await r2.json()).forecast ?? []);
    } catch (e: any) {
      setPredError(e.message || 'ML server error. Is it running on port 8000?');
    } finally { setPredLoading(false); }
  };

  const chartData = forecastData.map((d: any) => ({
    name: d.date.slice(5), modal: d.modal_price, min: d.min_price, max: d.max_price
  }));

  const tabBtn = (id, label, icon) => (
    <button key={id} onClick={() => setActiveTab(id)} style={{
      padding: '0.6rem 1.25rem',
      background: activeTab === id ? '#f97316' : 'white',
      color: activeTab === id ? 'white' : '#4a5568',
      border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
      boxShadow: activeTab === id ? '0 4px 10px rgba(249,115,22,0.3)' : '0 2px 4px rgba(0,0,0,0.02)',
      transition: 'all 0.15s'
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ padding: '2rem 2.5rem', background: '#f5f7fa', minHeight: '100vh' }}>

      {/* Page header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a202c', margin: 0, letterSpacing: '-0.5px' }}>Operations Hub</h1>
          <p style={{ color: '#4a5568', fontSize: '0.95rem', marginTop: '0.2rem' }}>Monitoring harvest efficiency and regional commerce.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <input placeholder="Search harvests..." style={{ padding: '0.65rem 1rem 0.65rem 2.6rem', borderRadius: '50px', border: '1px solid #e2e8f0', width: 260, fontSize: '0.9rem', outline: 'none', background: 'white' }} />
          </div>
          <button style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer' }}><Bell size={20} /></button>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>
            {user?.name?.charAt(0).toUpperCase() || 'F'}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {tabBtn('list',       '+ Publish Listing', <Plus size={15} />)}
        {tabBtn('mylistings', `My Listings (${myListings.length || 0})`, <Package size={15} />)}
        {tabBtn('orders',     `Sales & Orders (${orders.length || 0})`, '🔥')}
      </div>

      {/* ── PUBLISH LISTING TAB ─────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div style={{ maxWidth: 860, background: 'white', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a202c', margin: '0 0 0.4rem 0' }}>Publish Listing</h2>
          <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '2rem' }}>Fill in details to list on the marketplace.</p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.6rem' }}>Produce Name</label>
            <input type="text" value={produceName} onChange={e => setProduceName(e.target.value)} placeholder="e.g. Nagpur Oranges"
              style={{ width: '100%', padding: '0.9rem 1.1rem', background: '#f7fafc', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600, color: '#2d3748', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.6rem' }}>Quantity (KG)</label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 5000"
                style={{ width: '100%', padding: '0.9rem 1.1rem', background: '#f7fafc', border: 'none', borderRadius: '10px', fontSize: '0.95rem', color: '#2d3748', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.6rem' }}>Price Per KG (₹)</label>
              <input type="number" value={pricePerKg} onChange={e => setPricePerKg(e.target.value)} placeholder="e.g. 48"
                style={{ width: '100%', padding: '0.9rem 1.1rem', background: '#f7fafc', border: 'none', borderRadius: '10px', fontSize: '0.95rem', color: '#2d3748', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.6rem' }}>Location / Mandi</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Nagpur, Maharashtra"
              style={{ width: '100%', padding: '0.9rem 1.1rem', background: '#f7fafc', border: 'none', borderRadius: '10px', fontSize: '0.95rem', color: '#2d3748', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {listErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#dc2626', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {listErr}
            </div>
          )}
          {listMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>
              {listMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => { setProduceName('Nagpur Oranges'); setQuantity(''); setPricePerKg(''); setLocation('Nagpur, Maharashtra'); setListErr(''); setListMsg(''); }}
              style={{ padding: '0.85rem 1.75rem', background: 'white', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              ← Reset
            </button>
            <button onClick={handlePublish} disabled={listing}
              style={{ flex: 1, padding: '0.85rem', background: listing ? '#fdba74' : '#f97316', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '1rem', cursor: listing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s' }}>
              {listing
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Publishing…</>
                : <><Plus size={18} /> Publish Listing</>}
            </button>
          </div>
        </div>
      )}

      {/* ── MY LISTINGS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'mylistings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a202c', margin: 0 }}>My Active Listings</h2>
            <button onClick={fetchMyListings} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, color: '#4a5568', cursor: 'pointer' }}>
              <RefreshCw size={13} style={loadingList ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
            </button>
          </div>

          {loadingList && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
              Loading listings…
            </div>
          )}

          {!loadingList && myListings.length === 0 && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a202c', marginBottom: '0.5rem' }}>No listings yet</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Publish your first listing to start selling on the marketplace.</p>
              <button onClick={() => setActiveTab('list')} style={{ background: '#f97316', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                + Publish Listing
              </button>
            </div>
          )}

          {!loadingList && myListings.length > 0 && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {myListings.map((item: any) => (
                <div key={item._id} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, background: '#fff7ed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🍊</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a202c' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.15rem' }}>{item.location}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', fontWeight: 700 }}>Quantity</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1a202c' }}>{Number(item.quantity).toLocaleString()} kg</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', fontWeight: 700 }}>Price/kg</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f97316' }}>₹{item.pricePerKg}</div>
                    </div>
                    <div>
                      <span style={{ background: item.status === 'Available' ? '#f0fdf4' : '#f1f5f9', color: item.status === 'Available' ? '#16a34a' : '#64748b', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {item.status || 'Available'}
                      </span>
                    </div>
                    {item.status === 'Available' && (
                      <button onClick={() => deleteListing(item._id)} title="Remove listing" style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SALES & ORDERS TAB ───────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a202c', margin: 0 }}>Sales & Orders</h2>
            <button onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, color: '#4a5568', cursor: 'pointer' }}>
              <RefreshCw size={13} style={loadingOrders ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
            </button>
          </div>

          {loadingOrders && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
              Loading orders…
            </div>
          )}

          {!loadingOrders && orders.length === 0 && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔥</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a202c', marginBottom: '0.5rem' }}>No Orders Yet</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Your sales and orders will appear here once buyers engage with your listings.</p>
            </div>
          )}

          {!loadingOrders && orders.length > 0 && (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {orders.map((order: any) => {
                const stepIdx = STATUS_STEPS.indexOf(order.escrowStatus);
                const produce = order.produceId;
                const buyer = order.buyerId;
                const canShip = order.escrowStatus === 'Deposited';
                return (
                  <div key={order._id} style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                    {/* Order header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 44, height: 44, background: '#fff7ed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🍊</div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a202c' }}>
                            {produce?.name || 'Produce'} — {Number(produce?.quantity || 0).toLocaleString()} kg
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#718096', marginTop: '0.15rem' }}>
                            Buyer: {buyer?.name || 'Unknown'} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1a202c' }}>₹{Number(order.amount).toLocaleString()}</div>
                        <span style={{ background: `${statusColor(order.escrowStatus)}20`, color: statusColor(order.escrowStatus), padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {order.escrowStatus}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '1.25rem' }}>
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= stepIdx;
                        const isCurrent = i === stepIdx;
                        return (
                          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? (isCurrent ? '#f97316' : '#10b981') : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isCurrent ? '3px solid #fdba74' : 'none', transition: 'all 0.3s' }}>
                                {done && !isCurrent ? <span style={{ color: 'white', fontSize: '0.75rem' }}>✓</span> : isCurrent ? <span style={{ color: 'white', fontSize: '0.75rem' }}>●</span> : <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>○</span>}
                              </div>
                              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: done ? '#1a202c' : '#94a3b8', marginTop: '0.3rem', textAlign: 'center', maxWidth: 64, lineHeight: 1.2 }}>{step.replace(' ', '\n')}</div>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div style={{ flex: 1, height: 3, background: i < stepIdx ? '#10b981' : '#e2e8f0', transition: 'background 0.3s', marginBottom: '1.2rem' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action button */}
                    {canShip && (
                      <div>
                        <button onClick={() => confirmShipment(order._id)} disabled={!!shipLoading[order._id]}
                          style={{ background: shipLoading[order._id] ? '#fdba74' : '#f97316', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: shipLoading[order._id] ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {shipLoading[order._id]
                            ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Confirming…</>
                            : <><Truck size={16} /> Confirm Shipment</>}
                        </button>
                        {shipMsg[order._id] && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: shipMsg[order._id].startsWith('✓') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                            {shipMsg[order._id]}
                          </div>
                        )}
                      </div>
                    )}

                    {order.escrowStatus === 'In Transit' && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.82rem', color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🚚 Order is in transit — awaiting buyer delivery confirmation.
                      </div>
                    )}
                    {order.escrowStatus === 'Delivered' && (
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.82rem', color: '#1d4ed8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📦 Delivered — awaiting payment release.
                      </div>
                    )}
                    {order.escrowStatus === 'Payment Released' && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.82rem', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ✅ Payment released — transaction complete.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default FarmerDashboard;
