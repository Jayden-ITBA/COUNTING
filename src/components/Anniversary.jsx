import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from './Navbar';

const Anniversary = ({ profile }) => {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.couple_id) {
            const unsubscribe = onSnapshot(doc(db, 'couples', profile.couple_id), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const anniversary = data.anniversary_date.toDate();
                    const now = new Date();

                    const calculateMilestones = () => {
                        const targets = [100, 200, 300, 365, 500, 1000];
                        return targets.map(target => {
                            const targetDate = new Date(anniversary);
                            targetDate.setDate(anniversary.getDate() + target);

                            const diffTime = targetDate - now;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const completed = diffDays <= 0;

                            return {
                                title: target === 365 ? "1 Năm" : `${target} Ngày`,
                                date: targetDate.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }),
                                daysLeft: completed ? 0 : diffDays,
                                completed,
                                progress: completed ? 100 : Math.max(0, 100 - (diffDays / target * 100))
                            };
                        });
                    };

                    setMilestones(calculateMilestones());
                    setLoading(false);
                }
            });
            return () => unsubscribe();
        }
    }, [profile]);

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-slate-800">Cột mốc kỷ niệm</h1>
                <p className="text-slate-500">Hành trình của chúng mình</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="px-6 space-y-4">
                    {milestones.map((milestone, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`glass p-5 rounded-3xl flex items-center gap-4 ${milestone.completed ? 'bg-green-50/30' : ''}`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${milestone.completed ? 'bg-green-100' : 'bg-blue-50'}`}>
                                <span className={`material-symbols-outlined ${milestone.completed ? 'text-green-500' : 'text-blue-500'}`}>
                                    {milestone.completed ? 'verified' : 'auto_awesome'}
                                </span>
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm">{milestone.title}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{milestone.date}</p>
                                {!milestone.completed && (
                                    <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${milestone.progress}%` }}
                                            className="bg-blue-500 h-full"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="text-right">
                                {milestone.completed ? (
                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Đã đạt được</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Còn {milestone.daysLeft} ngày</span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <Navbar />
        </div>
    );
};

export default Anniversary;
