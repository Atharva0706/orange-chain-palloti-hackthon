import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, CheckCircle2, TrendingUp, MapPin,
    ChevronRight, ShieldCheck, BarChart3, Activity,
    Scan, Plus, Package, RefreshCw, Trash2, AlertCircle,
    Link2, Clock, Truck
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const generateChartData = () => [
    { name: '08:00', price: 4200 }, { name: '10:00', price: 4350 },
    { name: '12:00', price: 4100 }, { name: '14:00', price: 4400 },
    { name: '16:00', price: 4600 }, { name: '18:00', price: 4800 },
    { name: '20:00', price: 4750 },
];

interface Produce {
    _id: string; name: string; quantity: number; pricePerKg: number;
    location: string; status: string; aiGrade: string | null; createdAt: string;
}
interface FarmerTx {
    _id: string; amount: number; escrowStatus: string;
    blockHash: string | null; blockIndex: number | null; createdAt: string;
    produceId: { name: string; quantity: number; location: string } | null;
    buyerId: { name: string; trustScore: number } | null;
}

const STATUS_COLOR: Record<string, string> = {
    'Available': '#10b981', 'In Escrow': '#f59e0b', 'Sold': '#94a3b8',
    'Pending Deposit': '#f59e0b', 'Deposited': '#0ea5e9',
    'In Transit': '#8b5cf6', 'Delivered': '#10b981', 'Payment Released': '#10b981',
};

