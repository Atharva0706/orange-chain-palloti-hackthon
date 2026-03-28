import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Zap, Activity, AlertTriangle, Cpu, BarChart, Repeat, Link2, RefreshCw } from 'lucide-react'

const API = 'http://localhost:5000/api'

interface ChainTx {
    transactionId: string; amount: number; escrowStatus: string;
    produceName?: string; farmerName?: string; buyerName?: string; timestamp: string;
}
interface ChainBlock { index: number; timestamp: number; hash: string; transactions: ChainTx[]; }

const MissionControl = () => {
    const [stressIndex, setStressIndex]   = useState(24)
    const [isSimulating, setIsSimulating] = useState(false)
    const [chain, setChain]               = useState<ChainBlock[]>([])
    const [chainLen, setChainLen]         = useState(0)
    const [loadingChain, setLoadingChain] = useState(false)

    // Pull latest blockchain data for the live ticker
    const fetchChain = useCallback(async () => {
        setLoadingChain(true)
        try {
            const res  = await fetch(`${API}/blockchain/chain`)
            const data = await res.json()
            if (res.ok) {
                setChain(data.chain || [])
                setChainLen(data.length || 0)
            }
        } catch { /* blockchain service may not be running */ }
        finally { setLoadingChain(false) }
    }, [])

    useEffect(() => {
        fetchChain()
        const iv = setInterval(fetchChain, 15000) // refresh every 15s
        return () => clearInterval(iv)
    }, [fetchChain])

    const simulateOversupply = async () => {
        setIsSimulating(true)
        window.dispatchEvent(new CustomEvent('oc-notification', { detail: 'CRITICAL: Oversupply Event Detected. Rerouting trucks...' }))
        try { await fetch(`${API}/simulation/trigger`, { method: 'POST' }) } catch { }
        let iv = setInterval(() => {
            setStressIndex(prev => {
                if (prev >= 85) { clearInterval(iv); setIsSimulating(false); return 85 }
                return prev + 2
            })
        }, 50)
    }

    // Flatten real blockchain txs into a ticker feed
    const tickerItems: Array<{ id: string; type: string; value: string; time: string; hash: string }> = []
    ;[...chain].reverse().forEach(block => {
        if (block.index === 0) return // skip genesis
        block.transactions.forEach(tx => {
            tickerItems.push({
                id:    block.hash.substring(0, 8),
                type:  tx.escrowStatus === 'Payment Released' ? 'Payment Released' : tx.escrowStatus,
                value: tx.amount ? `₹${Number(tx.amount).toLocaleString()}` : '—',
                time:  new Date(block.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                hash:  block.hash.substring(0, 10) + '...',
            })
        })
    })

    // Fallback mock items when chain is empty
    const mockItems = [
        { id: '0x4f...a1', type: 'Escrow Created',   value: '₹45,200', time: 'demo', hash: '0x4f...a1' },
        { id: '0xe2...9b', type: 'Payment Released', value: '₹38,100', time: 'demo', hash: '0xe2...9b' },
        { id: '0x1c...5c', type: 'In Transit',       value: '₹21,500', time: 'demo', hash: '0x1c...5c' },
    ]
    const displayItems = tickerItems.length > 0 ? tickerItems : mockItems

    return (
        <div style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Cpu color="var(--accent-orange)" /> Mission Control
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Real-time blockchain network overview and market stabilization.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={fetchChain} disabled={loadingChain} className="glass" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <RefreshCw size={14} style={loadingChain ? { animation: 'spin 1s linear infinite' } : {}} /> Sync Chain
                    </button>
                    <button onClick={() => setStressIndex(24)} className="glass" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <Repeat size={16} /> Reset
                    </button>
                    <button onClick={simulateOversupply} disabled={isSimulating} className="glow-pulse" style={{ background: stressIndex > 60 ? '#ef4444' : 'var(--accent-orange)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isSimulating ? 0.6 : 1, cursor: isSimulating ? 'not-allowed' : 'pointer' }}>
                        <AlertTriangle size={16} /> {isSimulating ? 'Rerouting...' : 'Simulate Oversupply'}
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Map area */}
                    <div className="glass" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', gap: '10px' }}>
                            <div className="glass" style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} className="glow-pulse" />
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>142 ACTIVE TRUCKS</span>
                            </div>
                            <div className="glass" style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Link2 size={13} color="var(--accent-orange)" />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-orange)' }}>CHAIN: {chainLen} BLOCKS</span>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, #e2e8f0 0%, #f1f5f9 100%)', opacity: 0.5 }} />
                        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                            <path d="M100,200 L400,100 L700,300 M200,400 L500,250" fill="none" stroke="rgba(249,115,22,0.15)" strokeWidth="2" />
                            <TruckIcon x={200} y={150} delay={0} />
                            <TruckIcon x={450} y={220} delay={1} />
                            <TruckIcon x={600} y={180} delay={2} />
                            <TruckIcon x={150} y={350} delay={0.5} />
                        </svg>
                        <div style={{ position: 'absolute', top: '30%', left: '40%', width: '150px', height: '150px', background: 'var(--accent-orange)', borderRadius: '50%', filter: 'blur(60px)', opacity: stressIndex / 100 * 0.4 }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div className="glass" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={15} /> Network TPS</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>84.5</span>
                                <span style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '5px' }}>TPS</span>
                            </div>
                        </div>
                        <div className="glass" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={15} /> Settlement</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>12.4s avg</span>
                            </div>
                        </div>
                        <div className="glass" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Link2 size={15} /> Chain Status</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} className="glow-pulse" />
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>LIVE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Market Stress Index</h3>
                        <div style={{ height: '10px', width: '100%', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                            <motion.div animate={{ width: `${stressIndex}%` }} style={{ height: '100%', background: stressIndex > 70 ? '#ef4444' : (stressIndex > 40 ? '#f59e0b' : '#10b981'), boxShadow: '0 0 10px rgba(0,0,0,0.3)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stressIndex}%</span>
                            <span style={{ color: stressIndex > 70 ? '#ef4444' : '#10b981', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                {stressIndex > 70 ? 'CRITICAL' : 'OPERATIONAL'}
                            </span>
                        </div>
                    </div>

                    <div className="glass" style={{ flex: 1, padding: '1.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BarChart size={16} />
                            {tickerItems.length > 0 ? 'Live Blockchain Ticker' : 'Blockchain Ticker (demo)'}
                        </h3>
                        {tickerItems.length === 0 && (
                            <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.75rem' }}>
                                No mined blocks yet. Demo data shown below.
                            </p>
                        )}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {displayItems.slice(0, 8).map((tx, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-orange)' }}>{tx.type}</p>
                                        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{tx.hash}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{tx.value}</p>
                                        <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{tx.time}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const TruckIcon = ({ x, y, delay }: any) => (
    <motion.g
        initial={{ x, y, opacity: 0 }}
        animate={{ x: [x, x + 100, x], y: [y, y - 50, y], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 10, repeat: Infinity, delay, ease: 'linear' }}>
        <rect width="12" height="6" fill="var(--accent-orange)" rx="1" />
        <circle cx="2" cy="7" r="1.5" fill="#94a3b8" />
        <circle cx="10" cy="7" r="1.5" fill="#94a3b8" />
    </motion.g>
)

export default MissionControl
