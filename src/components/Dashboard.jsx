import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ profile }) => {
    const navigate = useNavigate();
    const [coupleData, setCoupleData] = useState(null);
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [daysTogether, setDaysTogether] = useState(0);

    useEffect(() => {
        if (profile?.couple_id) {
            const unsubscribe = onSnapshot(doc(db, 'couples', profile.couple_id), async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCoupleData(data);

                    // Calculate days
                    const anniversary = data.anniversary_date.toDate();
                    const diffTime = Math.abs(new Date() - anniversary);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    setDaysTogether(diffDays);

                    // Fetch partner profile
                    const pId = data.uids.find(id => id !== profile.uid);
                    if (pId) {
                        const pSnap = await getDoc(doc(db, 'profiles', pId));
                        if (pSnap.exists()) setPartnerProfile(pSnap.data());
                    }
                }
            });
            return () => unsubscribe();
        }
    }, [profile]);

    return (
        <div className="relative min-h-screen flex flex-col bg-blur-romantic overflow-hidden">
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
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden glass">
                            <img src={profile?.avatar_url || "/api/placeholder/100/100"} alt="You" />
                        </div>
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

                <button className="glass w-10 h-10 flex items-center justify-center rounded-full">
                    <span className="material-symbols-outlined">notifications</span>
                </button>
            </div>

            {/* Main Counter */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 z-20">
                {profile?.link_status === 'paired' ? (
                    <div className="text-center">
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-600 font-medium tracking-widest uppercase text-sm mb-2"
                        >
                            We have been together for
                        </motion.p>

                        <h1 className="text-7xl md:text-8xl font-extrabold text-slate-800 tracking-tighter drop-shadow-sm">
                            {daysTogether} <span className="text-blue-500 font-display">Days</span>
                        </h1>

                        <p className="mt-4 text-slate-500 font-medium bg-blue-100/50 px-6 py-2 rounded-full inline-block backdrop-blur-sm">
                            Since {coupleData?.anniversary_date.toDate().toLocaleDateString('vi-VN')}
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
                        <div className="glass p-6 rounded-3xl flex flex-col items-center">
                            <span className="material-symbols-outlined text-blue-500 mb-2">calendar_month</span>
                            <span className="text-xs uppercase font-bold text-slate-400">Months</span>
                            <span className="text-2xl font-bold">{Math.floor(daysTogether / 30)}</span>
                        </div>
                        <div className="glass p-6 rounded-3xl flex flex-col items-center">
                            <span className="material-symbols-outlined text-blue-500 mb-2">sparkles</span>
                            <span className="text-xs uppercase font-bold text-slate-400">Weeks</span>
                            <span className="text-2xl font-bold">{Math.floor(daysTogether / 7)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Next Milestone Card */}
            {profile?.link_status === 'paired' && (
                <div className="px-6 pb-24 z-20">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="glass p-5 rounded-3xl flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500">celebration</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-slate-800">Next Milestone</h4>
                            <p className="text-xs text-slate-500">
                                {(Math.floor(daysTogether / 100) + 1) * 100} Days in {((Math.floor(daysTogether / 100) + 1) * 100) - daysTogether} days
                            </p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </motion.div>
                </div>
            )}

            <nav className="fixed bottom-6 left-6 right-6 glass rounded-full px-6 py-4 z-50 flex items-center justify-between">
                <span onClick={() => navigate('/')} className="material-symbols-outlined text-blue-500 fill-1 cursor-pointer">home</span>
                <span onClick={() => navigate('/anniversary')} className="material-symbols-outlined text-slate-400 cursor-pointer">calendar_month</span>
                <span onClick={() => navigate('/diary')} className="material-symbols-outlined text-slate-400 cursor-pointer">auto_stories</span>
                <span onClick={() => navigate('/album')} className="material-symbols-outlined text-slate-400 cursor-pointer">photo_library</span>
                <span onClick={() => navigate('/settings')} className="material-symbols-outlined text-slate-400 cursor-pointer">settings</span>
            </nav>
        </div>
    );
};

export default Dashboard;