const FarmerDashboard = () => {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab]     = useState<'list' | 'listings' | 'orders'>('list');
    const [step, setStep]               = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [chartData, setChartData]     = useState(generateChartData());
    const [aiData, setAiData]           = useState<{ quality: string; confidence: string; estimatedValue: number } | null>(null);
    const [marketData, setMarketData]   = useState<{ predictedPrice: number; trend: string; bestMarket: string; net_price?: number; recommendation?: string; retail_per_kg?: number } | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [dIndex, setDIndex]           = useState(84.2);
    const [sFlow, setSFlow]             = useState(12.8);

    const [formName, setFormName]         = useState('Nagpur Oranges');
    const [formQty, setFormQty]           = useState('');
    const [formPrice, setFormPrice]       = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [listLoading, setListLoading]   = useState(false);
    const [listMsg, setListMsg]           = useState<{ text: string; ok: boolean } | null>(null);

    const [myProduce, setMyProduce] = useState<Produce[]>([]);
    const [myTxs, setMyTxs]         = useState<FarmerTx[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    // Helper: always reads the current token — no stale closure risk
    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
    }), [token]);

    useEffect(() => {
        const iv = setInterval(() => {
            setChartData(prev => {
                const last = prev[prev.length - 1].price;
                return [...prev.slice(1), {
                    name: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    price: Math.max(3500, last + (Math.random() * 60 - 30))
                }];
            });
            setDIndex(p => Math.min(100, Math.max(70, p + (Math.random() * 0.4 - 0.2))));
            setSFlow(p => Math.min(25, Math.max(5, p + (Math.random() * 0.2 - 0.1))));
        }, 3000);
        return () => clearInterval(iv);
    }, []);

    const fetchMyProduce = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/farmer/produce`, { headers: getHeaders() });
            if (res.ok) setMyProduce(await res.json());
        } catch { }
    }, [token, getHeaders]);

    const fetchMyTxs = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/farmer/transactions`, { headers: getHeaders() });
            if (res.ok) setMyTxs(await res.json());
        } catch { }
    }, [token, getHeaders]);

    const refreshAll = useCallback(async () => {
        setDataLoading(true);
        await Promise.all([fetchMyProduce(), fetchMyTxs()]);
        setDataLoading(false);
    }, [fetchMyProduce, fetchMyTxs]);

    useEffect(() => { refreshAll(); }, [refreshAll]);

    const handleUpload = async () => {
        setIsUploading(true);
        try {
            const r1 = await fetch(`${API}/ai/grade`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const d1 = await r1.json();
            setAiData({ quality: `${d1.quality} Grade`, confidence: d1.confidence, estimatedValue: d1.estimatedValue });
            setFormPrice(String(d1.estimatedValue));
        } catch {
            setAiData({ quality: 'Premium Grade A', confidence: '99.2', estimatedValue: 52 });
            setFormPrice('52');
        }
        try {
            const r2 = await fetch(`${API}/ml/predict?market=${encodeURIComponent(formLocation || 'Nagpur APMC')}`);
            const d2 = await r2.json();
            setMarketData({
                predictedPrice: d2.retail_per_kg || d2.predicted_prices?.modal_price / 100 || 54,
                trend: d2.demand_signal?.pressure === 'UNDERSUPPLY' ? 'Surging' :
                       d2.demand_signal?.pressure === 'OVERSUPPLY'  ? 'Falling' : 'Stable',
                bestMarket: d2.market || 'Nagpur APMC',
                net_price: d2.net_price,
                recommendation: d2.recommendation,
                retail_per_kg: d2.retail_per_kg,
            });
        } catch {
            setMarketData({ predictedPrice: 54, trend: 'Surging', bestMarket: 'Nagpur Central Hub' });
        }
        setIsUploading(false);
        setStep(2);
    };

    const handleListProduce = async () => {
        if (!formQty || !formPrice || !formLocation) {
            setListMsg({ text: 'Please fill in quantity, price per kg, and location.', ok: false });
            return;
        }
        setListLoading(true); setListMsg(null);
        try {
            const res = await fetch(`${API}/farmer/produce`, {
                method: 'POST', headers: getHeaders(),
                body: JSON.stringify({
                    name: formName, quantity: Number(formQty),
                    pricePerKg: Number(formPrice), location: formLocation,
                    aiGrade: aiData?.quality || null,
                    marketSuggestion: marketData?.bestMarket || null,
                })
            });
            const data = await res.json();
            if (!res.ok) { setListMsg({ text: data.msg || 'Failed to list produce', ok: false }); return; }
            setListMsg({ text: `Produce listed! Buyers can now see it.`, ok: true });
            setStep(4);
            setFormQty(''); setFormPrice(''); setFormLocation('');
            await fetchMyProduce();
            setTimeout(() => setActiveTab('listings'), 1800);
        } catch {
            setListMsg({ text: 'Cannot connect to server. Is the backend running on port 5000?', ok: false });
        } finally { setListLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this listing?')) return;
        try {
            const res = await fetch(`${API}/farmer/produce/${id}`, { method: 'DELETE', headers: getHeaders() });
            const data = await res.json();
            if (res.ok) await fetchMyProduce(); else alert(data.msg || 'Could not delete');
        } catch { alert('Server error'); }
    };

    const inp: React.CSSProperties = {
        width: '100%', padding: '0.9rem 1rem', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b',
        fontWeight: 600, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div style={{ padding: '2rem', height: 'calc(100vh - 70px)', overflowY: 'auto', background: '#f8fafc' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <span style={{ padding: '4px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>
                            FARMER PORTAL · {user?.name?.toUpperCase() || 'FARMER'}
                        </span>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-1.5px', color: '#1a202c', marginTop: '0.5rem' }}>Operations Hub</h1>
                    </div>
                    <button onClick={refreshAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                        <RefreshCw size={14} style={dataLoading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
                    </button>
                </header>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    {([
                        { id: 'list' as const,     label: '➕ List Produce' },
                        { id: 'listings' as const, label: `📦 My Listings (${myProduce.length})` },
                        { id: 'orders' as const,   label: `💰 Sales & Orders (${myTxs.length})` },
                    ]).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                            padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                            border: 'none', cursor: 'pointer',
                            background: activeTab === t.id ? 'var(--accent-orange)' : 'white',
                            color: activeTab === t.id ? 'white' : '#64748b',
                            boxShadow: activeTab === t.id ? '0 4px 12px rgba(249,115,22,0.25)' : 'none',
                            outline: activeTab === t.id ? 'none' : '1px solid #e2e8f0',
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
                    {/* LEFT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {activeTab === 'list' && (
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="glass" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0' }}>
                                        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 2rem' }}>
                                            <div style={{ position: 'absolute', inset: 0, border: '2px dashed var(--accent-orange)', borderRadius: '50%' }} className="glow-pulse" />
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={32} color="var(--accent-orange)" /></div>
                                        </div>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem' }}>Analyze Your Produce</h2>
                                        <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.6, fontWeight: 500 }}>
                                            Upload a photo for instant AI grading, or skip straight to listing.
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: 'var(--accent-orange)', color: 'white', padding: '1.1rem 2.5rem', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px -8px rgba(249,115,22,0.4)', fontSize: '0.95rem' }}>
                                                <Scan size={18} />
                                                {isUploading ? 'Scanning...' : 'Upload & AI Grade'}
                                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) { setUploadedImage(URL.createObjectURL(e.target.files[0])); handleUpload(); } }} />
                                            </label>
                                            <button onClick={() => setStep(3)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', padding: '1.1rem 2rem', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <Plus size={16} /> Skip to Form
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step >= 2 && step < 3 && (
                                    <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        className="glass" style={{ padding: '2.5rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ padding: '8px', background: '#10b981', borderRadius: '8px' }}><Activity size={18} color="white" /></div>
                                                <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>AI Vision Analysis</h3>
                                            </div>
                                            <span style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800 }}>AI CERTIFIED</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 170px', gap: '2rem', alignItems: 'center' }}>
                                            <div style={{ height: '180px', borderRadius: '20px', background: `url("${uploadedImage || 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=400&q=80'}") center/cover`, border: '4px solid #fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                                            <div>
                                                <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Quality Grade</p>
                                                <p style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-orange)', lineHeight: 1 }}>{aiData?.quality}</p>
                                                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ flex: 1, height: '5px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${aiData?.confidence}%` }} style={{ height: '100%', background: '#10b981' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{aiData?.confidence}%</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #edf2f7' }}>
                                                <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Est. Value</p>
                                                <p style={{ fontSize: '1.8rem', fontWeight: 900 }}>₹{aiData?.estimatedValue}</p>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>per kg</p>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', background: '#fefcfb', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <MapPin size={20} color="var(--accent-orange)" />
                                                <div>
                                                    <p style={{ fontWeight: 800 }}>Best Destination: {marketData?.bestMarket}</p>
                                                    <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{marketData?.trend} demand · ₹{marketData?.predictedPrice}/kg predicted</p>
                                                    {marketData?.recommendation && <p style={{ color: '#f59e0b', fontSize: '0.78rem', fontWeight: 700, marginTop: '0.3rem' }}>🤖 {marketData.recommendation}</p>}
                                                    {marketData?.net_price && <p style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 700 }}>Net after transport: ₹{marketData.net_price}/quintal</p>}
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(3)} style={{ background: '#1a202c', color: 'white', padding: '0.85rem 1.75rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                List Produce <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {(step === 3 || step === 4) && (
                                    <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="glass" style={{ padding: '2.5rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                                        {step === 4 ? (
                                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                                <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>Listed Successfully!</h3>
                                                <p style={{ color: '#64748b', fontWeight: 600 }}>Your lot is now visible to buyers on the marketplace.</p>
                                                <button onClick={() => { setStep(1); setAiData(null); setMarketData(null); setUploadedImage(null); setListMsg(null); }} style={{ marginTop: '1.5rem', padding: '0.85rem 2rem', background: 'var(--accent-orange)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>
                                                    + List Another Lot
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '0.35rem' }}>Publish Listing</h3>
                                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2rem' }}>
                                                    {aiData ? 'AI-graded values pre-filled — adjust as needed.' : 'Fill in details to list on the marketplace.'}
                                                </p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                                    <div style={{ gridColumn: '1/-1' }}>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Produce Name</label>
                                                        <input value={formName} onChange={e => setFormName(e.target.value)} style={inp} placeholder="e.g. Nagpur Oranges" />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Quantity (kg)</label>
                                                        <input type="number" value={formQty} onChange={e => setFormQty(e.target.value)} style={inp} placeholder="e.g. 5000" min="1" />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Price per kg (₹)</label>
                                                        <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} style={inp} placeholder="e.g. 48" min="1" />
                                                    </div>
                                                    <div style={{ gridColumn: '1/-1' }}>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Location / Mandi</label>
                                                        <input value={formLocation} onChange={e => setFormLocation(e.target.value)} style={inp} placeholder="e.g. Nagpur, Maharashtra" />
                                                    </div>
                                                    {aiData && (
                                                        <div style={{ gridColumn: '1/-1', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', gap: '1.5rem' }}>
                                                            <div><p style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.2rem' }}>AI GRADE</p><p style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>{aiData.quality}</p></div>
                                                            <div><p style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.2rem' }}>CONFIDENCE</p><p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{aiData.confidence}%</p></div>
                                                            {marketData && <div><p style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.2rem' }}>BEST MARKET</p><p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{marketData.bestMarket}</p></div>}
                                                        </div>
                                                    )}
                                                </div>
                                                {listMsg && (
                                                    <div style={{ marginTop: '1.25rem', padding: '0.9rem 1rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, background: listMsg.ok ? '#f0fdf4' : '#fef2f2', color: listMsg.ok ? '#16a34a' : '#dc2626', border: `1px solid ${listMsg.ok ? '#86efac' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                        {listMsg.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {listMsg.text}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                                                    <button onClick={() => { setStep(1); setListMsg(null); }} style={{ padding: '0.9rem 1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 700, color: '#64748b', background: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>← Back</button>
                                                    <button onClick={handleListProduce} disabled={listLoading} style={{ flex: 1, background: listLoading ? '#f4a261' : 'var(--accent-orange)', color: 'white', padding: '0.9rem', borderRadius: '12px', fontWeight: 900, border: 'none', cursor: listLoading ? 'not-allowed' : 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                                                        {listLoading ? <><RefreshCw size={16} /> Publishing...</> : <><Plus size={16} /> Publish Listing</>}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}

                        {activeTab === 'listings' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {myProduce.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                                        <Package size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                                        <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>No produce listed yet.</p>
                                    </div>
                                ) : myProduce.map(p => (
                                    <motion.div key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                            <div style={{ width: '44px', height: '44px', background: 'rgba(249,115,22,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🍊</div>
                                            <div>
                                                <p style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{p.name}</p>
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{p.quantity.toLocaleString()} kg · ₹{p.pricePerKg}/kg · {p.location}</p>
                                                {p.aiGrade && <p style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginTop: '0.2rem' }}>AI: {p.aiGrade}</p>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800, background: `${STATUS_COLOR[p.status] || '#94a3b8'}18`, color: STATUS_COLOR[p.status] || '#94a3b8' }}>{p.status}</span>
                                            {p.status === 'Available' && (
                                                <button onClick={() => handleDelete(p._id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {myTxs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                                        <Clock size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                                        <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>No orders yet.</p>
                                        <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>Once a buyer purchases your produce, it will appear here.</p>
                                    </div>
                                ) : myTxs.map(tx => {
                                    const onChain = !!tx.blockHash;
                                    return (
                                        <motion.div key={tx._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            style={{ background: 'white', borderRadius: '14px', border: `1px solid ${onChain ? '#86efac' : '#e2e8f0'}`, overflow: 'hidden' }}>
                                            {onChain && (
                                                <div style={{ background: 'linear-gradient(90deg,#10b981,#059669)', padding: '0.45rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <Link2 size={13} color="white" />
                                                    <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>ON-CHAIN · Block #{tx.blockIndex} · {tx.blockHash?.substring(0, 22)}...</span>
                                                </div>
                                            )}
                                            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <div style={{ width: '40px', height: '40px', background: onChain ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.08)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {onChain ? <ShieldCheck size={18} color="#10b981" /> : <Truck size={18} color="var(--accent-orange)" />}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{tx.produceId?.name || 'Orange Lot'} — {tx.produceId?.quantity?.toLocaleString()} kg</p>
                                                        <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Buyer: {tx.buyerId?.name || 'Unknown'} · {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '1.2rem', fontWeight: 950, color: '#1e293b' }}>₹{tx.amount.toLocaleString()}</p>
                                                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: `${STATUS_COLOR[tx.escrowStatus] || '#94a3b8'}18`, color: STATUS_COLOR[tx.escrowStatus] || '#94a3b8', marginTop: '0.2rem' }}>{tx.escrowStatus}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Analytics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="glass" style={{ padding: '1.75rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={16} color="var(--accent-orange)" /> Spot Price</h3>
                                <div style={{ padding: '3px 10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 900 }}>LIVE</div>
                            </div>
                            <div style={{ height: '180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="cP" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--accent-orange)" stopOpacity={0.12} />
                                                <stop offset="95%" stopColor="var(--accent-orange)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" hide />
                                        <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                                        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', fontWeight: 700 }} />
                                        <Area type="monotone" dataKey="price" stroke="var(--accent-orange)" strokeWidth={2.5} fillOpacity={1} fill="url(#cP)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1, padding: '0.85rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.62rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.5px' }}>D-INDEX</p>
                                    <p style={{ fontWeight: 950, fontSize: '1.1rem', color: '#1e293b' }}>{dIndex.toFixed(1)}</p>
                                </div>
                                <div style={{ flex: 1, padding: '0.85rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.62rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.5px' }}>S-FLOW</p>
                                    <p style={{ fontWeight: 950, fontSize: '1.1rem', color: '#1e293b' }}>{sFlow.toFixed(1)}t/h</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '1.75rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={16} color="#10b981" /> Predicted Gains</h3>
                            {[{ label: 'Local Mandi', value: '₹46.2', sub: 'Immediate', hi: false }, { label: 'Regional Hub', value: '₹52.5', sub: 'Next 24h', hi: true }, { label: 'Export Terminal', value: '₹64.8', sub: 'Next 120h', hi: false }].map(r => (
                                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', background: r.hi ? 'rgba(16,185,129,0.05)' : '#f8fafc', borderRadius: '10px', border: r.hi ? '1px solid rgba(16,185,129,0.12)' : '1px solid transparent', marginBottom: '0.6rem' }}>
                                    <div><p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{r.label}</p><p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{r.sub}</p></div>
                                    <p style={{ fontWeight: 900, color: r.hi ? '#10b981' : '#1a202c' }}>{r.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="glass" style={{ padding: '1.75rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '1.25rem' }}>Portfolio Summary</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {[
                                    { label: 'Available', value: String(myProduce.filter(p => p.status === 'Available').length) },
                                    { label: 'In Escrow',  value: String(myProduce.filter(p => p.status === 'In Escrow').length) },
                                    { label: 'Orders',     value: String(myTxs.length) },
                                    { label: 'On-Chain',   value: String(myTxs.filter(t => t.blockHash).length) },
                                ].map(s => (
                                    <div key={s.label} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.4rem', fontWeight: 950, color: '#1e293b' }}>{s.value}</p>
                                        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;
