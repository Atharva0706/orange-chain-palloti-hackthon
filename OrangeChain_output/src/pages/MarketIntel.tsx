import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ML_URL = 'http://localhost:8000';

const ALL_MARKETS = [
  'Nagpur APMC', 'Hingna APMC', 'Kamthi APMC', 'Narkhed APMC', 'Varud APMC',
  'Varud(Rajura Bazar) APMC', 'Chandrapur(Ganjwad) APMC',
  'Amrawati(Frui & Veg. Market) APMC', 'Jalgaon APMC',
  'Chattrapati Sambhajinagar APMC', 'Ahmednagar APMC', 'Rahuri APMC',
  'Rahata APMC', 'Shrirampur APMC', 'Nasik APMC', 'Pune APMC',
  'Pune(Moshi) APMC', 'Sangli(Phale, Bhajipura Market) APMC',
  'Kalyan APMC', 'Mumbai- Fruit Market APMC'
];

const PERIOD_MAP: Record<string, number> = {
  '7 Days': 7, '1 Month': 30, '6 Months': 180, '1 Year': 365
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a202c', color: 'white', padding: '0.9rem 1.1rem',
      borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', fontSize: '0.8rem'
    }}>
      <p style={{ margin: '0 0 0.4rem 0', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ margin: '0.1rem 0', color: p.color, fontWeight: 700 }}>
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const MarketIntel = () => {
  const [market, setMarket]   = useState('Nagpur APMC');
  const [period, setPeriod]   = useState('6 Months');
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => { fetchHistorical(); }, [market, period]);

  const fetchHistorical = async () => {
    setLoading(true);
    setError('');
    try {
      const days = PERIOD_MAP[period];
      const res  = await fetch(`${ML_URL}/historical?market=${encodeURIComponent(market)}&days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const hist: any[] = json.historical || [];

      // Downsample to max ~80 points for readability
      const step   = Math.max(1, Math.ceil(hist.length / 80));
      const sample = hist.filter((_: any, i: number) => i % step === 0);

      setChartData(sample.map((d: any) => ({
        date:   d.date.slice(5),   // MM-DD
        modal:  d.modal_price,
        min:    d.min_price,
        max:    d.max_price,
        volume: Math.round(d.volume),
      })));

      if (hist.length > 0) {
        const modals = hist.map((d: any) => d.modal_price);
        setStats({
          avg:  Math.round(modals.reduce((a: number, b: number) => a + b, 0) / modals.length),
          high: Math.round(Math.max(...modals)),
          low:  Math.round(Math.min(...modals)),
        });
      }
    } catch {
      setError('Could not load data. Make sure the ML server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem 2.5rem', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a202c', margin: 0, letterSpacing: '-0.5px' }}>
          Market Intelligence
        </h1>
        <p style={{ color: '#4a5568', fontSize: '0.95rem', marginTop: '0.2rem' }}>
          Deep-dive into multi-year commodity trends and harvest cycle performance across regional nodes.
        </p>
      </div>

      {/* Controls */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '1.25rem 1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>📍</span>
          <div style={{ position: 'relative' }}>
            <select
              value={market}
              onChange={e => setMarket(e.target.value)}
              style={{
                padding: '0.6rem 2.2rem 0.6rem 1rem', background: 'white',
                border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem',
                color: '#1a202c', fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer'
              }}
            >
              {ALL_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', pointerEvents: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'flex', background: '#f8fafc', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          {Object.keys(PERIOD_MAP).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              background: p === period ? '#f97316' : 'transparent',
              color:      p === period ? 'white' : '#4a5568',
              padding: '0.4rem 1rem', borderRadius: '6px', border: 'none',
              fontWeight: p === period ? 800 : 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: `AVG PRICE (${period.toUpperCase()})`, value: `₹${stats.avg.toLocaleString()}`, sub: 'per quintal', color: '#f97316' },
            { label: 'HIGHEST PRICE', value: `₹${stats.high.toLocaleString()}`, sub: 'per quintal', color: '#10b981' },
            { label: 'LOWEST PRICE',  value: `₹${stats.low.toLocaleString()}`,  sub: 'per quintal', color: '#e53e3e' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a202c' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.25rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Price Chart */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem 1.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>
          Price Trend — ₹ per Quintal
        </div>

        {loading && (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#a0aec0' }}>
            <div style={{
              width: 36, height: 36, border: '3px solid #f97316', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'mc-spin 0.8s linear infinite'
            }} />
            Loading market data…
          </div>
        )}

        {!loading && error && (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: '#e53e3e', fontSize: '0.9rem', textAlign: 'center' }}>⚠ {error}</p>
            <button onClick={fetchHistorical} style={{
              background: '#f97316', color: 'white', border: 'none',
              padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700
            }}>Retry</button>
          </div>
        )}

        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={320}>
            {/* @ts-ignore */}
            <ComposedChart data={chartData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mi-modal-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a0aec0', fontWeight: 700 }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a0aec0', fontWeight: 700 }} tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', fontWeight: 700 }} />
              <Area  type="monotone" dataKey="max"   name="Max"   stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 5" fill="none"               dot={false} />
              <Area  type="monotone" dataKey="modal" name="Modal" stroke="#f97316" strokeWidth={2.5} fill="url(#mi-modal-grad)"                      dot={false} />
              <Line  type="monotone" dataKey="min"   name="Min"   stroke="#10b981" strokeWidth={1} strokeDasharray="5 5"                             dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {!loading && !error && chartData.length === 0 && (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>
            No data available for the selected market &amp; period.
          </div>
        )}
      </div>

      {/* Volume Chart */}
      {!loading && !error && chartData.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem 1.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>
            Arrival Volume — Quintals
          </div>
          <ResponsiveContainer width="100%" height={140}>
            {/* @ts-ignore */}
            <ComposedChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a0aec0' }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a0aec0' }} width={55} />
              <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} qtl`, 'Volume']} />
              <Bar dataKey="volume" name="Volume" fill="#f97316" opacity={0.75} radius={[3,3,0,0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <style>{`@keyframes mc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MarketIntel;
