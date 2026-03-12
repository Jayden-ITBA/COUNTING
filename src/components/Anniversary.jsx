import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';

const Anniversary = () => {
    const { couple } = useData();
    const [milestones, setMilestones] = useState([]);

    const calculateMilestones = (anniversaryDate) => {
        if (!anniversaryDate) return [];
        const anniversary = anniversaryDate.toDate ? anniversaryDate.toDate() : new Date(anniversaryDate);
        const now = new Date();
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

    useEffect(() => {
        if (couple?.anniversary_date) {
            setMilestones(calculateMilestones(couple.anniversary_date));
        }
    }, [couple]);

    return (
        <div className="relative min-h-screen bg-neutral-50 pb-32">
            <header className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Cột mốc kỷ niệm</h1>
                <p className="text-neutral-400 text-xs font-medium mt-1 uppercase tracking-widest">Hành trình yêu thương</p>
            </header>

            {!couple?.anniversary_date ? (
                <div className="flex flex-col items-center justify-center pt-20 px-10 text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-8">
                        <iconify-icon icon="solar:calendar-mark-linear" width="48" height="48" className="text-neutral-200"></iconify-icon>
                    </div>
                    <p className="text-neutral-400 text-sm font-medium leading-relaxed">Hãy kết nối với người ấy để bắt đầu hành trình nhé!</p>
                </div>
            ) : (
                <div className="px-6 space-y-6">
                    {milestones.map((milestone, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white p-6 rounded-[2rem] border border-neutral-100 flex items-center gap-5 shadow-sm ${milestone.completed ? 'bg-rose-50/20' : ''}`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${milestone.completed ? 'bg-rose-100 text-rose-500' : 'bg-neutral-50 text-neutral-400'}`}>
                                <iconify-icon icon={milestone.completed ? "solar:star-bold" : "solar:star-linear"} width="24" height="24"></iconify-icon>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-neutral-800 text-sm tracking-tight">{milestone.title}</h4>
                                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-0.5">{milestone.date}</p>
                                {!milestone.completed && (
                                    <div className="mt-3 w-full bg-neutral-50 h-1.5 rounded-full overflow-hidden border border-neutral-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${milestone.progress}%` }}
                                            className="bg-rose-400 h-full"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="text-right shrink-0">
                                {milestone.completed ? (
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Đã đạt</span>
                                ) : (
                                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">-{milestone.daysLeft}</span>
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
