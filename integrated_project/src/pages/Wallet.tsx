import { useState, useEffect, useCallback } from 'react';
import {
    Wallet as WalletIcon, ShieldCheck, Activity,
    ExternalLink, RefreshCw, Link2, AlertCircle, Box,
    CheckCircle2, Clock, ArrowDownLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const API         = 'http://localhost:5000/api';
const BLOCKCHAIN  = 'http://localhost:5001';

interface BlockchainTx {
    transactionId: string; produceName?: string;
    farmerId: string; farmerName?: string;
    buyerId: string; buyerName?: string;
    amount: number; escrowStatus: string; timestamp: string;
}
interface Block {
    index: number; timestamp: number; hash: string;
    previous_hash: string; nonce: number;
    transactions: BlockchainTx[];
}

const Wallet = () => {
    const { token, user } = useAuth();
    const [chain, setChain]           = useState<Block[]>([]);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');
    const [pending, setPending]       = useState<BlockchainTx[]>([]);
    const [chainValid, setChainValid] = useState<boolean | null>(null);
    const [activeTab, setActiveTab]   = useState<'chain' | 'pending'>('chain');
    const [myTxs, setMyTxs]           = useState<any[]>([]);

    // Build headers inside callbacks so token is always current
    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
    }), [token]);

    const fetchChain = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res  = await fetch(`${API}/blockchain/chain`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch chain');
            setChain(data.chain || []);
            setChainValid(data.is_valid ?? null);
        } catch (e: any) {
            setError(e.message || 'Blockchain service unavailable. Make sure blockchain.py is running on port 5001.');
        } finally { setLoading(false); }
    }, []);

    const fetchPending = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/blockchain/pending`);
            const data = await res.json();
            if (res.ok) setPending(data.pending_transactions || []);
        } catch { }
    }, []);

    const fetchMyTxs = useCallback(async () => {
        if (!token) return;
        const endpoint = user?.role === 'buyer' ? 'buyer' : 'farmer';
        try {
            const res  = await fetch(`${API}/${endpoint}/transactions`, { headers: getHeaders() });
            if (res.ok) setMyTxs(await res.json());
        } catch { }
    }, [token, user, getHeaders]);

    const refresh = useCallback(async () => {
        await Promise.all([fetchChain(), fetchPending(), fetchMyTxs()]);
    }, [fetchChain, fetchPending, fetchMyTxs]);

    useEffect(() => { refresh(); }, [refresh]);

    // Compute stats from real chain
    const realBlocks     = chain.filter(b => b.index > 0); // skip genesis
    const totalTxOnChain = realBlocks.reduce((acc, b) => acc + b.transactions.length, 0);
    const totalValue     = realBlocks.reduce((acc, b) => acc + b.transactions.reduce((s, t) => s + (t.amount || 0), 0), 0);
    const myOnChainTxs   = myTxs.filter(t => t.blockHash);

    const timeAgo = (ts: number) => {
        const diff = Date.now() / 1000 - ts;
        if (diff < 60)   return `${Math.floor(diff)}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return new Date(ts * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div style={{ padding: '2rem', height: 'calc(100vh - 70px)', overflowY: 'auto', background: '#f8fafc' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-2px', color: '#1e293b', lineHeight: 1 }}>
                            Blockchain<br />
                            <span style={{ color: 'var(--accent-orange)' }}>Ledger.</span>
                        </h1>
                        <p style={{ color: '#64748b', fontWeight: 600, fontSize: '1rem', marginTop: '0.75rem' }}>
                            Immutable record of all OrangeChain transactions — mined with Proof of Work.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {chainValid !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '10px', background: chainValid ? '#f0fdf4' : '#fef2f2', border: `1px solid ${chainValid ? '#86efac' : '#fecaca'}`, color: chainValid ? '#16a34a' : '#dc2626', fontWeight: 800, fontSize: '0.8rem' }}>
                                {chainValid ? <ShieldCheck size={15} /> : <AlertCircle size={15} />}
                                {chainValid ? 'Chain Verified' : 'Chain Invalid!'}
                            </div>
                        )}
                        <button onClick={refresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                            {loading ? 'Fetching...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Chain Length',    value: String(chain.length),         icon: Box,          color: '#6366f1' },
                        { label: 'Mined Blocks',    value: String(realBlocks.length),    icon: Link2,        color: '#0ea5e9' },
                        { label: 'Tx On-Chain',     value: String(totalTxOnChain),       icon: CheckCircle2, color: '#10b981' },
                        { label: 'Total Value',     value: totalValue > 0 ? `₹${(totalValue/1000).toFixed(0)}K` : '₹0', icon: Activity, color: 'var(--accent-orange)' },
                    ].map(s => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', background: `${s.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} color={s.color} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '1.4rem', fontWeight: 950, color: '#1e293b', lineHeight: 1 }}>{s.value}</p>
                                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.2rem' }}>{s.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* My on-chain transactions if any */}
                {myOnChainTxs.length > 0 && (
                    <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', borderRadius: '14px', border: '1px solid #86efac', padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ fontWeight: 900, fontSize: '0.95rem', color: '#15803d', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={16} /> My Confirmed On-Chain Transactions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {myOnChainTxs.map((tx: any) => (
                                <div key={tx._id} style={{ background: 'white', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #d1fae5' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <ArrowDownLeft size={18} color="#10b981" />
                                        <div>
                                            <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{tx.produceId?.name || 'Orange Lot'}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Block #{tx.blockIndex} · {tx.blockHash?.substring(0, 18)}...</p>
                                        </div>
                                    </div>
                                    <p style={{ fontWeight: 950, color: '#15803d', fontSize: '1rem' }}>₹{tx.amount?.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', color: '#dc2626' }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>
                            <p style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Blockchain Service Offline</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{error}</p>
                            <p style={{ fontSize: '0.82rem', marginTop: '0.5rem', color: '#ef4444' }}>
                                Start it with: <code style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>cd backend && pip install flask flask-cors && python blockchain.py</code>
                            </p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {([
                        { id: 'chain' as const,   label: `⛓ Blockchain (${chain.length} blocks)` },
                        { id: 'pending' as const, label: `⏳ Pending Pool (${pending.length})` },
                    ]).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                            padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                            border: 'none', cursor: 'pointer',
                            background: activeTab === t.id ? '#1e293b' : 'white',
                            color: activeTab === t.id ? 'white' : '#64748b',
                            outline: activeTab === t.id ? 'none' : '1px solid #e2e8f0',
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── CHAIN VIEW ─────────────────────────────────────────── */}
                {activeTab === 'chain' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {chain.length === 0 && !loading && !error && (
                            <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                                <Box size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                                <p style={{ fontWeight: 700 }}>No blocks yet.</p>
                                <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>Only the genesis block exists. Complete a transaction to mine the first real block.</p>
                            </div>
                        )}
                        <AnimatePresence>
                            {[...chain].reverse().map((block, i) => {
                                const isGenesis = block.index === 0;
                                return (
                                    <motion.div key={block.index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                        style={{ background: 'white', borderRadius: '16px', border: `1px solid ${isGenesis ? '#e2e8f0' : '#c7d2fe'}`, overflow: 'hidden' }}>
                                        {/* Block header */}
                                        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc', background: isGenesis ? '#f8fafc' : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: '36px', height: '36px', background: isGenesis ? '#e2e8f0' : '#6366f1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: isGenesis ? '#94a3b8' : 'white' }}>#{block.index}</span>
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1e293b' }}>
                                                        {isGenesis ? '🌱 Genesis Block' : `Block #${block.index}`}
                                                    </p>
                                                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '0.1rem' }}>
                                                        {block.transactions.length} transaction{block.transactions.length !== 1 ? 's' : ''} · Nonce: {block.nonce} · {timeAgo(block.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                    <CheckCircle2 size={13} color="#10b981" />
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981' }}>VERIFIED</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hash info */}
                                        <div style={{ padding: '0.85rem 1.5rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Block Hash</p>
                                                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', wordBreak: 'break-all' }}>{block.hash.substring(0, 40)}...</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Previous Hash</p>
                                                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace', wordBreak: 'break-all' }}>{block.previous_hash === '0' ? '0 (Genesis)' : block.previous_hash.substring(0, 40) + '...'}</p>
                                            </div>
                                        </div>

                                        {/* Transactions in block */}
                                        {block.transactions.length > 0 && (
                                            <div style={{ padding: '1rem 1.5rem' }}>
                                                <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Transactions</p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                    {block.transactions.map((tx, j) => (
                                                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                                <div style={{ width: '28px', height: '28px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>🍊</div>
                                                                <div>
                                                                    <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>{tx.produceName || 'Orange Lot'}</p>
                                                                    <p style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                                                        Farmer: {tx.farmerName || tx.farmerId?.substring(0, 8)} → Buyer: {tx.buyerName || tx.buyerId?.substring(0, 8)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <p style={{ fontWeight: 900, color: '#1e293b', fontSize: '0.95rem' }}>₹{tx.amount?.toLocaleString()}</p>
                                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: '20px' }}>
                                                                    {tx.escrowStatus}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {isGenesis && block.transactions.length === 0 && (
                                            <div style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                                                Genesis block — no transactions. Complete a delivery to mine Block #1.
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── PENDING VIEW ───────────────────────────────────────── */}
                {activeTab === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pending.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                                <Clock size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                                <p style={{ fontWeight: 700 }}>No pending transactions.</p>
                                <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>When a buyer confirms delivery, a transaction enters the pool here before being mined.</p>
                            </div>
                        ) : pending.map((tx, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                style={{ background: 'white', borderRadius: '14px', border: '1px solid #fde68a', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ width: '36px', height: '36px', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>⏳</div>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{tx.produceName || 'Orange Transaction'}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Awaiting block mining · ID: {tx.transactionId?.substring(0, 16)}...</p>
                                    </div>
                                </div>
                                <p style={{ fontWeight: 950, color: '#f59e0b', fontSize: '1rem' }}>₹{tx.amount?.toLocaleString()}</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallet;
