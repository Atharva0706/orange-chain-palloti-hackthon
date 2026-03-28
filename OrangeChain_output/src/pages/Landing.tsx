import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, ShieldCheck, Map as MapIcon, Layers, Globe, CheckCircle2, Truck, Play } from 'lucide-react'

interface LandingProps {
    onLaunch: () => void;
}

const Landing = ({ onLaunch }: LandingProps) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{ background: 'white', minHeight: '100vh', color: 'var(--text-primary)' }}>
            {/* Top Navbar */}
            <nav style={{
                padding: isScrolled ? '1rem 6rem' : '2rem 6rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                backdropFilter: isScrolled ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: isScrolled ? 'blur(20px)' : 'none',
                borderBottom: isScrolled ? '1px solid rgba(0,0,0,0.05)' : 'none',
                position: 'fixed',
                top: isScrolled ? 0 : '1rem',
                left: isScrolled ? 0 : '2rem',
                right: isScrolled ? 0 : '2rem',
                borderRadius: isScrolled ? '0' : '24px',
                zIndex: 1000,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isScrolled ? '0 10px 30px rgba(0, 0, 0, 0.08)' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'var(--accent-orange)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(249, 115, 22, 0.3)'
                    }}>
                        <Layers size={22} color="white" />
                    </div>
                    <span style={{ 
                        fontSize: '1.6rem', 
                        fontWeight: 900, 
                        color: isScrolled ? '#1e293b' : 'white',
                        transition: 'color 0.3s'
                    }}>
                        Orange<span style={{ color: 'var(--accent-orange)' }}>Chain</span>
                    </span>
                </div>
                
                <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                    <NavLink label="Home" active isScrolled={isScrolled} />
                    <NavLink label="Dashboard" isScrolled={isScrolled} onClick={onLaunch} />
                    <NavLink label="Market Insights" isScrolled={isScrolled} onClick={onLaunch} />
                    <NavLink label="Transport" isScrolled={isScrolled} onClick={onLaunch} />
                    <NavLink label="Blockchain" isScrolled={isScrolled} onClick={onLaunch} />
                    <NavLink label="About" isScrolled={isScrolled} />
                    <button 
                        onClick={onLaunch}
                        style={{
                            background: 'var(--accent-orange)',
                            color: 'white',
                            padding: '0.8rem 2rem',
                            borderRadius: '50px',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.7rem',
                            border: 'none',
                            boxShadow: '0 10px 20px rgba(249, 115, 22, 0.4)',
                            transition: 'all 0.3s'
                        }}
                    >
                        Live Market <Globe size={18} />
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                minHeight: '100vh',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: '0 6rem',
                overflow: 'hidden',
                background: '#f8fafc'
            }}>
                {/* Background Image with Overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url("/background_hero.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                }} />
                
                {/* Optimized Gradient Overlay for Readability */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
                    zIndex: 1
                }} />

                <div style={{ 
                    maxWidth: '1400px', 
                    margin: '0 auto', 
                    width: '100%',
                    display: 'grid', 
                    gridTemplateColumns: '1.2fr 0.8fr', 
                    gap: '4rem', 
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{
                            padding: '3rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(15px)',
                            WebkitBackdropFilter: 'blur(15px)',
                            borderRadius: '40px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            background: 'rgba(249, 115, 22, 0.2)',
                            backdropFilter: 'blur(10px)',
                            padding: '0.6rem 1.4rem',
                            borderRadius: '50px',
                            border: '1px solid rgba(249, 115, 22, 0.3)',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            marginBottom: '2rem'
                        }}>
                             <div style={{ width: '8px', height: '8px', background: 'var(--accent-orange)', borderRadius: '50%' }} className="glow-pulse" />
                             Nation-Wide Agri-Protocol
                        </div>

                        <h1 style={{
                            fontSize: '6rem',
                            fontWeight: 950,
                            lineHeight: 1,
                            marginBottom: '2rem',
                            letterSpacing: '-4px',
                            color: 'white',
                            textShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}>
                            Harvesting <br />
                            <span style={{ 
                                color: 'var(--accent-orange)',
                                background: 'linear-gradient(to right, #f97316, #fb923c)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 0 30px rgba(249, 115, 22, 0.4))'
                            }}>Intelligence.</span> <br />
                            Securing Wealth.
                        </h1>
                        
                        <p style={{
                            fontSize: '1.5rem',
                            color: 'rgba(255,255,255,0.9)',
                            maxWidth: '650px',
                            marginBottom: '3.5rem',
                            lineHeight: 1.5,
                            fontWeight: 500,
                            borderLeft: '4px solid var(--accent-orange)',
                            paddingLeft: '2rem'
                        }}>
                            Empowering Indian orange farmers with AI-driven market stabilization and blockchain-verified instant settlements.
                        </p>

                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <button
                                onClick={onLaunch}
                                style={{
                                    background: 'var(--accent-orange)',
                                    color: 'white',
                                    padding: '1.4rem 3.5rem',
                                    borderRadius: '20px',
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    border: 'none',
                                    boxShadow: '0 20px 40px -10px rgba(249, 115, 22, 0.6)',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                            >
                                Launch Platform <ArrowRight size={24} />
                            </button>
                            <button
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    color: 'white',
                                    padding: '1.4rem 3rem',
                                    borderRadius: '20px',
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <Play size={22} fill="white" /> Watch Demo
                            </button>
                        </div>
                    </motion.div>

                    <div style={{ position: 'relative' }}>
                        {/* Main Visual Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ delay: 0.3, duration: 1.2 }}
                            style={{
                                width: '100%',
                                height: '600px',
                                backgroundImage: 'url("/orange_card.png")',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '50px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.6)',
                                position: 'relative',
                                perspective: '1000px'
                            }}
                        >
                             <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', borderRadius: '50px' }} />
                        </motion.div>
                        
                        {/* Floating Stats Card */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: 'absolute',
                                top: '5%',
                                right: '-40px',
                                padding: '2rem',
                                width: '280px',
                                background: 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(30px)',
                                borderRadius: '30px',
                                border: '1px solid white',
                                boxShadow: '0 30px 60px -12px rgba(0,0,0,0.15)',
                                zIndex: 5
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#64748b', letterSpacing: '1px' }}>LIVE PRICE</span>
                                <div style={{ background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900 }}>+15.2%</div>
                            </div>
                            <p style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '0.5rem', color: '#1e293b' }}>₹5,240</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nagpur Export Grade</p>
                        </motion.div>

                        {/* Floating Logistics Map Card */}
                        <motion.div
                            animate={{ y: [0, 20, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            style={{
                                position: 'absolute',
                                bottom: '5%',
                                left: '-50px',
                                padding: '2rem',
                                width: '320px',
                                background: 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(30px)',
                                borderRadius: '30px',
                                border: '1px solid white',
                                boxShadow: '0 30px 60px -12px rgba(0,0,0,0.15)',
                                zIndex: 5
                            }}
                        >
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ width: '50px', height: '50px', background: 'rgba(249, 115, 22, 0.15)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Truck size={24} color="var(--accent-orange)" />
                                </div>
                                <div>
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>Smart Fleet</span>
                                    <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800 }}>84% UTILIZATION</p>
                                </div>
                            </div>
                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '84%' }}
                                    transition={{ duration: 2, delay: 1 }}
                                    style={{ height: '100%', background: 'var(--accent-orange)', borderRadius: '10px' }} 
                                />
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Amravati → Dubai</span>
                                <span style={{ color: 'var(--accent-orange)' }}>Transit</span>
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid Section */}
            <section style={{ padding: '10rem 6rem', background: '#ffffff' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
                        <div style={{ 
                            display: 'inline-flex', 
                            padding: '0.5rem 1.5rem', 
                            background: 'rgba(249, 115, 22, 0.1)', 
                            color: 'var(--accent-orange)', 
                            borderRadius: '50px', 
                            fontWeight: 800, 
                            fontSize: '0.85rem',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            marginBottom: '2rem'
                        }}>Ecosystem Capabilities</div>
                        <h2 style={{ fontSize: '4.5rem', fontWeight: 950, marginBottom: '2rem', letterSpacing: '-3px', color: '#1e293b', lineHeight: 1.1 }}>Unified Market Protocol</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>Our autonomous system manages the entire lifecycle of produce, from farm gate to international terminal with military-grade precision.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3rem' }}>
                        <FeatureCard 
                            icon={<BarChart3 size={28} />} 
                            title="AI Mandi Predict" 
                            desc="Proprietary neural networks analyze supply patterns to prevent price crashes before they impact farmers." 
                        />
                        <FeatureCard 
                            icon={<ShieldCheck size={28} />} 
                            title="Atomic Settlements" 
                            desc="Zero-wait payments via multi-sig smart contracts. Funds are locked at harvest and released at delivery." 
                        />
                        <FeatureCard 
                            icon={<MapIcon size={28} />} 
                            title="Global Logistics" 
                            desc="Real-time multi-modal routing engine that redirects shipments to scarcity zones for maximum ROI." 
                        />
                        <FeatureCard 
                            icon={<CheckCircle2 size={28} />} 
                            title="Computer Vision" 
                            desc="Hyperspectral grading sensors ensure every orange is valued based on its actual sugar and juice content." 
                        />
                    </div>
                </div>
            </section>

            {/* Mandi Monitor Section */}
            <section style={{ padding: '10rem 6rem', background: '#f8fafc', position: 'relative' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8rem', alignItems: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ color: 'var(--accent-orange)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Network Intelligence</div>
                        <h2 style={{ fontSize: '4rem', fontWeight: 950, margin: '1rem 0 2.5rem', letterSpacing: '-2px', color: '#1e293b', lineHeight: 1.1 }}>Global Market Monitor</h2>
                        <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '3rem', fontWeight: 500 }}>
                            A bird's eye view of the entire citrus economy. Our grid monitors demand spikes in Europe while simultaneously managing local mandi surpluses.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <CheckItem text="Real-time Price Indexing & Automated Arbitrage" />
                            <CheckItem text="Cold-Chain Verified Logistics Tracking" />
                            <CheckItem text="Frictionless Export Documentation on Blockchain" />
                        </div>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        style={{ 
                            background: 'white', 
                            padding: '3.5rem', 
                            borderRadius: '48px', 
                            boxShadow: '0 40px 100px -20px rgba(15, 23, 42, 0.1)',
                            border: '1px solid #eef2f6',
                            position: 'relative'
                        }}
                    >
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b' }}>LIVE CLUSTER FEED</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Syncing with 12,402 nodes</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px 20px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 900 }}>
                                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} className="glow-pulse" />
                                CONNECTED
                            </div>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { m: 'Nagpur Export Hub', p: '₹5,240', t: '+4.2%', s: 'Peak Demand', c: '#10b981' },
                                { m: 'Amravati Cluster', p: '₹4,100', t: '-1.2%', s: 'Managed Buffer', c: '#64748b' },
                                { m: 'Pune Logistics', p: '₹4,850', t: '+2.8%', s: 'Fast Moving', c: '#10b981' },
                                { m: 'International Dock', p: '₹6,900', t: '+8.4%', s: 'Export High', c: '#10b981' },
                            ].map((row, i) => (
                                <div key={i} style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1.8fr 1fr 1fr 1.2fr',
                                    padding: '1.5rem 0.5rem', 
                                    borderBottom: i === 3 ? 'none' : '1px solid #f1f5f9',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    borderRadius: '12px'
                                }}
                                className="nav-item-hover"
                                >
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#334155' }}>{row.m}</span>
                                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1e293b' }}>{row.p}</span>
                                    <span style={{ color: row.t.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 900, fontSize: '1rem' }}>{row.t}</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ 
                                            fontSize: '0.8rem', 
                                            background: i === 0 || i === 3 ? 'rgba(16, 185, 129, 0.1)' : '#f8fafc', 
                                            padding: '6px 14px', 
                                            borderRadius: '8px', 
                                            color: i === 0 || i === 3 ? '#10b981' : '#64748b',
                                            fontWeight: 800,
                                            border: i === 0 || i === 3 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #e2e8f0'
                                        }}>{row.s}</span>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '8rem 6rem', background: '#1e293b', color: 'white' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                            <div style={{ width: '45px', height: '45px', background: 'var(--accent-orange)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Layers size={24} color="white" />
                            </div>
                            <span style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-1.5px' }}>OrangeChain</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: '1.1rem', maxWidth: '400px', fontWeight: 500 }}>
                            The world's first autonomous market stabilization protocol for high-yield citrus production. Powered by AI, secured by Ethereum.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '2.5rem', fontWeight: 900, fontSize: '1.2rem', color: 'white' }}>Products</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', fontWeight: 600 }}>
                            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Farmer OS</li>
                            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Buyer Terminal</li>
                            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Grid Map</li>
                            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Fleet Engine</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '2.5rem', fontWeight: 900, fontSize: '1.2rem', color: 'white' }}>Company</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', fontWeight: 600 }}>
                            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Whitepaper</li>
                            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Smart Contracts</li>
                            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Regulatory Compliance</li>
                            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Media Kit</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '2.5rem', fontWeight: 900, fontSize: '1.2rem', color: 'white' }}>Support</h4>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>tech@orangechain.org</p>
                        <p style={{ color: 'var(--accent-orange)', fontSize: '1.05rem', fontWeight: 900, marginTop: '2rem' }}>GOVT. APPROVED SYSTEM</p>
                    </div>
                </div>
                <div style={{ maxWidth: '1400px', margin: '6rem auto 0', paddingTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
                    <p>© 2026 OrangeChain Protocol Foundation. National Agri-Stabilization Authority.</p>
                    <div style={{ display: 'flex', gap: '3rem', fontWeight: 600 }}>
                        <span>Legal Notice</span>
                        <span>Privacy Vault</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

const NavLink = ({ label, active = false, isScrolled = false, onClick }: { label: string, active?: boolean, isScrolled?: boolean, onClick?: () => void }) => (
    <button onClick={onClick} style={{ 
        textDecoration: 'none', 
        color: active ? 'var(--accent-orange)' : (isScrolled ? '#475569' : 'rgba(255,255,255,0.9)'), 
        fontWeight: 800, 
        fontSize: '1rem',
        borderBottom: active ? '2px solid var(--accent-orange)' : '2px solid transparent',
        paddingBottom: '4px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s',
        letterSpacing: '0.5px'
    }}>
        {label}
    </button>
)

const CheckItem = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ width: '28px', height: '28px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 color="#10b981" size={18} />
        </div>
        <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b' }}>{text}</span>
    </div>
)

const FeatureCard = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div 
        style={{ 
            padding: '3rem', 
            background: 'white', 
            borderRadius: '35px', 
            border: '1px solid #f1f5f9',
            boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        className="glass-hover"
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = '0 30px 60px rgba(249, 115, 22, 0.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.03)';
        }}
    >
        <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'rgba(249, 115, 22, 0.08)', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '2.5rem', 
            color: 'var(--accent-orange)' 
        }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '1.25rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>{title}</h3>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 500 }}>{desc}</p>
    </div>
)

export default Landing
