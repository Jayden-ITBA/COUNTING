import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import Navbar from './Navbar';

const Settings = ({ profile }) => {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Logout error:", error);
            alert("Lỗi khi đăng xuất!");
        }
    };

    const settingsItems = [
        { icon: 'wallpaper', title: 'Cài đặt ảnh nền', description: 'Đổi ảnh Dashboard & độ mờ', path: '/settings/background' },
        { icon: 'widgets', title: 'Giao diện Widget', description: 'Xem các mẫu Widget (S, M, L)', path: '/settings/widgets' },
        { icon: 'link', title: 'Cài đặt kết nối', description: 'Link mời & Phòng chờ', path: '/settings/pairing' },
        { icon: 'notifications', title: 'Thông báo', description: 'Nhắc nhở ngày kỷ niệm', path: '/settings/notifications' },
        { icon: 'lock', title: 'Bảo mật', description: 'Cài đặt mã PIN khóa App', path: '/settings/security' },
        { icon: 'person', title: 'Thông tin cá nhân', description: 'Biệt danh & Ngày sinh', path: '/settings/profile' },
    ];

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-slate-800">Cài đặt</h1>
                <p className="text-slate-500">Tùy chỉnh không gian của bạn</p>
            </div>

            <div className="px-6 space-y-4">
                {settingsItems.map((item, index) => (
                    <motion.div
                        key={index}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(item.path)}
                        className="glass p-5 rounded-3xl flex items-center gap-4 cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                            <span className="material-symbols-outlined">{item.icon}</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-slate-800">{item.title}</h4>
                            <p className="text-xs text-slate-500">{item.description}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </motion.div>
                ))}

                <div className="pt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    LoveDays v1.0.0
                </div>
            </div>

            {/* Danger Zone */}
            <div className="px-6 pt-10 pb-20">
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full bg-white border border-red-100 text-red-500 font-bold py-4 rounded-3xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                    Đăng xuất
                </button>
            </div>

            {/* Logout Confirm Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-3xl text-red-500">logout</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Đăng xuất?</h3>
                            <p className="text-sm text-slate-500 mb-8">Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?</p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-red-500 text-white font-bold py-4 rounded-full shadow-lg shadow-red-500/20"
                                >
                                    Đăng xuất
                                </button>
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-full"
                                >
                                    Hủy
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Navbar profile={profile} />
        </div>
    );
};

export default Settings;
