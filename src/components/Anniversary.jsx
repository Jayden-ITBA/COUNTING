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
        <div className="relative min-h-screen bg-[#f8faff] pb-32 font-sans">
            <header className="px-6 pt-16 pb-8 border-b border-blue-50 bg-[#f8faff]/80 backdrop-blur-md sticky top-0 z-10">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cột mốc kỷ niệm</h1>
                <p className="text-primary/60 text-[10px] font-black mt-1 uppercase tracking-[0.3em]">Hành trình của chúng mình</p>
            </header>

            {!couple?.anniversary_date ? (
                <div className="flex flex-col items-center justify-center pt-32 px-10 text-center">
                    <div className="w-28 h-28 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl shadow-blue-100/50 mb-10 border border-blue-50">
                        <iconify-icon icon="solar:calendar-mark-bold-duotone" width="56" height="56" className="text-blue-100"></iconify-icon>
                    </div>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] leading-relaxed italic">Hãy kết nối với người ấy<br/>để bắt đầu hành trình nhé!</p>
                </div>
            ) : (
                <div className="px-6 space-y-6 pt-8">
                    {milestones.map((milestone, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white p-7 rounded-[3rem] border border-blue-50 flex items-center gap-6 shadow-2xl shadow-blue-100/20 ${milestone.completed ? 'bg-blue-50/20' : ''}`}
                        >
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg ${milestone.completed ? 'bg-primary text-white' : 'bg-blue-50 text-blue-200'}`}>
                                <iconify-icon icon={milestone.completed ? "solar:star-bold-duotone" : "solar:star-bold-duotone"} width="32" height="32"></iconify-icon>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-800 text-base tracking-tight">{milestone.title}</h4>
                                <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-1 opacity-60">{milestone.date}</p>
                                {!milestone.completed && (
                                    <div className="mt-4 w-full bg-blue-50/50 h-2 rounded-full overflow-hidden border border-blue-50">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${milestone.progress}%` }}
                                            className="bg-primary h-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="text-right shrink-0">
                                {milestone.completed ? (
                                    <div className="flex flex-col items-center">
                                        <iconify-icon icon="solar:check-circle-bold" width="20" height="20" class="text-primary mb-1"></iconify-icon>
                                        <span className="text-[8px] font-black text-primary uppercase tracking-widest">Đạt được</span>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">-{milestone.daysLeft}</span>
                                    </div>
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
