import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, 
    Truck, 
    Star, 
    ShieldCheck, 
    ArrowRight,
    Globe,
    Route,
    Activity
} from 'lucide-react';

const transportCenters = [
    { id: 1, name: 'Mumbai Logistics Terminal', lat: 19.0760, lng: 72.8777, available: 45, rating: 4.8, contact: '022-22661234', address: 'JNPT Road, Navi Mumbai', type: 'Refrigerated & Heavy' },
    { id: 2, name: 'Nagpur Central Hub', lat: 21.1458, lng: 79.0882, available: 30, rating: 4.7, contact: '0712-2521234', address: 'APMC Market, Nagpur', type: 'Fruit Specialist' },
    { id: 3, name: 'Delhi Supply Depot', lat: 28.6139, lng: 77.2090, available: 52, rating: 4.9, contact: '011-23345678', address: 'Azadpur Mandi, Delhi', type: 'Mixed Fleet' },
    { id: 4, name: 'Bangalore Tech Logistics', lat: 12.9716, lng: 77.5946, available: 25, rating: 4.6, contact: '080-22234567', address: 'Yeshwanthpur Market, Bangalore', type: 'Quick Service' },
    { id: 5, name: 'Ahmadabad Industrial Haulage', lat: 23.0225, lng: 72.5714, available: 18, rating: 4.5, contact: '079-26567890', address: 'Sarkhej, Ahmedabad', type: 'Heavy Duty' },
];

const containerStyle = { width: '100%', height: '100%' };
const center = { lat: 21.1458, lng: 79.0882 }; // Centered at Nagpur

