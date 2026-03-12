import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';

const Notifications = () => {
    const { notifications, loading } = useData();
    const navigate = useNavigate();

    const markAllAsRead = async () => {
        const unreadDocs = notifications.filter(n => !n.read);
        if (unreadDocs.length === 0) return;

        try {
            const batch = writeBatch(db);
            unreadDocs.forEach(n => {
                const ref = doc(db, 'notifications', n.id);
                batch.update(ref, { read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'diary_entry': return 'solar:book-bookmark-bold-duotone';
            case 'anniversary': return 'solar:cup-bold-duotone';
            case 'pairing': return 'solar:heart-bold-duotone';
            case 'like': return 'solar:heart-bold-duotone';
            case 'comment': return 'solar:chat-round-dots-bold-duotone';
            default: return 'solar:bell-bold-duotone';
        }
    };

    return (
        <div className="relative min-h-screen bg-[#f8faff] pb-32 font-sans">
            <header className="flex items-center justify-between p-6 sticky top-0 bg-[#f8faff]/80 backdrop-blur-md z-10 border-b border-blue-50">
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100/50 border border-blue-50"
                >
                  <iconify-icon icon="solar:arrow-left-bold-duotone" width="24" height="24" class="text-slate-400"></iconify-icon>
                </button>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Thông báo</h1>
                <div className="w-12 flex justify-end">
                    {notifications.some(n => !n.read) && (
                        <button onClick={markAllAsRead} className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                            <iconify-icon icon="solar:check-read-bold-duotone" width="24" height="24"></iconify-icon>
                        </button>
                    )}
                </div>
            </header>

            <main className="px-6 mt-8 space-y-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Tin Mới</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Cập nhật từ hai bạn</p>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[3.5rem] p-12 border border-blue-50 shadow-xl shadow-blue-100/20">
                            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-blue-200">
                                <iconify-icon icon="solar:bell-off-bold-duotone" width="56" height="56"></iconify-icon>
                            </div>
                            <p className="text-slate-400 font-bold text-sm tracking-tight">Cửa sổ tâm hồn đang yên tĩnh.<br/>Chưa có thông báo nào mới!</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {notifications.map((notification, index) => (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-6 rounded-[2.5rem] flex items-center gap-6 relative overflow-hidden transition-all border ${!notification.read ? 'bg-white border-blue-100 shadow-xl shadow-blue-100/30 ring-4 ring-blue-50/50' : 'bg-white/50 border-slate-100 opacity-70'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${!notification.read ? 'bg-blue-50 text-primary shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                        <iconify-icon icon={getIcon(notification.type)} width="28" height="28"></iconify-icon>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[15px] leading-snug ${!notification.read ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                            <iconify-icon icon="solar:clock-circle-bold-duotone" width="14" height="14"></iconify-icon>
                                            {notification.created_at ? (notification.created_at.toDate ? notification.created_at.toDate().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date(notification.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })) : '...'}
                                        </p>
                                    </div>

                                    {!notification.read && <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-blue-200 absolute top-7 right-7" />}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </main>

            <Navbar />
        </div>
    );
};

export default Notifications;
