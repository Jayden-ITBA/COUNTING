import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getDashboardLabel } from '../utils/ui_helpers';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';

const Widgets = () => {
    const { profile, couple } = useData();
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
        setAnniversaryStr(anniversary.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }));

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
                title: next === 365 ? "1 Năm" : `Mốc ${next} Ngày`,
                date: nDate.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
            });
        }
    };

    useEffect(() => {
        if (couple?.anniversary_date) {
            calculateDays(couple.anniversary_date);
        }
    }, [couple]);

    useEffect(() => {
        if (profile?.couple_id) {
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

            return () => unsubscribeDiary();
        }
    }, [profile]);

    return (
        <div className="relative min-h-screen bg-[#f8faff] pb-32 font-sans">
            <header className="flex items-center justify-between p-6 sticky top-0 bg-[#f8faff]/80 backdrop-blur-md z-10 border-b border-blue-50">
                <button 
                  onClick={() => navigate('/settings/background')}
                  className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100/50 border border-blue-50"
                >
                  <iconify-icon icon="solar:arrow-left-bold-duotone" width="24" height="24" class="text-slate-400"></iconify-icon>
                </button>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Kiểu Widget</h1>
                <div className="w-12" />
            </header>

            <main className="max-w-lg mx-auto px-6 pb-12 space-y-12 pt-8">
                {/* Small Widget */}
                <section className="space-y-5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-6 rounded-full bg-primary shadow-sm shadow-blue-200"></div>
                        <h3 className="text-slate-800 text-sm font-black uppercase tracking-widest">Widget Nhỏ (1x1)</h3>
                    </div>
                    <div className="flex justify-center">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-44 h-44 bg-white rounded-[3.5rem] shadow-2xl shadow-blue-100/30 flex flex-col items-center justify-center p-8 border border-blue-50"
                        >
                            <iconify-icon icon="solar:heart-bold-duotone" class="text-primary mb-3" width="44" height="44"></iconify-icon>
                            <h2 className="text-5xl font-light text-slate-800 tracking-tighter tabular-nums leading-none">{daysTogether}</h2>
                            <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-3">Ngày</p>
                        </motion.div>
                    </div>
                </section>

                {/* Medium Widget */}
                <section className="space-y-5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-6 rounded-full bg-primary shadow-sm shadow-blue-200"></div>
                        <h3 className="text-slate-800 text-sm font-black uppercase tracking-widest">Widget Vừa (2x1)</h3>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="w-full h-44 bg-white rounded-[3.5rem] shadow-2xl shadow-blue-100/30 p-10 flex items-center justify-between border border-blue-50"
                    >
                        <div className="flex -space-x-6">
                            <div className="w-22 h-22 rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                                <iconify-icon icon="solar:user-bold-duotone" width="44" height="44" class="text-slate-200"></iconify-icon>
                            </div>
                            <div className="w-22 h-22 rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden bg-blue-50 flex items-center justify-center">
                                <iconify-icon icon="solar:heart-bold-duotone" width="44" height="44" class="text-primary"></iconify-icon>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-6xl font-light text-slate-800 tracking-tighter tabular-nums leading-none">
                                {daysTogether} <span className="text-base text-primary font-black tracking-normal uppercase ml-1">Ngày</span>
                            </h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3">
                                {getDashboardLabel(profile)}
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* Large Widget */}
                <section className="space-y-5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-6 rounded-full bg-primary shadow-sm shadow-blue-200"></div>
                        <h3 className="text-slate-800 text-sm font-black uppercase tracking-widest">Widget Lớn (2x2)</h3>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="w-full aspect-square bg-white rounded-[4rem] shadow-2xl shadow-blue-100/30 p-12 flex flex-col border border-blue-50 relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-7xl font-light text-slate-800 tracking-tighter tabular-nums leading-none">
                                    {daysTogether} <span className="text-xl text-primary font-black tracking-normal uppercase ml-1">Ngày</span>
                                </h2>
                                <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] mt-4 px-1 flex items-center gap-2">
                                    <iconify-icon icon="solar:calendar-date-bold-duotone" width="16" height="16" class="text-primary/40"></iconify-icon>
                                    Từ {anniversaryStr}
                                </p>
                            </div>
                            <iconify-icon icon="solar:stars-minimalistic-bold-duotone" width="56" height="56" class="text-blue-200 animate-pulse"></iconify-icon>
                        </div>

                        <div className="flex-1 space-y-6">
                            {nextMilestone.title && (
                                <div className="bg-blue-50/50 p-8 rounded-[2.5rem] flex items-center gap-6 border border-blue-50">
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                                        <iconify-icon icon="solar:cup-bold-duotone" width="36" height="36"></iconify-icon>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest block mb-1">Mục tiêu tiếp theo</span>
                                        <span className="text-base font-black text-slate-700">{nextMilestone.title} ({nextMilestone.date})</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50/50 p-8 rounded-[2.5rem] flex items-center gap-6 border border-slate-100">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300">
                                    <iconify-icon icon="solar:pen-new-square-bold-duotone" width="36" height="36"></iconify-icon>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kỷ niệm gần nhất</span>
                                    <span className="text-[13px] font-bold text-slate-500 line-clamp-1 italic">
                                        "{latestEntry?.content || "Chưa có kỷ niệm..."}"
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-slate-50 flex justify-center">
                            <span className="text-[10px] text-slate-200 font-black tracking-[0.6em] uppercase">MÃI MÃI BÊN NHAU</span>
                        </div>
                    </motion.div>
                </section>
                
                <div className="pt-10">
                    <button 
                        onClick={() => navigate('/settings/background')}
                        className="w-full bg-primary text-white font-black py-6 rounded-full shadow-2xl shadow-blue-200 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-[11px]"
                    >
                        Xác nhận thiết kế
                    </button>
                </div>
            </main>

            <Navbar />
        </div>
    );
};

export default Widgets;
