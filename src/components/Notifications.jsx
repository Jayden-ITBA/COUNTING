import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import Navbar from './Navbar';

const Notifications = ({ profile }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.couple_id) {
            const q = query(
                collection(db, 'notifications'),
                where('couple_id', '==', profile.couple_id),
                where('recipient_id', '==', auth.currentUser.uid),
                orderBy('created_at', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const results = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setNotifications(results);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [profile]);

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.read);
        if (unread.length === 0) return;

        const batch = writeBatch(db);
        unread.forEach(n => {
            batch.update(doc(db, 'notifications', n.id), { read: true });
        });
        await batch.commit();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'diary_entry': return 'auto_stories';
            case 'anniversary': return 'celebration';
            case 'pairing': return 'favorite';
            default: return 'notifications';
        }
    };

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Thông báo</h1>
                    <p className="text-slate-500 text-sm">Cập nhật mới nhất của hai bạn</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-blue-500 text-xs font-bold uppercase tracking-wider hover:underline"
                    >
                        Đánh dấu đã đọc
                    </button>
                )}
            </div>

            <div className="px-6 space-y-4">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-20 text-center glass rounded-[3rem] p-12">
                        <span className="material-symbols-outlined text-6xl text-blue-100 mb-4">notifications_off</span>
                        <p className="text-slate-400">Chưa có thông báo nào mới.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {notifications.map((notification, index) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`glass p-5 rounded-3xl flex items-center gap-4 relative overflow-hidden ${!notification.read ? 'bg-white' : 'opacity-70'}`}
                            >
                                {!notification.read && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />}

                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${notification.read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-500'}`}>
                                    <span className="material-symbols-outlined">{getIcon(notification.type)}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-snug ${!notification.read ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                        {notification.created_at?.toDate().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <Navbar />
        </div>
    );
};

export default Notifications;
