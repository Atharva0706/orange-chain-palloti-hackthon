import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Navigation, 
    ArrowUpRight,
    Search as SearchIcon,
    Globe,
    Zap,
    TrendingUp,
    BarChart,
    Layers,
    Activity,
    MapPin,
    ArrowDownRight
} from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };
const center = { lat: 21.1458, lng: 79.0882 };

// Augmented Mandi Data
const initialMarketPoints = [
    { id: 1, name: 'Nagpur APMC', lat: 21.1458, lng: 79.0882, status: 'Stable', basePrice: 4850, demand: 82, supply: 65 },
    { id: 2, name: 'Mumbai Vashi', lat: 19.0760, lng: 72.8777, status: 'High Demand', basePrice: 5400, demand: 95, supply: 40 },
    { id: 3, name: 'Azadpur Delhi', lat: 28.6139, lng: 77.2090, status: 'Oversupply', basePrice: 3820, demand: 45, supply: 98 },
    { id: 4, name: 'Bangalore Binny', lat: 12.9716, lng: 77.5946, status: 'Stable', basePrice: 4900, demand: 75, supply: 70 },
    { id: 5, name: 'Pune Gultekdi', lat: 18.5204, lng: 73.8567, status: 'Scarcity', basePrice: 5600, demand: 92, supply: 25 },
    { id: 6, name: 'Ahmedabad APMC', lat: 23.0225, lng: 72.5714, status: 'Stable', basePrice: 4100, demand: 60, supply: 55 }
];

