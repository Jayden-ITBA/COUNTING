import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, onSnapshot, getDoc, collection, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Dashboard = ({ profile }) => {
    const navigate = useNavigate();
    const [coupleData, setCoupleData] = useState(null);
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [daysTogether, setDaysTogether] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    const calculateDays = (anniversaryDate) => {
        if (!anniversaryDate) return;
        const anniversary = anniversaryDate.toDate ? anniversaryDate.toDate() : new Date(anniversaryDate);
        const diffTime = Math.abs(new Date() - anniversary);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setDaysTogether(diffDays);
    };

    useEffect(() => {
        if (profile?.couple_id) {
            const unsubscribeCouple = onSnapshot(doc(db, 'couples', profile.couple_id), async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCoupleData(data);
                    calculateDays(data.anniversary_date);

                    const pId = data.uids.find(id => id !== auth.currentUser.uid);
                    if (pId) {
                        const partnerSnap = await getDoc(doc(db, 'profiles', pId));
                        if (partnerSnap.exists()) setPartnerProfile(partnerSnap.data());
                    }
                }
            });

            const q = query(
                collection(db, 'notifications'),
                where('couple_id', '==', profile.couple_id),
                where('recipient_id', '==', auth.currentUser.uid),
                where('read', '==', false)
            );

            const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
                setUnreadCount(snapshot.size);
            });

            return () => {
                unsubscribeCouple();
                unsubscribeNotifs();
            };
        }
    }, [profile]);

    return (
        <div className="relative min-h-screen flex flex-col bg-background-light overflow-hidden">
            {/* Background Image / Blur from settings */}
            <div
                className="fixed inset-0 bg-cover bg-center -z-10"
                style={{
                    backgroundImage: `url(${coupleData?.background_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=2000'})`,
                    filter: `blur(${coupleData?.blur_level || 0}px) brightness(0.9)`
                }}
            />

            {/* Floating Twinkle Icons */}
            <motion.div
                className="fixed top-10 left-10 pointer-events-none"
                animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
                <span className="material-symbols-outlined text-4xl text-blue-400 opacity-50">star</span>
            </motion.div>

            {/* Header section with Avatars */}
            <div className="flex items-center justify-between px-6 pt-12 pb-6 z-20">
                <button
                    onClick={() => navigate('/settings')}
                    className="glass w-10 h-10 flex items-center justify-center rounded-full"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden glass">
                        <img src={profile?.avatar_url || "/api/placeholder/100/100"} alt="You" />
                    </div>

                    <div className="flex flex-col items-center">
                        <motion.span
                            animate={{ scale: profile?.link_status === 'paired' ? [1, 1.2, 1] : 1 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`${profile?.link_status === 'paired' ? 'text-blue-500' : 'text-slate-300'} material-symbols-outlined text-3xl fill-1`}
                        >
                            favorite
                        </motion.span>
                    </div>

                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden glass">
                        <img src={partnerProfile?.avatar_url || "/api/placeholder/100/100"} alt="Partner" />
                    </div>
                </div>

                <button
                    onClick={() => navigate('/notifications')}
                    className="glass w-10 h-10 flex items-center justify-center rounded-full relative"
                >
                    <span className="material-symbols-outlined">notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Main Counter */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 z-20">
                {profile?.link_status === 'paired' ? (
                    <div className="text-center">
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-100 font-medium tracking-widest uppercase text-[10px] mb-2 drop-shadow-lg"
                        >
                            We have been together for
                        </motion.p>

                        <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter drop-shadow-2xl">
                            {daysTogether}
                        </h1>
                        <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-sm mt-1">Days Together</p>

                        <p className="mt-8 text-white font-bold bg-white/20 px-6 py-2 rounded-full inline-block backdrop-blur-md border border-white/30 text-xs">
                            Since {coupleData?.anniversary_date ? new Date(coupleData.anniversary_date).toLocaleDateString('vi-VN') : '...'}
                        </p>
                    </div>
                ) : (
                    <div className="text-center glass p-8 rounded-[3rem] border border-white/50">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Chưa có kết nối</h2>
                        <p className="text-sm text-slate-500 mb-6">Hãy kết nối với nửa kia để bắt đầu đếm ngày nhé!</p>
                        <button
                            onClick={() => navigate('/settings/pairing')}
                            className="bg-blue-500 text-white font-bold px-8 py-4 rounded-full shadow-lg"
                        >
                            Kết nối ngay
                        </button>
                    </div>
                )}

                {/* Info Cards */}
                {profile?.link_status === 'paired' && (
                    <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md">
                        <div className="glass p-6 rounded-3xl flex flex-col items-center backdrop-blur-xl border-white/20">
                            <span className="material-symbols-outlined text-blue-500 mb-2">calendar_month</span>
                            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Months</span>
                            <span className="text-2xl font-bold text-slate-800">{Math.floor(daysTogether / 30)}</span>
                        </div>
                        <div className="glass p-6 rounded-3xl flex flex-col items-center backdrop-blur-xl border-white/20">
                            <span className="material-symbols-outlined text-blue-500 mb-2">sparkles</span>
                            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Weeks</span>
                            <span className="text-2xl font-bold text-slate-800">{Math.floor(daysTogether / 7)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Next Milestone Card */}
            {profile?.link_status === 'paired' && (
                <div className="px-6 pb-32 z-20">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        onClick={() => navigate('/anniversary')}
                        className="glass p-5 rounded-[2.5rem] flex items-center gap-4 backdrop-blur-xl border-white/20 cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="material-symbols-outlined">celebration</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Next Milestone</h4>
                            <p className="text-xs text-slate-500 font-medium">
                                {(Math.floor(daysTogether / 100) + 1) * 100} Days in {((Math.floor(daysTogether / 100) + 1) * 100) - daysTogether} days
                            </p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </motion.div>
                </div>
            )}

            <Navbar profile={profile} />
        </div>
    );
};

export default Dashboard;
