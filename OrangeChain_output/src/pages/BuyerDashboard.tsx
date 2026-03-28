import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, MapPin, Star, ShieldCheck, Lock, X,
  CreditCard, CheckCircle2, Truck, Package,
  RefreshCw, ExternalLink, Clock, Smartphone, QrCode
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:5000/api'

const ESCROW_STEPS = [
  { key: 'Pending Deposit', label: 'Pending Deposit', icon: Clock,         color: '#f59e0b' },
  { key: 'Deposited',       label: 'Deposited',       icon: CreditCard,    color: '#0ea5e9' },
  { key: 'In Transit',      label: 'In Transit',      icon: Truck,         color: '#8b5cf6' },
  { key: 'Delivered',       label: 'Delivered',       icon: Package,       color: '#10b981' },
  { key: 'Payment Released', label: 'Released',       icon: CheckCircle2,  color: '#10b981' },
]

interface Lot { id: string; name: string; origin: string; qty: number; grade: string; price: number; trust: number; img: string; farmerId: string; farmerName: string; }
interface MyTx {
  _id: string; amount: number; escrowStatus: string;
  blockHash: string | null; blockIndex: number | null; createdAt: string;
  produceId: { name: string; quantity: number; location: string };
  farmerId: { name: string; trustScore: number };
}

