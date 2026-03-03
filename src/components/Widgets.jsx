import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import Navbar from './Navbar';

const Widgets = ({ profile }) => {
    const [daysTogether, setDaysTogether] = useState(0);
    const [anniversaryStr, setAnniversaryStr] = useState('');
    const [nextMilestone, setNextMilestone] = useState({});
    const [latestEntry, setLatestEntry] = useState(null);

    useEffect(() => {
        if (profile?.couple_id) {
            // Fetch Couple Data
            const unsubCouple = onSnapshot(doc(db, 'couples', profile.couple_id), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const anniversary = data.anniversary_date.toDate();
                    const now = new Date();
                    const diff = Math.floor(Math.abs(now - anniversary) / (1000 * 60 * 60 * 24));
                    setDaysTogether(diff);
                    setAnniversaryStr(anniversary.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

                    // Calculate next milestone
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
                            title: next === 365 ? "1 Year" : `${next} Days`,
                            date: nDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        });
                    }
                }
            });

            // Fetch Latest Diary Entry
            const q = query(
                collection(db, 'diary'),
                where('couple_id', '==', profile.couple_id),
                orderBy('created_at', 'desc'),
                limit(1)
            );
            const unsubDiary = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    setLatestEntry(snapshot.docs[0].data());
                }
            });

            return () => {
                unsubCouple();
                unsubDiary();
            };
        }
    }, [profile]);

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-slate-800">Mẫu Widget</h1>
                <p className="text-slate-500 text-sm">Giao diện ứng dụng trên màn hình chờ</p>
            </div>

            <div className="px-6 space-y-10">
                {/* Small Widget */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Small (1x1)
                    </h4>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="w-36 h-36 glass rounded-[2.5rem] p-5 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="material-symbols-outlined text-blue-500 text-3xl fill-1 mb-1 animate-pulse">favorite</span>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{daysTogether}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Days</p>
                    </motion.div>
                </div>

                {/* Medium Widget */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Medium (2x1)
                    </h4>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="w-full max-w-sm h-36 glass rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden"
                    >
                        <div className="flex -space-x-4">
                            <div className="w-14 h-14 rounded-full border-2 border-white bg-slate-100 shadow-lg overflow-hidden flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-300">person</span>
                            </div>
                            <div className="w-14 h-14 rounded-full border-2 border-white bg-blue-50 shadow-lg overflow-hidden flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-200">favorite</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
                                {daysTogether} <span className="text-sm text-blue-500 font-bold tracking-normal uppercase ml-1">Days</span>
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{profile?.nickname || 'Jayden'} & Partner</p>
                        </div>
                    </motion.div>
                </div>

                {/* Large Widget */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Large (2x2)
                    </h4>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="w-full max-w-sm aspect-square glass rounded-[3.5rem] p-8 shadow-2xl flex flex-col relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
                                    {daysTogether} <span className="text-sm text-blue-500 font-bold tracking-normal uppercase ml-1">Days</span>
                                </h2>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-2">Together Since {anniversaryStr}</p>
                            </div>
                            <span className="material-symbols-outlined text-blue-400 fill-1 text-3xl animate-spin-slow">sparkles</span>
                        </div>

                        <div className="flex-1 space-y-4">
                            {nextMilestone.title && (
                                <div className="bg-blue-50/50 p-4 rounded-3xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500">
                                        <span className="material-symbols-outlined">celebration</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest block">Next Goal</span>
                                        <span className="text-xs font-bold text-slate-700">{nextMilestone.title} ({nextMilestone.date})</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50/50 p-4 rounded-3xl flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined">history_edu</span>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Latest Discovery</span>
                                    <span className="text-xs font-bold text-slate-500 italic line-clamp-1">
                                        {latestEntry?.content || "No memories yet..."}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center">
                            <span className="text-[10px] text-blue-400 font-black tracking-[0.2em] uppercase">✨ Forever Together ✨</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <Navbar profile={profile} />
        </div>
    );
};

export default Widgets;
