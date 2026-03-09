import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Navbar from './Navbar';

const NotificationSettings = ({ profile }) => {
    const [reminders, setReminders] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setReminders(profile.notification_reminders !== false);
        }
    }, [profile]);

    const handleToggle = async () => {
        const newValue = !reminders;
        setReminders(newValue);
        setLoading(true);
        try {
            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
                notification_reminders: newValue
            });
        } catch (error) {
            console.error(error);
            setReminders(!newValue);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-slate-800">Thông báo</h1>
                <p className="text-slate-500 text-sm">Cài đặt nhắc nhở kỷ niệm</p>
            </div>

            <div className="px-6 space-y-4">
                <div className="glass p-6 rounded-[2.5rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <span className="material-symbols-outlined">notifications_active</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-800">Nhắc nhở ngày kỷ niệm</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hàng tháng & Hàng năm</p>
                        </div>
                    </div>

                    <button
                        onClick={handleToggle}
                        disabled={loading}
                        className={`w-12 h-6 rounded-full relative transition-colors ${reminders ? 'bg-blue-500' : 'bg-slate-200'}`}
                    >
                        <motion.div
                            animate={{ x: reminders ? 24 : 4 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                    </button>
                </div>

                <div className="p-6 text-center">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Hệ thống sẽ gửi thông báo cho hai bạn vào các ngày mốc kỷ niệm quan trọng như 100 ngày, 365 ngày... và mỗi tháng vào ngày kỷ niệm.
                    </p>
                </div>
            </div>

            <Navbar profile={profile} />
        </div>
    );
};

export default NotificationSettings;
