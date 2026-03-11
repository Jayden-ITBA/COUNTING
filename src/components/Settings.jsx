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

    const sections = [
        {
            group: "Tài khoản & Hồ sơ",
            items: [
                { icon: 'person', title: 'Thông tin cá nhân', desc: 'Biệt danh, Ngày sinh, Nhãn Dashboard', path: '/settings/profile', color: 'bg-blue-50 text-blue-500' },
                { icon: 'link', title: 'Kết nối Partner', desc: 'Quản lý lời mời & liên kết', path: '/settings/pairing', color: 'bg-rose-50 text-rose-500' },
            ]
        },
        {
            group: "Giao diện & Trải nghiệm",
            items: [
                { icon: 'palette', title: 'Tùy chỉnh giao diện', desc: 'Ảnh nền & Widget', path: '/settings/background', color: 'bg-indigo-50 text-indigo-500' },
                { icon: 'notifications', title: 'Cài đặt thông báo', desc: 'Nhắc nhở hàng ngày & Milestone', path: '/settings/notifications', color: 'bg-amber-50 text-amber-500' },
            ]
        },
        {
            group: "Quyền riêng tư",
            items: [
                { icon: 'security', title: 'Bảo mật & Dữ liệu', desc: 'Khóa ứng dụng & Quản lý dữ liệu', path: '/settings/security', color: 'bg-emerald-50 text-emerald-500' },
            ]
        }
    ];

    return (
        <div className="relative min-h-screen bg-[#f8fafc] pb-32">
            {/* Header */}
            <header className="flex items-center p-6 sticky top-0 bg-[#f8fafc]/80 backdrop-blur-md z-10">
                <button onClick={() => navigate('/')} className="text-slate-400 p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-slate-800 ml-2">Cài đặt tổng</h1>
            </header>

            <main className="px-4 space-y-8">
                {/* Profile Brief */}
                <div onClick={() => navigate('/settings/profile')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 ring-4 ring-blue-50">
                        <img src={profile?.avatar_url || "/api/placeholder/100/100"} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">{profile?.nickname || 'Người dùng'}</h3>
                        <p className="text-slate-400 text-sm">Chỉnh sửa hồ sơ của bạn</p>
                    </div>
                    <span className="material-symbols-outlined ml-auto text-slate-300">chevron_right</span>
                </div>

                {/* Settings list */}
                {sections.map((section, sidx) => (
                    <div key={sidx} className="space-y-3">
                        <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{section.group}</h3>
                        <div className="space-y-2">
                            {section.items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(item.path)}
                                    className="bg-white p-4 rounded-2xl flex items-center gap-4 cursor-pointer border border-slate-50 shadow-sm"
                                >
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                                        <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[15px] text-slate-800">{item.title}</h4>
                                        <p className="text-[12px] text-slate-400 line-clamp-1">{item.desc}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Logout Button */}
                <div className="pt-4">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full bg-white text-red-500 font-bold py-4 rounded-2xl border border-red-50 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all text-sm uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Đăng xuất
                    </button>
                    <p className="text-center text-[10px] text-slate-300 mt-6 font-medium">VERSION 2.4.0 • LOVE DAYS APP</p>
                </div>
            </main>

            {/* Logout Confirm Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-3xl text-red-500">logout</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Đăng xuất?</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-8">Bạn có chắc chắn muốn rời khỏi ứng dụng không?</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleLogout} className="w-full bg-red-500 text-white font-bold py-4 rounded-full shadow-lg shadow-red-500/20 active:scale-95 transition-all">Xác nhận đăng xuất</button>
                                <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-full active:scale-95 transition-all">Hủy</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Navbar profile={profile} />
        </div>
    );
};

export default Settings;
