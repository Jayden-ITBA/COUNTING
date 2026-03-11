import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { getDashboardLabel } from '../utils/ui_helpers';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Widgets = ({ profile }) => {
    const navigate = useNavigate();
    const [daysTogether, setDaysTogether] = useState(0);
    const [anniversaryStr, setAnniversaryStr] = useState('');
    const [nextMilestone, setNextMilestone] = useState({});
    const [latestEntry, setLatestEntry] = useState(null);

    const calculateDays = (anniversaryDate) => {
        if (!anniversaryDate) return;
        const anniversary = anniversaryDate.toDate ? anniversaryDate.toDate() : new Date(anniversaryDate);
        const now = new Date();
        const diff = Math.floor(Math.abs(now - anniversary) / (1000 * 60 * 60 * 24));
        setDaysTogether(diff);
        setAnniversaryStr(anniversary.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

        const targets = [100, 200, 300, 365, 500, 1000];
        const next = targets.find(t => {
            const tDate = new Date(anniversary);
            tDate.setDate(anniversary.getDate() + t);
            return tDate > now;
        });
        if (next) {
            const nDate = new Date(anniversary);
            nDate.setDate(anniversary.getDate() + next);
            setNextMilestone({
                title: next === 365 ? "1 Year" : `Mốc ${next} Ngày`,
                date: nDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }
    };

    useEffect(() => {
        if (profile?.couple_id) {
            const unsubscribeCouple = onSnapshot(doc(db, 'couples', profile.couple_id), (docSnap) => {
                if (docSnap.exists()) {
                    calculateDays(docSnap.data().anniversary_date);
                }
            });

            const q = query(
                collection(db, 'diaries'),
                where('couple_id', '==', profile.couple_id),
                orderBy('created_at', 'desc'),
                limit(1)
            );

            const unsubscribeDiary = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    setLatestEntry(snapshot.docs[0].data());
                }
            });

            return () => {
                unsubscribeCouple();
                unsubscribeDiary();
            };
        }
    }, [profile]);

    return (
        <div className="relative min-h-screen bg-[#f0f7ff] pb-32">
            <header className="flex items-center bg-transparent p-4 justify-between sticky top-0 z-10 backdrop-blur-md">
                <button 
                    onClick={() => navigate('/settings/background')}
                    className="text-blue-400 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-blue-100 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Kiểu Widget</h2>
                <div className="w-10"></div>
            </header>

            <main className="max-w-lg mx-auto px-4 pb-12 space-y-10 pt-4">
                {/* Small Widget */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-200"></span>
                        <h3 className="text-slate-800 text-sm font-bold">Widget Nhỏ (1x1)</h3>
                    </div>
                    <div className="flex justify-center">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="size-36 bg-white rounded-[2.5rem] shadow-xl shadow-blue-100 flex flex-col items-center justify-center p-6 border border-blue-50"
                        >
                            <span className="material-symbols-outlined text-blue-400 text-3xl fill-1 mb-1">favorite</span>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{daysTogether}</h2>
                            <p className="text-[10px] text-blue-400/60 font-bold uppercase tracking-widest mt-1">Ngày</p>
                        </motion.div>
                    </div>
                </section>

                {/* Medium Widget */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-200"></span>
                        <h3 className="text-slate-800 text-sm font-bold">Widget Vừa (2x1)</h3>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="w-full h-36 bg-white rounded-[2.5rem] shadow-xl shadow-blue-100 p-6 flex items-center justify-between border border-blue-50"
                    >
                        <div className="flex -space-x-4">
                            <div className="size-16 rounded-full border-4 border-white bg-blue-50 shadow-md overflow-hidden flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-200 text-3xl">person</span>
                            </div>
                            <div className="size-16 rounded-full border-4 border-white bg-blue-100 shadow-md overflow-hidden flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-400 text-3xl">favorite</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
                                {daysTogether} <span className="text-sm text-blue-400 font-bold tracking-normal uppercase ml-1">Ngày</span>
                            </h2>
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">
                                {getDashboardLabel(profile)}
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* Large Widget */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-200"></span>
                        <h3 className="text-slate-800 text-sm font-bold">Widget Lớn (2x2)</h3>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="w-full aspect-square bg-white rounded-[3.5rem] shadow-xl shadow-blue-100 p-8 flex flex-col border border-blue-50 relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-5xl font-black text-slate-800 tracking-tighter leading-none">
                                    {daysTogether} <span className="text-base text-blue-400 font-bold tracking-normal uppercase ml-1">Ngày</span>
                                </h2>
                                <p className="text-[10px] text-blue-400/60 font-extrabold uppercase tracking-widest mt-2 px-1">Từ {anniversaryStr}</p>
                            </div>
                            <span className="material-symbols-outlined text-blue-300 text-4xl animate-pulse">sparkles</span>
                        </div>

                        <div className="flex-1 space-y-4">
                            {nextMilestone.title && (
                                <div className="bg-blue-50/40 p-5 rounded-3xl flex items-center gap-4 border border-blue-100/50">
                                    <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-400">
                                        <span className="material-symbols-outlined">celebration</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest block opacity-70">Mục tiêu tiếp theo</span>
                                        <span className="text-sm font-bold text-slate-700">{nextMilestone.title} ({nextMilestone.date})</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50/50 p-5 rounded-3xl flex items-center gap-4 border border-slate-100/50">
                                <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300">
                                    <span className="material-symbols-outlined">history_edu</span>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block opacity-70">Kỷ niệm gần nhất</span>
                                    <span className="text-sm font-bold text-slate-600 line-clamp-1 italic">
                                        "{latestEntry?.content || "Chưa có kỷ niệm..."}"
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
                            <span className="text-[10px] text-blue-400 font-black tracking-[0.2em] uppercase opacity-60">✨ Mãi mãi bên nhau ✨</span>
                        </div>
                    </motion.div>
                </section>
                
                <button 
                    onClick={() => navigate('/settings/background')}
                    className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                >
                    Xác nhận chọn
                </button>
            </main>

            <Navbar profile={profile} />
        </div>
    );
};

export default Widgets;
