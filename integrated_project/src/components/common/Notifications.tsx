import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'warning' | 'info';
}

const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        // Mock listeners for simulation
        const handleSim = (e: any) => {
            const newNotif = {
                id: Math.random().toString(),
                message: e.detail || 'New system update',
                type: 'warning' as const
            };
            setNotifications(prev => [newNotif, ...prev]);
            setTimeout(() => removeNotif(newNotif.id), 5000);
        };

        window.addEventListener('oc-notification', handleSim as EventListener);
        return () => window.removeEventListener('oc-notification', handleSim as EventListener);
    }, []);

    const removeNotif = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <AnimatePresence>
                {notifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="glass"
                        style={{
                            padding: '1rem',
                            minWidth: '280px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            borderLeft: `4px solid ${notif.type === 'success' ? '#10b981' : (notif.type === 'warning' ? 'var(--accent-orange)' : '#3b82f6')}`,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}
                    >
                        {notif.type === 'success' && <CheckCircle size={18} color="#10b981" />}
                        {notif.type === 'warning' && <AlertCircle size={18} color="var(--accent-orange)" />}
                        {notif.type === 'info' && <Info size={18} color="#3b82f6" />}
                        
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{notif.message}</p>
                        </div>

                        <button onClick={() => removeNotif(notif.id)} style={{ color: 'var(--text-secondary)' }}>
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Notifications;
