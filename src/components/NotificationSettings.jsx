import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';

const NotificationSettings = () => {
    const { profile, refreshData } = useData();
    const navigate = useNavigate();
    const [dailyReminder, setDailyReminder] = useState(true);
    const [milestones, setMilestones] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setDailyReminder(profile.daily_reminder !== false);
            setMilestones(profile.milestone_notifications !== false);
        }
    }, [profile]);

    const handleToggle = async (key, currentVal, setter) => {
        const newValue = !currentVal;
        setter(newValue);
        setLoading(true);
        try {
            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
                [key]: newValue
            });
            refreshData();
        } catch (error) {
            console.error(error);
            setter(currentVal);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-neutral-50 pb-32">
            <header className="flex items-center bg-neutral-50/80 p-4 justify-between sticky top-0 z-10 backdrop-blur-md border-b border-neutral-100">
                <button 
                    onClick={() => navigate('/settings')}
                    className="text-neutral-400 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
                >
                    <iconify-icon icon="solar:arrow-left-bold" width="24" height="24"></iconify-icon>
                </button>
                <h2 className="text-neutral-800 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Cài đặt thông báo</h2>
                <div className="w-10"></div>
            </header>

            <main className="max-w-lg mx-auto px-6 pt-10 space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 space-y-10">
                    <h4 className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-neutral-50 pb-4">Nhắc nhở & Sự kiện</h4>
                    
                    {/* Item 1: Daily Reminder */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                                <iconify-icon icon="solar:calendar-bold-duotone" width="28" height="28"></iconify-icon>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-neutral-800 text-[15px] font-bold leading-tight">Nhắc nhở hàng ngày</h4>
                                <p className="text-neutral-400 text-xs font-medium mt-1">Viết nhật ký cho đối phương</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('daily_reminder', dailyReminder, setDailyReminder)}
                            disabled={loading}
                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${dailyReminder ? 'bg-blue-400' : 'bg-neutral-200'}`}
                        >
                            <motion.div
                                animate={{ x: dailyReminder ? 28 : 4 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                        </button>
                    </div>

                    {/* Item 2: Milestones */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
                                <iconify-icon icon="solar:stars-bold-duotone" width="28" height="28"></iconify-icon>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-neutral-800 text-[15px] font-bold leading-tight">Mốc kỷ niệm</h4>
                                <p className="text-neutral-400 text-xs font-medium mt-1">100, 365 ngày và hơn thế</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('milestone_notifications', milestones, setMilestones)}
                            disabled={loading}
                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${milestones ? 'bg-rose-400' : 'bg-neutral-200'}`}
                        >
                            <motion.div
                                animate={{ x: milestones ? 28 : 4 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="bg-rose-50/30 border border-rose-100/50 rounded-3xl p-6 flex gap-4">
                        <iconify-icon icon="solar:info-circle-bold" width="20" height="20" class="text-rose-400 mt-0.5 shrink-0"></iconify-icon>
                        <p className="text-[11px] text-neutral-500 leading-relaxed font-medium italic">
                            Các thông báo này giúp hai bạn duy trì kết nối và không bỏ lỡ những khoảnh khắc đáng nhớ trong tình yêu.
                        </p>
                    </div>
                </div>

                <div className="pt-6">
                    <button 
                        onClick={() => navigate('/settings')}
                        className="w-full bg-neutral-900 text-white font-black py-5 rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                    >
                        Hoàn tất
                    </button>
                </div>
            </main>

            <Navbar />
        </div>
    );
};

export default NotificationSettings;
