import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, ChevronDown, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
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
const ML_URL = 'http://localhost:8000';
const todayISO = () => new Date().toISOString().split('T')[0];
const recColor = (r) => { const u=(r||'').toUpperCase(); if(u.includes('SELL'))return'#f97316'; if(u.includes('HOLD'))return'#f59e0b'; if(u.includes('REROUTE'))return'#ef4444'; return'#4a5568'; };
const recBg    = (r) => { const u=(r||'').toUpperCase(); if(u.includes('SELL'))return'#fff7ed'; if(u.includes('HOLD'))return'#fffbeb'; return'#f8fafc'; };

const TraderDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analysis');
  const [market, setMarket]       = useState('Nagpur APMC');
  const [predDate, setPredDate]   = useState(todayISO());
  const [mlData, setMlData]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [predError, setPredError] = useState('');
  const [forecastData, setForecastData] = useState([]);

  useEffect(() => { fetchPrediction(); }, [market, predDate]);

  const fetchPrediction = async () => {
    setLoading(true); setPredError(''); setMlData(null);
    try {
      const r1 = await fetch(`${ML_URL}/predict?market=${encodeURIComponent(market)}&date=${predDate}`);
      if (!r1.ok) throw new Error(`HTTP ${r1.status} — ${await r1.text()}`);
      setMlData(await r1.json());
      const r2 = await fetch(`${ML_URL}/forecast?market=${encodeURIComponent(market)}&days=7`);
      if (r2.ok) setForecastData((await r2.json()).forecast ?? []);
    } catch (e) { setPredError(e.message || 'ML server error. Is it running on port 8000?'); }
    finally { setLoading(false); }
  };

  const chartData = forecastData.map((d) => ({ name: d.date.slice(5), modal: d.modal_price, min: d.min_price, max: d.max_price }));

  const tabBtn = (id, label, icon) => (
    <button key={id} onClick={() => setActiveTab(id)} style={{ padding:'0.6rem 1.25rem', background: activeTab===id?'#f97316':'white', color: activeTab===id?'white':'#4a5568', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'0.9rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem', boxShadow: activeTab===id?'0 4px 10px rgba(249,115,22,0.3)':'0 2px 4px rgba(0,0,0,0.02)' }}>
      <span style={{ color: activeTab===id?'white':'#a0aec0' }}>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ padding:'2rem 2.5rem', background:'#f5f7fa', minHeight:'100vh' }}>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem' }}>
        <div>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800, color:'#1a202c', margin:0, letterSpacing:'-0.5px' }}>Market Intelligence Hub</h1>
          <p style={{ color:'#4a5568', fontSize:'0.95rem', marginTop:'0.2rem' }}>Real-time commodity trends and regional market analysis.</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
          <div style={{ position:'relative' }}>
            <Search size={18} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'#a0aec0' }} />
            <input placeholder="Search markets..." style={{ padding:'0.65rem 1rem 0.65rem 2.6rem', borderRadius:'50px', border:'1px solid #e2e8f0', width:260, fontSize:'0.9rem', outline:'none', background:'white' }} />
          </div>
          <button style={{ background:'none', border:'none', color:'#4a5568', cursor:'pointer' }}><Bell size={20} /></button>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1rem' }}>
            {user?.name?.charAt(0).toUpperCase()||'T'}
          </div>
        </div>
      </header>

      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'2rem' }}>
        {tabBtn('analysis','Price Analysis','🔮')}
        {tabBtn('orders','Orders','📦')}
      </div>

      {/* ANALYSIS TAB */}
      {activeTab==='analysis' && (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:'2rem' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'2rem', boxShadow:'0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <div>
                <h3 style={{ fontSize:'1.2rem', fontWeight:800, color:'#1a202c', margin:'0 0 0.25rem 0' }}>7-Day Price Forecast</h3>
                <p style={{ fontSize:'0.8rem', color:'#94a3b8', margin:0 }}>Min / Modal / Max prices per quintal (₹)</p>
              </div>
              <button onClick={fetchPrediction} disabled={loading} style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'0.5rem 0.9rem', fontSize:'0.8rem', fontWeight:700, color:'#4a5568', cursor:'pointer' }}>
                <RefreshCw size={13} style={loading?{animation:'spin 1s linear infinite'}:{}} /> Refresh
              </button>
            </div>
            {loading && (<div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1rem', color:'#94a3b8' }}><div style={{ width:32, height:32, border:'3px solid #f97316', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Fetching prediction…</div>)}
            {!loading && predError && (<div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1rem' }}><p style={{ color:'#e53e3e', fontSize:'0.85rem', textAlign:'center', maxWidth:360 }}>⚠ {predError}</p><button onClick={fetchPrediction} style={{ background:'#f97316', color:'white', border:'none', padding:'0.6rem 1.5rem', borderRadius:'8px', cursor:'pointer', fontWeight:700 }}>Retry</button></div>)}
            {!loading && !predError && chartData.length>0 && (
              <ResponsiveContainer width="100%" height={300}>
                {/* @ts-ignore */}
                <ComposedChart data={chartData} margin={{ top:6, right:10, left:0, bottom:0 }}>
                  <defs><linearGradient id="td-modal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.18}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#a0aec0', fontWeight:700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#a0aec0', fontWeight:700 }} tickFormatter={v=>`₹${(v/1000).toFixed(1)}k`} width={55} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active||!payload?.length) return null;
                    return (<div style={{ background:'#1a202c', color:'white', padding:'0.9rem 1.1rem', borderRadius:'10px', fontSize:'0.8rem' }}><p style={{ margin:'0 0 0.4rem 0', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', fontSize:'0.7rem' }}>{label}</p>{payload.map((p)=>(<p key={p.name} style={{ margin:'0.1rem 0', color:p.color, fontWeight:700 }}>{p.name}: ₹{Number(p.value).toLocaleString()}</p>))}</div>);
                  }} />
                  <Area type="monotone" dataKey="max"   name="Max"   stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 5" fill="none"           dot={false} />
                  <Area type="monotone" dataKey="modal" name="Modal" stroke="#f97316" strokeWidth={2.5} fill="url(#td-modal)"                        dot={{ r:4, fill:'#f97316', stroke:'white', strokeWidth:2 }} />
                  <Line type="monotone" dataKey="min"   name="Min"   stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5"                        dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:'1rem', marginTop:'1rem', display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'#a0aec0', fontWeight:700 }}>
              <span>ML Server: port 8000 (FastAPI)</span><span style={{ color:'#10b981' }}>● Model v2.0 active</span>
            </div>
          </div>

          <div style={{ background:'white', borderRadius:'16px', padding:'2rem', boxShadow:'0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#1a202c', margin:'0 0 1.5rem 0' }}>Market Analysis</h3>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#718096', textTransform:'uppercase', marginBottom:'0.4rem' }}>Select Mandi</label>
              <div style={{ position:'relative' }}>
                <select value={market} onChange={e=>setMarket(e.target.value)} style={{ width:'100%', padding:'0.75rem 1rem', background:'#f7fafc', border:'none', borderRadius:'8px', fontSize:'0.9rem', color:'#2d3748', appearance:'none', outline:'none' }}>
                  {ALL_MARKETS.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={14} style={{ position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)', color:'#a0aec0' }} />
              </div>
            </div>
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#718096', textTransform:'uppercase', marginBottom:'0.4rem' }}>Predict for Date</label>
              <div style={{ position:'relative' }}>
                <input type="date" value={predDate} onChange={e=>setPredDate(e.target.value)} style={{ width:'100%', padding:'0.75rem 1rem', background:'#f7fafc', border:'none', borderRadius:'8px', fontSize:'0.9rem', color:'#2d3748', outline:'none', boxSizing:'border-box' }} />
                <Calendar size={14} style={{ position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)', color:'#a0aec0', pointerEvents:'none' }} />
              </div>
            </div>
            {mlData && (
              <>
                <div style={{ background:recBg(mlData.recommendation), padding:'1rem', borderRadius:'10px', marginBottom:'1rem', border:`1px solid ${recColor(mlData.recommendation)}30` }}>
                  <div style={{ fontSize:'0.7rem', fontWeight:800, color:recColor(mlData.recommendation), textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.4rem' }}>Recommendation</div>
                  <div style={{ fontSize:'1.35rem', fontWeight:900, color:recColor(mlData.recommendation) }}>{mlData.recommendation}</div>
                </div>
                <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'1rem', borderLeft:'3px solid #f97316' }}>
                  <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#a0aec0', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.75rem' }}>Predicted Prices (₹/quintal)</div>
                  {[{label:'Min Price',value:mlData.predicted_prices?.min_price,color:'#4a5568'},{label:'Modal Price',value:mlData.predicted_prices?.modal_price,color:'#f97316'},{label:'Max Price',value:mlData.predicted_prices?.max_price,color:'#4a5568'}].map(row=>(
                    <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.4rem 0', borderBottom:'1px solid #f1f5f9' }}>
                      <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#718096' }}>{row.label}</span>
                      <span style={{ fontSize:'1rem', fontWeight:800, color:row.color }}>₹{Number(row.value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {mlData.demand_signal?.pressure && (
                  <div style={{ marginTop:'1rem', background:'#f0fdf4', padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid #86efac', display:'flex', gap:'0.5rem' }}>
                    <AlertCircle size={15} style={{ color:'#16a34a', flexShrink:0, marginTop:1 }} />
                    <div>
                      <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#166534', textTransform:'uppercase' }}>Market Signal</div>
                      <div style={{ fontSize:'0.85rem', color:'#166534', fontWeight:600 }}>{mlData.demand_signal.pressure} — {mlData.demand_signal.signal}</div>
                    </div>
                  </div>
                )}
              </>
            )}
            {!mlData && !loading && !predError && (<div style={{ textAlign:'center', color:'#a0aec0', fontSize:'0.85rem', marginTop:'2rem' }}>Prediction loads automatically on market/date change.</div>)}
          </div>
        </div>
      )}

      {activeTab==='orders' && (
        <div style={{ background:'white', borderRadius:'16px', padding:'3rem', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📦</div>
          <h3 style={{ fontSize:'1.2rem', fontWeight:800, color:'#1a202c', marginBottom:'0.5rem' }}>No Orders Yet</h3>
          <p style={{ color:'#94a3b8', fontSize:'0.9rem' }}>Orders will appear here once you engage with produce listings.</p>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
};
export default TraderDashboard;
