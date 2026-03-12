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
            await refreshData();
        } catch (error) {
            console.error(error);
            setter(currentVal);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#f8faff] pb-32 font-sans">
            <header className="flex items-center justify-between p-6 sticky top-0 bg-[#f8faff]/80 backdrop-blur-md z-10 border-b border-blue-50">
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100/50 border border-blue-50"
                >
                  <iconify-icon icon="solar:arrow-left-bold-duotone" width="24" height="24" class="text-slate-400"></iconify-icon>
                </button>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Cài đặt thông báo</h1>
                <div className="w-12" />
            </header>

            <main className="px-6 mt-8 space-y-10">
                <div className="bg-white rounded-[3.5rem] p-10 shadow-xl shadow-blue-100/20 border border-blue-50 space-y-10">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-blue-50 pb-6">Nhắc nhở & Sự kiện</h4>
                    
                    {/* Item 1: Daily Reminder */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-5 items-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-primary shadow-sm shadow-blue-100/50">
                                <iconify-icon icon="solar:calendar-bold-duotone" width="32" height="32"></iconify-icon>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-slate-800 text-sm font-bold leading-tight">Nhắc nhở hàng ngày</h4>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">Viết nhật ký cho đối phương</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('daily_reminder', dailyReminder, setDailyReminder)}
                            disabled={loading}
                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${dailyReminder ? 'bg-primary' : 'bg-slate-200'}`}
                        >
                            <motion.div
                                animate={{ x: dailyReminder ? 28 : 4 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                        </button>
                    </div>

                    {/* Item 2: Milestones */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-5 items-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-primary shadow-sm shadow-blue-100/50">
                                <iconify-icon icon="solar:stars-bold-duotone" width="32" height="32"></iconify-icon>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-slate-800 text-sm font-bold leading-tight">Mốc kỷ niệm</h4>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">100, 365 ngày và hơn thế</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('milestone_notifications', milestones, setMilestones)}
                            disabled={loading}
                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${milestones ? 'bg-primary' : 'bg-slate-200'}`}
                        >
                            <motion.div
                                animate={{ x: milestones ? 28 : 4 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                        </button>
                    </div>
                </div>

                <div className="px-2">
                    <div className="bg-blue-50/50 border border-blue-50 rounded-3xl p-6 flex gap-4">
                        <iconify-icon icon="solar:info-circle-bold-duotone" width="20" height="20" class="text-primary mt-0.5 shrink-0"></iconify-icon>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">
                            Các thông báo này giúp hai bạn duy trì kết nối và không bỏ lỡ những khoảnh khắc đáng nhớ trong tình yêu.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={() => navigate('/settings')}
                        className="w-full bg-primary text-white font-black py-5 rounded-full shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-[11px]"
                    >
                        Hoàn tất cài đặt
                    </button>
                </div>
            </main>

            <Navbar />
        </div>
    );
};

export default NotificationSettings;