const TransportBooking = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "" // VITE_GOOGLE_MAPS_API_KEY
    });

    const [source, setSource] = useState<any>(transportCenters[1]); // Default to Nagpur
    const [destination, setDestination] = useState<any>(null);
    const [response, setResponse] = useState<any>(null);
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [truckStatus, setTruckStatus] = useState('Idle');
    const [activeTrucks, setActiveTrucks] = useState(42);

    // Simulation for active trucks
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTrucks(prev => Math.max(10, prev + (Math.random() > 0.5 ? 1 : -1)));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const directionsCallback = (res: any) => {
        if (res !== null && res.status === 'OK') {
            setResponse(res);
            setDistance(res.routes[0].legs[0].distance.text);
            setDuration(res.routes[0].legs[0].duration.text);
            setTruckStatus('Routing Calculated');
        }
    };

    const handleSelectDest = (point: any) => {
        setDestination(point);
    };

    const handleCurrentLocation = () => {
        // Mock current location to Nagpur for demo
        setSource({ id: 0, name: 'Current Location (Nagpur)', lat: 21.1458, lng: 79.0882 });
    };

    return (
        <div style={{ padding: '2rem', height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '2rem', overflow: 'hidden', background: '#f8fafc' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '1.25rem', letterSpacing: '-2px', color: '#1e293b' }}>
                        <div style={{ padding: '12px', background: 'var(--accent-orange)', borderRadius: '16px', boxShadow: '0 10px 20px rgba(249, 115, 22, 0.3)' }}>
                            <Truck size={32} color="white" />
                        </div>
                        Autonomous Logistics Hub
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.4rem', fontSize: '1.1rem' }}>Smart routing and automated fleet dispatch for perishable supply chains.</p>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <button 
                        onClick={handleCurrentLocation}
                        style={{ 
                            padding: '0.8rem 1.5rem', 
                            background: 'white', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '12px', 
                            fontWeight: 800, 
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                        }}
                    >
                        <MapPin size={18} color="var(--accent-orange)" /> My Location
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '2.5rem', flex: 1, minHeight: 0 }}>
                {/* Map Viewport */}
                <div style={{ position: 'relative', background: '#fff', borderRadius: '40px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 30px 60px rgba(0,0,0,0.06)' }}>
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={center}
                            zoom={5}
                            options={{
                                styles: [
                                    { "featureType": "water", "stylers": [{ "color": "#e9eff5" }] },
                                    { "featureType": "landscape", "stylers": [{ "color": "#f8fafc" }] },
                                    { "featureType": "road", "stylers": [{ "visibility": "simplified" }, { "color": "#ffffff" }] }
                                ],
                                disableDefaultUI: true,
                                zoomControl: true
                            }}
                        >
                            {transportCenters.map(point => (
                                <Marker
                                    key={point.id}
                                    position={{ lat: point.lat, lng: point.lng }}
                                    onClick={() => handleSelectDest(point)}
                                    icon={{
                                        path: 'M20,8h-3V4H3C1.3,4,0,5.3,0,7v11h2c0,1.7,1.3,3,3,3s3-1.3,3-3h6c0,1.7,1.3,3,3,3s3-1.3,3-3h2v-5L20,8z M5,19c-0.6,0-1-0.4-1-1 s0.4-1,1-1s1,0.4,1,1S5.6,19,5,19z M17,19c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S17.6,19,17,19z M19,13h-4V9h2.1l1.9,3V13z',
                                        fillColor: 'var(--accent-orange)',
                                        fillOpacity: 1,
                                        strokeWeight: 0,
                                        scale: 1.5,
                                        anchor: new window.google.maps.Point(12, 12)
                                    }}
                                />
                            ))}

                            {source && destination && (
                                <DirectionsService
                                    options={{
                                        destination: { lat: destination.lat, lng: destination.lng },
                                        origin: { lat: source.lat, lng: source.lng },
                                        travelMode: window.google.maps.TravelMode.DRIVING
                                    }}
                                    callback={directionsCallback}
                                />
                            )}

                            {response !== null && (
                                <DirectionsRenderer
                                    options={{ 
                                        directions: response,
                                        polylineOptions: {
                                            strokeColor: 'var(--accent-orange)',
                                            strokeWeight: 6,
                                            strokeOpacity: 0.8
                                        }
                                    }}
                                />
                            )}
                        </GoogleMap>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                            <Globe className="glow-pulse" size={64} color="var(--accent-orange)" />
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 950, fontSize: '1.5rem', color: '#1e293b' }}>Initializing Fleet Matrix...</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>Syncing with real-time GPS telemetry.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Intelligence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', padding: '4px' }}>
                    <div className="glass" style={{ padding: '2.5rem', background: '#fff', borderRadius: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#1e293b' }}>
                            <Route size={22} color="var(--accent-orange)" /> Route Diagnostics
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #edf2f7' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 900, color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fleet Origin</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }} />
                                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#334155' }}>{source?.name || 'Locating nearest hub...'}</span>
                                </div>
                            </div>

                            <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', border: destination ? '2px solid var(--accent-orange)' : '1px solid #edf2f7', transition: 'all 0.3s' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 900, color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Destination Node</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: '10px', height: '10px', background: destination ? 'var(--accent-orange)' : '#e2e8f0', borderRadius: '50%' }} />
                                    <span style={{ fontWeight: 800, fontSize: '1rem', color: destination ? '#1e293b' : '#94a3b8' }}>
                                        {destination?.name || 'Awaiting Selection...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {destination && (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}
                            >
                                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(249, 115, 22, 0.08)', borderRadius: '24px', border: '1px solid rgba(249, 115, 22, 0.1)' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent-orange)', letterSpacing: '1px' }}>DISTANCE</p>
                                    <p style={{ fontSize: '1.6rem', fontWeight: 950, color: '#1e293b' }}>{distance || '--'}</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(14, 165, 233, 0.08)', borderRadius: '24px', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0ea5e9', letterSpacing: '1px' }}>ETA</p>
                                    <p style={{ fontSize: '1.6rem', fontWeight: 950, color: '#1e293b' }}>{duration || '--'}</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {destination ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="glass"
                                style={{ padding: '2rem', background: '#fff', flex: 1 }}
                            >
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.5rem' }}>Hub Intelligence</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontWeight: 600 }}>Fleet Available:</span>
                                        <span style={{ fontWeight: 800, color: '#10b981' }}>{destination.available} Trucks</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontWeight: 600 }}>Trust Score:</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontWeight: 800 }}>{destination.rating}</span>
                                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontWeight: 600 }}>Type:</span>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{destination.type}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2.5rem', background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', gap: '0.75rem' }}>
                                    <ShieldCheck size={18} color="#10b981" />
                                    <p style={{ fontSize: '0.8rem', color: '#064e3b', fontWeight: 600 }}>Smart Escrow protection enabled for this route.</p>
                                </div>

                                <button style={{
                                    width: '100%',
                                    marginTop: '2rem',
                                    padding: '1.25rem',
                                    background: 'var(--accent-orange)',
                                    color: 'white',
                                    borderRadius: '16px',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    boxShadow: '0 15px 30px -10px rgba(249, 115, 22, 0.5)'
                                }}>
                                    Initiate Fleet Booking <ArrowRight size={20} />
                                </button>
                            </motion.div>
                        ) : (
                            <div className="glass" style={{ flex: 1, padding: '3rem', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    <MapPin size={32} color="#cbd5e1" />
                                </div>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Destination Selection</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>Please select a target mandi or terminal on the map to calculate logistics parameters and available fleet.</p>
                            </div>
                        )}
                    </AnimatePresence>
                    <div className="glass" style={{ padding: '2.5rem', background: '#fff', borderRadius: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#1e293b' }}>
                            <Activity size={22} color="var(--accent-orange)" /> Fleet Intelligence
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #edf2f7', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>ACTIVE UNITS</p>
                                <p style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--accent-orange)' }}>{activeTrucks}</p>
                            </div>
                            <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #edf2f7', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>HUB STATE</p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 950, color: '#10b981', marginTop: '0.8rem' }}>NOMINAL</p>
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem', background: '#1e293b', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                <ShieldCheck size={18} color="var(--accent-orange)" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Protocol Status</p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>{truckStatus.toUpperCase()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransportBooking;