const TransportMap = () => {
    // We will use a public testing key or a placeholder that looks production-ready
    // For the demo, we ensure the UI is premium even if the map is in 'development' mode
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "" // In a real app, this would be process.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const [marketPoints, setMarketPoints] = useState(initialMarketPoints);
    const [selectedMandi, setSelectedMandi] = useState<any>(null);
    const [stressIndex, setStressIndex] = useState(84.4);
    const [activeAlerts, setActiveAlerts] = useState(12);

    // High-Frequency Real-time Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setMarketPoints(prev => prev.map(p => {
                const priceChange = (Math.random() * 40 - 20);
                const newPrice = Math.max(3000, p.basePrice + priceChange);
                const demandChange = (Math.random() * 6 - 3);
                const supplyChange = (Math.random() * 6 - 3);
                
                return {
                    ...p,
                    basePrice: newPrice,
                    demand: Math.min(100, Math.max(10, p.demand + demandChange)),
                    supply: Math.min(100, Math.max(10, p.supply + supplyChange)),
                    status: newPrice > 5000 ? 'High ROI' : (newPrice < 4000 ? 'Price Alert' : 'Stable')
                };
            }));
            setStressIndex(prev => Math.min(100, Math.max(60, prev + (Math.random() * 4 - 2))));
            if (Math.random() > 0.8) setActiveAlerts(prev => Math.max(0, prev + (Math.random() > 0.5 ? 1 : -1)));
        }, 2000); // 2s updates for realistic feel
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: '2rem', height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '2rem', overflow: 'hidden', background: '#f8fafc' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '1.25rem', letterSpacing: '-2px', color: '#1e293b' }}>
                        <div style={{ padding: '12px', background: 'var(--accent-orange)', borderRadius: '16px', boxShadow: '0 10px 20px rgba(249, 115, 22, 0.3)' }}>
                            <Globe size={32} color="white" />
                        </div>
                        Global Market Intelligence
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.4rem', fontSize: '1.1rem' }}>Spatial node-map of real-time demand, supply, and price vectors.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', padding: '0.5rem 1.5rem', background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.2rem' }}>NETWORK STRESS</p>
                        <p style={{ fontSize: '1.6rem', fontWeight: 950, color: stressIndex > 90 ? '#ef4444' : '#10b981' }}>{stressIndex.toFixed(1)}%</p>
                    </div>
                    <div style={{ textAlign: 'right', padding: '0.5rem 1.5rem', background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.2rem' }}>ACTIVE INTERVENTIONS</p>
                        <p style={{ fontSize: '1.6rem', fontWeight: 950, color: 'var(--accent-orange)' }}>{activeAlerts}</p>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '2.5rem', flex: 1, minHeight: 0 }}>
                {/* Visual Google Map Viewport */}
                <div style={{ position: 'relative', borderRadius: '40px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 30px 60px rgba(0,0,0,0.06)' }}>
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={center}
                            zoom={5}
                            options={{
                                styles: [
                                    { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#1e293b" }] },
                                    { "featureType": "water", "stylers": [{ "color": "#e9eff5" }] },
                                    { "featureType": "landscape", "stylers": [{ "color": "#f8fafc" }] },
                                    { "featureType": "road", "stylers": [{ "visibility": "simplified" }, { "color": "#ffffff" }] }
                                ],
                                disableDefaultUI: true,
                                zoomControl: true,
                                scrollwheel: true
                            }}
                        >
                            {marketPoints.map(p => (
                                <Marker 
                                    key={p.id} 
                                    position={{ lat: p.lat, lng: p.lng }}
                                    onClick={() => setSelectedMandi(p)}
                                    title={p.name}
                                    icon={{
                                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                                        fillColor: p.demand > p.supply ? '#ef4444' : '#10b981',
                                        fillOpacity: 1,
                                        strokeWeight: 2,
                                        strokeColor: '#ffffff',
                                        scale: 1.8,
                                        anchor: new window.google.maps.Point(12, 22)
                                    }}
                                />
                            ))}

                            {selectedMandi && (
                                <InfoWindow
                                    position={{ lat: selectedMandi.lat, lng: selectedMandi.lng }}
                                    onCloseClick={() => setSelectedMandi(null)}
                                >
                                    <div style={{ padding: '12px', minWidth: '220px' }}>
                                        <h4 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '12px', color: '#1e293b' }}>{selectedMandi.name}</h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Spot Price:</span>
                                            <span style={{ fontWeight: 900, color: '#1e293b' }}>₹{selectedMandi.basePrice.toFixed(0)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Demand Score:</span>
                                            <span style={{ fontWeight: 800, color: '#ef4444' }}>{selectedMandi.demand.toFixed(0)}%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Supply Score:</span>
                                            <span style={{ fontWeight: 800, color: '#10b981' }}>{selectedMandi.supply.toFixed(0)}%</span>
                                        </div>
                                        <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-orange)', border: '1px solid #e2e8f0' }}>
                                            {selectedMandi.status.toUpperCase()}
                                        </div>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <Activity className="glow-pulse" size={56} color="var(--accent-orange)" />
                            <p style={{ marginTop: '1.5rem', fontWeight: 800, fontSize: '1.2rem', color: '#475569' }}>Connecting to Agri-Sensing Grid...</p>
                        </div>
                    )}

                    <div style={{ position: 'absolute', bottom: '40px', left: '40px', zIndex: 10 }}>
                        <div className="glass" style={{ padding: '1.5rem 2.5rem', background: 'rgba(255,255,255,0.98)', border: '1px solid white', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                                <Layers size={18} color="var(--accent-orange)" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#64748b', letterSpacing: '1px' }}>GRID NODES</span>
                            </div>
                            <p style={{ fontSize: '1.8rem', fontWeight: 950, color: '#1e293b' }}>14,208 Mandis</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Intelligence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', padding: '4px' }}>
                    <div className="glass" style={{ padding: '2rem', background: 'white' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Zap size={18} color="var(--accent-orange)" /> Efficiency Metrics
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <MetricBar label="MANDI THROUGHPUT" value={84} color="#10b981" delta="+12.4%" />
                            <MetricBar label="LOGISTICS VELOCITY" value={62} color="var(--accent-orange)" delta="Peak" />
                            <MetricBar label="QUALITY SCORE" value={91} color="#0ea5e9" delta="A-Grade" />
                        </div>
                    </div>

                    <div className="glass" style={{ flex: 1, padding: '2rem', background: 'white' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                             <TrendingUp size={18} color="#0ea5e9" /> Live Price Matrix
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {marketPoints.map(m => (
                                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 80px 80px', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #f1f5f9', padding: '1rem 0' }}>
                                    <div>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                                        <p style={{ fontSize: '0.7rem', color: m.demand > m.supply ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                                            {m.demand > m.supply ? 'High Demand' : 'Oversupply'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>D: {m.demand.toFixed(0)}</p>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>S: {m.supply.toFixed(0)}</p>
                                    </div>
                                    <p style={{ fontWeight: 900, textAlign: 'right', fontSize: '1rem' }}>₹{m.basePrice.toFixed(0)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button style={{
                        width: '100%',
                        padding: '1.25rem',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        transition: 'all 0.2s'
                    }} className="glass-hover">
                        Download Analytical Report <ArrowUpRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const MetricBar = ({ label, value, color, delta }: any) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>{label}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color }}>{delta}</span>
        </div>
        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                style={{ height: '100%', background: color, borderRadius: '4px' }} 
            />
        </div>
    </div>
);

export default TransportMap;
