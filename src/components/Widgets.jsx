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
        <div className="relative min-h-screen bg-neutral-50 pb-32">
            <header className="flex items-center bg-neutral-50/80 p-4 justify-between sticky top-0 z-10 backdrop-blur-md border-b border-neutral-100">
                <button 
                    onClick={() => navigate('/settings/background')}
                    className="text-neutral-400 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
                >
                    <iconify-icon icon="solar:arrow-left-bold" width="24" height="24"></iconify-icon>
                </button>
                <h2 className="text-neutral-800 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Kiểu Widget</h2>
                <div className="w-10"></div>
            </header>

            <main className="max-w-lg mx-auto px-6 pb-12 space-y-12 pt-8">
                {/* Small Widget */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-6 rounded-full bg-rose-400 shadow-sm shadow-rose-200"></div>
                        <h3 className="text-neutral-800 text-sm font-black uppercase tracking-widest">Widget Nhỏ (1x1)</h3>
                    </div>
                    <div className="flex justify-center">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-40 h-40 bg-white rounded-[3rem] shadow-xl shadow-neutral-200/50 flex flex-col items-center justify-center p-6 border border-neutral-100"
                        >
                            <iconify-icon icon="solar:heart-bold" class="text-rose-500 mb-2" width="36" height="36"></iconify-icon>
                            <h2 className="text-4xl font-black text-neutral-800 tracking-tighter leading-none">{daysTogether}</h2>
                            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em] mt-2">Ngày</p>
                        </motion.div>
                    </div>
                </section>

                {/* Medium Widget */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-6 rounded-full bg-blue-400 shadow-sm shadow-blue-200"></div>
                        <h3 className="text-neutral-800 text-sm font-black uppercase tracking-widest">Widget Vừa (2x1)</h3>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="w-full h-40 bg-white rounded-[3rem] shadow-xl shadow-neutral-200/50 p-8 flex items-center justify-between border border-neutral-100"
                    >
                        <div className="flex -space-x-5">
                            <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-neutral-100 flex items-center justify-center">
                                <iconify-icon icon="solar:user-bold-duotone" width="40" height="40" class="text-neutral-300"></iconify-icon>
                            </div>
                            <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-rose-50 flex items-center justify-center">
                                <iconify-icon icon="solar:heart-bold-duotone" width="40" height="40" class="text-rose-400"></iconify-icon>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-5xl font-black text-neutral-800 tracking-tighter leading-none">
                                {daysTogether} <span className="text-sm text-rose-500 font-black tracking-normal uppercase ml-1">Ngày</span>
                            </h2>
                            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em] mt-2">
                                {getDashboardLabel(profile)}
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* Large Widget */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-6 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></div>
                        <h3 className="text-neutral-800 text-sm font-black uppercase tracking-widest">Widget Lớn (2x2)</h3>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="w-full aspect-square bg-white rounded-[4rem] shadow-xl shadow-neutral-200/50 p-10 flex flex-col border border-neutral-100 relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-6xl font-black text-neutral-800 tracking-tighter leading-none">
                                    {daysTogether} <span className="text-lg text-rose-500 font-black tracking-normal uppercase ml-1">Ngày</span>
                                </h2>
                                <p className="text-[11px] text-neutral-400 font-black uppercase tracking-widest mt-3 px-1 flex items-center gap-2">
                                    <iconify-icon icon="solar:calendar-date-bold" width="14" height="14"></iconify-icon>
                                    Từ {anniversaryStr}
                                </p>
                            </div>
                            <iconify-icon icon="solar:stars-minimalistic-bold-duotone" width="48" height="48" class="text-amber-300 animate-pulse"></iconify-icon>
                        </div>

                        <div className="flex-1 space-y-5">
                            {nextMilestone.title && (
                                <div className="bg-rose-50/50 p-6 rounded-[2rem] flex items-center gap-5 border border-rose-100/50">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500">
                                        <iconify-icon icon="solar:cup-bold-duotone" width="32" height="32"></iconify-icon>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Mục tiêu tiếp theo</span>
                                        <span className="text-[15px] font-bold text-neutral-700">{nextMilestone.title} ({nextMilestone.date})</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-neutral-50/50 p-6 rounded-[2rem] flex items-center gap-5 border border-neutral-100/50">
                                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-neutral-300">
                                    <iconify-icon icon="solar:pen-new-square-bold-duotone" width="32" height="32"></iconify-icon>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Kỷ niệm gần nhất</span>
                                    <span className="text-sm font-bold text-neutral-500 line-clamp-1 italic">
                                        "{latestEntry?.content || "Chưa có kỷ niệm..."}"
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-neutral-50 flex justify-center">
                            <span className="text-[10px] text-neutral-300 font-black tracking-[0.4em] uppercase">MÃI MÃI BÊN NHAU</span>
                        </div>
                    </motion.div>
                </section>
                
                <div className="pt-6">
                    <button 
                        onClick={() => navigate('/settings/background')}
                        className="w-full bg-neutral-900 text-white font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm"
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