const MOCK_LOTS: Lot[] = [
  { id: '1', name: 'Nagpur Oranges', origin: 'Wardha, MH', qty: 4200, grade: 'A', price: 45000, trust: 98, img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80', farmerId: '', farmerName: 'Ravi Sharma' },
  { id: '2', name: 'Nagpur Oranges', origin: 'Nagpur, MH',  qty: 8500, grade: 'B+', price: 41200, trust: 94, img: 'https://images.unsplash.com/photo-1594481073801-443b7bac78fd?auto=format&fit=crop&w=400&q=80', farmerId: '', farmerName: 'Priya Patel' },
  { id: '3', name: 'Nagpur Oranges', origin: 'Amravati, MH', qty: 2100, grade: 'A+', price: 48500, trust: 99, img: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=400&q=80', farmerId: '', farmerName: 'Suresh Nair' },
]

const BuyerDashboard = () => {
  const { token } = useAuth()
  const [lots, setLots]                     = useState<Lot[]>([])
  const [myTxs, setMyTxs]                   = useState<MyTx[]>([])
  const [selectedLot, setSelectedLot]       = useState<Lot | null>(null)
  const [showEscrow, setShowEscrow]         = useState(false)
  const [activeTab, setActiveTab]           = useState<'market' | 'orders'>('market')
  const [marketTrend, setMarketTrend]       = useState('BULLISH')
  const [buyLoading, setBuyLoading]         = useState(false)
  const [buyMsg, setBuyMsg]                 = useState('')
  const [actionLoading, setActionLoading]   = useState<string | null>(null)
  const [actionMsg, setActionMsg]           = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null)

  // ── UPI Payment state ────────────────────────────────────────────────────
  const [upiData, setUpiData]               = useState<{ upiLink: string; qrCode: string; amount: number; farmerName: string; paymentReference: string; transactionId: string } | null>(null)
  const [showUpiModal, setShowUpiModal]     = useState(false)
  const [upiLoading, setUpiLoading]         = useState(false)
  const [upiConfirmLoading, setUpiConfirmLoading] = useState(false)

  // Always-fresh headers — reads token at call time, no stale closure
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-auth-token': token || ''
  }), [token])

  // ── Fetch available produce ──────────────────────────────────────────────
  const fetchProduce = useCallback(async () => {
    try {
      const res = await fetch(`${API}/buyer/produce`)
      const data = await res.json()
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setLots(data.map((item: any) => ({
          id: item._id,
          name: item.name,
          origin: item.location,
          qty: item.quantity,
          grade: item.aiGrade || 'A',
          price: item.pricePerKg,
          trust: item.farmerId?.trustScore || 95,
          img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80',
          farmerId: item.farmerId?._id || '',
          farmerName: item.farmerId?.name || 'Farmer'
        })))
      } else {
        setLots(MOCK_LOTS)
      }
    } catch { setLots(MOCK_LOTS) }
  }, [])

  // ── Fetch buyer's own transactions ───────────────────────────────────────
  const fetchMyTxs = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/buyer/transactions`, { headers: getHeaders() })
      if (res.ok) setMyTxs(await res.json())
    } catch { /* silent */ }
  }, [token, getHeaders])

  useEffect(() => {
    fetchProduce()
    fetchMyTxs()
    // Market trend animation
    const t = setInterval(() => {
      if (Math.random() > 0.75) setMarketTrend(p => p === 'BULLISH' ? 'BEARISH' : 'BULLISH')
    }, 5000)
    return () => clearInterval(t)
  }, [fetchProduce, fetchMyTxs])

  // ── Buy: create transaction → generate UPI link ──────────────────────────
  const handleBuy = async () => {
    if (!selectedLot || !token) { setBuyMsg('Please log in to purchase.'); return }
    setBuyLoading(true); setBuyMsg('')
    try {
      // Step 1: Create the transaction (escrow)
      const res = await fetch(`${API}/buyer/buy/${selectedLot.id}`, { method: 'POST', headers: getHeaders() })
      const data = await res.json()
      if (!res.ok) { setBuyMsg(data.msg || 'Purchase failed'); return }

      const txId = data.transaction._id

      // Step 2: Generate UPI payment link
      setUpiLoading(true)
      const upiRes = await fetch(`${API}/payment/generate-upi/${txId}`, { method: 'POST', headers: getHeaders() })
      const upiData = await upiRes.json()
      if (!upiRes.ok) { setBuyMsg(upiData.error || 'Failed to generate payment link'); return }

      // Step 3: Show UPI payment modal
      setUpiData({
        upiLink: upiData.upiLink,
        qrCode: upiData.qrCode,
        amount: upiData.amount,
        farmerName: upiData.farmerName,
        paymentReference: upiData.paymentReference,
        transactionId: txId
      })
      setShowEscrow(false)
      setShowUpiModal(true)
      await fetchProduce()
    } catch { setBuyMsg('Server error. Please try again.') }
    finally { setBuyLoading(false); setUpiLoading(false) }
  }

  // ── Confirm UPI payment (buyer clicked "I Have Paid") ────────────────────
  const handleUpiPaid = async () => {
    if (!upiData) return
    setUpiConfirmLoading(true)
    try {
      const res = await fetch(`${API}/payment/confirm/${upiData.transactionId}`, { method: 'POST', headers: getHeaders() })
      const data = await res.json()
      if (res.ok) {
        setShowUpiModal(false)
        setSelectedLot(null)
        setUpiData(null)
        setActiveTab('orders')
        await fetchMyTxs()
        setActionMsg({ id: upiData.transactionId, msg: '✅ Payment confirmed! Funds held in escrow. Waiting for farmer to ship.', type: 'success' })
      } else {
        setActionMsg({ id: upiData.transactionId, msg: data.error || 'Payment confirmation failed', type: 'error' })
      }
    } catch {
      setActionMsg({ id: upiData?.transactionId || '', msg: 'Server error', type: 'error' })
    } finally { setUpiConfirmLoading(false) }
  }

  // ── Confirm delivery → mine block via payment API ────────────────────────
  const confirmDelivery = async (txId: string) => {
    setActionLoading(txId)
    setActionMsg(null)
    try {
      const res = await fetch(`${API}/payment/confirm-delivery/${txId}`, { method: 'POST', headers: getHeaders() })
      const data = await res.json()
      if (res.ok) {
        setActionMsg({
          id: txId,
          msg: `✅ Delivered & mined! Block #${data.block.index} | Hash: ${data.block.hash.substring(0, 20)}...`,
          type: 'success'
        })
        await fetchMyTxs()
      } else {
        setActionMsg({ id: txId, msg: data.error || 'Confirmation failed', type: 'error' })
      }
    } catch { setActionMsg({ id: txId, msg: 'Server error', type: 'error' }) }
    finally { setActionLoading(null) }
  }

  const getStepIndex = (status: string) => ESCROW_STEPS.findIndex(s => s.key === status)

  return (
    <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-1.5px', color: '#1e293b' }}>Procurement Terminal</h1>
            <p style={{ color: '#64748b', fontWeight: 600, marginTop: '0.25rem' }}>Browse produce · Initiate escrow · Track deliveries on-chain</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ padding: '0.5rem 1.25rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>SENTIMENT</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 950, color: marketTrend === 'BULLISH' ? '#10b981' : '#ef4444' }}>{marketTrend}</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {(['market', 'orders'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '0.65rem 1.5rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer',
              border: activeTab === t ? 'none' : '1px solid #e2e8f0',
              background: activeTab === t ? 'var(--accent-orange)' : 'white',
              color: activeTab === t ? 'white' : '#64748b',
            }}>
              {t === 'market' ? '🛒 Market' : `📦 My Orders (${myTxs.length})`}
            </button>
          ))}
          <button onClick={() => { fetchProduce(); fetchMyTxs() }} style={{
            marginLeft: 'auto', padding: '0.65rem 1rem', borderRadius: '10px',
            background: 'white', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem'
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* ── MARKET TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'market' && (
          <>
            {/* Search bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div className="glass" style={{ flex: 1, padding: '0.7rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white' }}>
                <Search size={18} color="#94a3b8" />
                <input type="text" placeholder="Search by location, grade, or lot size..."
                  style={{ background: 'transparent', border: 'none', color: '#1e293b', fontSize: '0.95rem', width: '100%', outline: 'none' }} />
              </div>
              <button className="glass" style={{ padding: '0.7rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', fontWeight: 600 }}>
                <Filter size={16} /> Filters
              </button>
            </div>

            {/* Produce grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {lots.map(lot => (
                <motion.div key={lot.id} whileHover={{ y: -4 }} className="glass"
                  style={{ overflow: 'hidden', padding: 0, cursor: 'pointer', background: 'white' }}
                  onClick={() => setSelectedLot(lot)}>
                  <div style={{ height: '160px', background: `url("${lot.img}") center/cover`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-orange)', border: '1px solid var(--accent-orange)' }}>
                      Grade {lot.grade}
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{lot.name}</h3>
                      <p style={{ fontWeight: 800, color: 'var(--accent-orange)' }}>₹{lot.price.toLocaleString()}/kg</p>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{lot.qty.toLocaleString()} kg available</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8rem', margin: '0.5rem 0 1rem' }}>
                      <MapPin size={13} /> {lot.origin}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{lot.trust}% Trust</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{lot.farmerName}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {lots.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>No produce available right now.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Farmers haven't listed any produce yet.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ORDERS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {myTxs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>No orders yet.</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Browse the market and initiate your first escrow purchase.</p>
              </div>
            ) : myTxs.map(tx => {
              const stepIdx  = getStepIndex(tx.escrowStatus)
              const isOnChain = !!tx.blockHash

              return (
                <motion.div key={tx._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'white', borderRadius: '16px', border: `1px solid ${isOnChain ? '#86efac' : '#e2e8f0'}`, overflow: 'hidden' }}>

                  {/* Blockchain confirmed banner */}
                  {isOnChain && (
                    <div style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <ShieldCheck size={16} color="white" />
                      <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 800 }}>
                        ON-CHAIN — Block #{tx.blockIndex} | {tx.blockHash?.substring(0, 24)}...
                      </span>
                      <ExternalLink size={13} color="rgba(255,255,255,0.7)" style={{ marginLeft: 'auto' }} />
                    </div>
                  )}

                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                          {tx.produceId?.name || 'Orange Lot'} — {tx.produceId?.quantity?.toLocaleString()} kg
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                          From: {tx.farmerId?.name} · {tx.produceId?.location}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.4rem', fontWeight: 950, color: '#1e293b' }}>₹{tx.amount.toLocaleString()}</p>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800,
                          background: isOnChain ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)',
                          color: isOnChain ? '#10b981' : 'var(--accent-orange)',
                          marginTop: '0.25rem'
                        }}>
                          {tx.escrowStatus}
                        </span>
                      </div>
                    </div>

                    {/* Escrow progress bar */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        {ESCROW_STEPS.map((step, i) => {
                          const Icon = step.icon
                          const done = i <= stepIdx
                          return (
                            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', position: 'relative' }}>
                              {i > 0 && (
                                <div style={{
                                  position: 'absolute', left: '-50%', top: '14px', width: '100%', height: '2px',
                                  background: i <= stepIdx ? '#10b981' : '#e2e8f0', zIndex: 0
                                }} />
                              )}
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: done ? step.color : '#f1f5f9',
                                border: `2px solid ${done ? step.color : '#e2e8f0'}`,
                                zIndex: 1, position: 'relative'
                              }}>
                                <Icon size={13} color={done ? 'white' : '#94a3b8'} />
                              </div>
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: done ? '#1e293b' : '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>{step.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Action message */}
                    {actionMsg?.id === tx._id && (
                      <div style={{
                        padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600,
                        background: actionMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: actionMsg.type === 'success' ? '#16a34a' : '#dc2626',
                        border: `1px solid ${actionMsg.type === 'success' ? '#86efac' : '#fecaca'}`
                      }}>
                        {actionMsg.msg}
                      </div>
                    )}

                    {/* Action button — role-aware per status */}
                    {tx.escrowStatus === 'Pending Deposit' && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={async () => {
                            setUpiLoading(true)
                            try {
                              const r = await fetch(`${API}/payment/generate-upi/${tx._id}`, { method: 'POST', headers: getHeaders() })
                              const d = await r.json()
                              if (r.ok) {
                                setUpiData({ upiLink: d.upiLink, qrCode: d.qrCode, amount: d.amount, farmerName: d.farmerName, paymentReference: d.paymentReference, transactionId: tx._id })
                                setShowUpiModal(true)
                              } else {
                                setActionMsg({ id: tx._id, msg: d.error || 'Failed to load payment', type: 'error' })
                              }
                            } catch { setActionMsg({ id: tx._id, msg: 'Server error', type: 'error' }) }
                            finally { setUpiLoading(false) }
                          }}
                          disabled={upiLoading}
                          style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', background: 'var(--accent-orange)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: upiLoading ? 0.6 : 1 }}
                        >
                          {upiLoading ? <RefreshCw size={14} className="spin" /> : <QrCode size={14} />}
                          Pay via UPI
                        </button>
                      </div>
                    )}

                    {tx.escrowStatus === 'Deposited' && (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', fontSize: '0.82rem', fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Truck size={14} /> Payment confirmed — waiting for farmer to ship the order.
                      </div>
                    )}

                    {tx.escrowStatus === 'In Transit' && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => confirmDelivery(tx._id)}
                          disabled={actionLoading === tx._id}
                          style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: actionLoading === tx._id ? 0.6 : 1 }}
                        >
                          {actionLoading === tx._id ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={14} />}
                          ✅ Confirm Delivery & Release Payment
                        </button>
                      </div>
                    )}

                    {tx.escrowStatus === 'Payment Released' && tx.blockHash && (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.82rem', fontWeight: 600, color: '#16a34a' }}>
                        🎉 Complete! Payment released & immutably recorded on OrangeChain.
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Lot Detail Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLot && !showEscrow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass"
              style={{ width: '100%', maxWidth: '780px', background: 'white', position: 'relative', overflow: 'hidden' }}>
              <button onClick={() => setSelectedLot(null)} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ height: '400px', background: `url("${selectedLot.img}") center/cover` }} />
                <div style={{ padding: '2.5rem' }}>
                  <span style={{ color: 'var(--accent-orange)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Available Lot</span>
                  <h2 style={{ fontSize: '1.75rem', marginTop: '0.5rem', marginBottom: '0.5rem', fontWeight: 900 }}>{selectedLot.name}</h2>
                  <p style={{ color: '#64748b', fontWeight: 600, marginBottom: '1.5rem' }}>{selectedLot.qty.toLocaleString()} kg · {selectedLot.origin}</p>
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div><p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>Grade</p><p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedLot.grade}</p></div>
                    <div><p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>Price</p><p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-orange)' }}>₹{selectedLot.price.toLocaleString()}/kg</p></div>
                    <div><p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>Total</p><p style={{ fontSize: '1.2rem', fontWeight: 800 }}>₹{(selectedLot.price * selectedLot.qty).toLocaleString()}</p></div>
                  </div>
                  <div className="glass" style={{ padding: '1rem', background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.2)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <ShieldCheck color="#10b981" />
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>OrangeChain Verified</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Quality graded · Farmer: {selectedLot.farmerName} ({selectedLot.trust}% trust)</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowEscrow(true)} style={{
                    width: '100%', background: 'var(--accent-orange)', color: 'white', padding: '1.1rem',
                    borderRadius: '12px', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                  }}>
                    <Lock size={18} /> Initiate Secure Escrow
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Escrow Confirmation Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showEscrow && selectedLot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass"
              style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', background: 'white' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1.5rem', textAlign: 'center' }}>Confirm Escrow Deposit</h2>
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  ['Produce', selectedLot.name],
                  ['Quantity', `${selectedLot.qty.toLocaleString()} kg`],
                  ['Price per kg', `₹${selectedLot.price.toLocaleString()}`],
                  ['Total Amount', `₹${(selectedLot.price * selectedLot.qty).toLocaleString()}`],
                  ['Farmer', selectedLot.farmerName],
                  ['Origin', selectedLot.origin],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{v}</span>
                  </div>
                ))}
                <div style={{ height: '1px', background: '#f1f5f9', margin: '0.25rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800 }}>Locked in Escrow</span>
                  <span style={{ fontWeight: 950, color: 'var(--accent-orange)', fontSize: '1.1rem' }}>₹{(selectedLot.price * selectedLot.qty).toLocaleString()}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Funds are locked until delivery is confirmed. Upon confirmation, a block is mined to the OrangeChain and payment is released automatically.
              </p>
              {buyMsg && (
                <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
                  {buyMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setShowEscrow(false); setBuyMsg('') }}
                  style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, background: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleBuy} disabled={buyLoading}
                  style={{ flex: 2, background: 'var(--accent-orange)', color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: buyLoading ? 0.7 : 1 }}>
                  <CreditCard size={17} /> {buyLoading ? 'Processing...' : 'Confirm & Lock Funds'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── UPI Payment Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUpiModal && upiData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass"
              style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '20px', overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <QrCode size={24} color="white" />
                </div>
                <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>UPI Payment</h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  Scan QR or tap to open your UPI app
                </p>
              </div>

              <div style={{ padding: '1.75rem' }}>
                {/* Amount */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Amount to Pay</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: 950, color: '#1e293b', lineHeight: 1.1 }}>₹{upiData.amount.toLocaleString()}</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>To: {upiData.farmerName}</p>
                </div>

                {/* QR Code */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '12px', border: '2px solid #f1f5f9', borderRadius: '16px', background: 'white' }}>
                    <img src={upiData.qrCode} alt="UPI QR Code" width={200} height={200}
                      style={{ display: 'block', borderRadius: '8px' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                </div>

                {/* Ref */}
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.6rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Ref #</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', letterSpacing: '0.5px' }}>{upiData.paymentReference}</span>
                </div>

                {/* Open UPI App deep link */}
                <a href={upiData.upiLink}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', width: '100%', padding: '0.9rem', borderRadius: '12px', background: 'rgba(249,115,22,0.08)', border: '1.5px solid rgba(249,115,22,0.3)', color: 'var(--accent-orange)', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none', marginBottom: '0.75rem', boxSizing: 'border-box' }}>
                  <Smartphone size={16} /> Open UPI App (PhonePe / GPay / Paytm)
                </a>

                <p style={{ fontSize: '0.73rem', color: '#94a3b8', textAlign: 'center', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Complete payment in your UPI app, then tap below to confirm.
                </p>

                {/* CTA buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => { setShowUpiModal(false); setUpiData(null); fetchMyTxs() }}
                    style={{ flex: 1, padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                    Cancel
                  </button>
                  <button onClick={handleUpiPaid} disabled={upiConfirmLoading}
                    style={{ flex: 2, background: '#10b981', color: 'white', padding: '0.9rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: upiConfirmLoading ? 0.7 : 1, fontSize: '0.9rem' }}>
                    {upiConfirmLoading ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={16} />}
                    {upiConfirmLoading ? 'Confirming...' : '✅ I Have Paid'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BuyerDashboard
