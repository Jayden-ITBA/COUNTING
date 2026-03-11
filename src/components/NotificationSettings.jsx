import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const NotificationSettings = ({ profile }) => {
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
        } catch (error) {
            console.error(error);
            setter(currentVal);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#f0f7ff] pb-32">
            <header className="flex items-center bg-transparent p-4 justify-between sticky top-0 z-10 backdrop-blur-md">
                <button 
                    onClick={() => navigate('/settings')}
                    className="text-blue-400 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-blue-100 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Cài đặt thông báo</h2>
                <div className="w-10"></div>
            </header>

            <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
                <div className="bg-white/60 backdrop-blur-md border border-blue-100/20 rounded-3xl p-6 shadow-sm space-y-8">
                    {/* Item 1: Daily Reminder */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-400 border border-blue-100/50">
                                <span className="material-symbols-outlined">calendar_today</span>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-slate-900 text-sm font-bold leading-tight">Daily Reminder</h4>
                                <p className="text-blue-400 text-xs mt-1">Nhắc nhở viết nhật ký mỗi ngày</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('daily_reminder', dailyReminder, setDailyReminder)}
                            disabled={loading}
                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${dailyReminder ? 'bg-blue-400' : 'bg-slate-200'}`}
                        >
                            <motion.div
                                animate={{ x: dailyReminder ? 28 : 4 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                            />
                        </button>
                    </div>

                    {/* Item 2: Milestones */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100/50">
                                <span className="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-slate-900 text-sm font-bold leading-tight">Milestones</h4>
                                <p className="text-blue-400 text-xs mt-1">Thông báo mốc 100, 365 ngày...</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('milestone_notifications', milestones, setMilestones)}
                            disabled={loading}
                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${milestones ? 'bg-blue-400' : 'bg-slate-200'}`}
                        >
                            <motion.div
                                animate={{ x: milestones ? 28 : 4 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                            />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="bg-blue-50/50 border border-blue-100/30 rounded-2xl p-4 flex gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-sm mt-0.5">info</span>
                        <p className="text-xs text-blue-400/80 leading-relaxed italic">
                            Các thông báo này giúp hai bạn duy trì kết nối và không bỏ lỡ những khoảnh khắc đáng nhớ trong tình yêu.
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={() => navigate('/settings')}
                        className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform uppercase tracking-widest text-sm"
                    >
                        Lưu thiết lập
                    </button>
                </div>
            </main>

            <Navbar profile={profile} />
        </div>
    );
};

export default NotificationSettings;
