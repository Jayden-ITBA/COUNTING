import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import Navbar from './Navbar';

const SecuritySettings = ({ profile }) => {
    const navigate = useNavigate();
    const [passcodeEnabled, setPasscodeEnabled] = useState(!!profile?.pin);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleExportData = () => {
        alert("Chức năng xuất dữ liệu đang được chuẩn bị. Chúng tôi sẽ gửi file vào email của bạn sớm!");
    };

    const handleBackup = () => {
        alert("Dữ liệu của bạn đã được đồng bộ tự động với Cloud.");
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'profiles', auth.currentUser.uid));
            await auth.currentUser.delete();
            navigate('/login');
        } catch (error) {
            console.error(error);
            alert("Lỗi khi xóa tài khoản: " + error.message);
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
                <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Bảo mật & Dữ liệu</h2>
                <div className="w-10"></div>
            </header>

            <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
                {/* Security Section */}
                <section className="space-y-3">
                    <h3 className="px-2 text-xs font-bold text-blue-400 uppercase tracking-widest">Quyền riêng tư</h3>
                    <div className="bg-white/60 backdrop-blur-md border border-blue-100/20 rounded-3xl p-6 shadow-sm space-y-8">
                        {/* Passcode Lock */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-400 border border-blue-100/50">
                                    <span className="material-symbols-outlined">lock</span>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-slate-900 text-sm font-bold leading-tight">Passcode Lock</h4>
                                    <p className="text-blue-400 text-xs mt-1">{passcodeEnabled ? "Đang bảo vệ" : "Chưa thiết lập"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/settings/security/lock')}
                                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${passcodeEnabled ? 'bg-blue-400' : 'bg-slate-200'}`}
                            >
                                <motion.div
                                    animate={{ x: passcodeEnabled ? 28 : 4 }}
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                                />
                            </button>
                        </div>

                        {/* Biometric Lock */}
                        <div className="flex items-center justify-between opacity-50">
                            <div className="flex gap-4 items-center">
                                <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-400 border border-blue-100/50">
                                    <span className="material-symbols-outlined">fingerprint</span>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-slate-900 text-sm font-bold leading-tight">Face ID / Vân tay</h4>
                                    <p className="text-blue-400 text-xs mt-1">Sắp ra mắt</p>
                                </div>
                            </div>
                            <div className="w-14 h-8 rounded-full bg-slate-100 relative">
                                <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Section */}
                <section className="space-y-3">
                    <h3 className="px-2 text-xs font-bold text-blue-400 uppercase tracking-widest">Dữ liệu</h3>
                    <div className="bg-white/60 backdrop-blur-md border border-blue-100/20 rounded-3xl overflow-hidden shadow-sm">
                        <button onClick={handleExportData} className="w-full flex items-center gap-4 p-5 hover:bg-white/40 transition-colors border-b border-blue-50/50">
                            <span className="material-symbols-outlined text-blue-400">download</span>
                            <span className="text-slate-700 text-sm font-bold flex-1 text-left">Xuất dữ liệu kỷ niệm</span>
                            <span className="material-symbols-outlined text-blue-200">chevron_right</span>
                        </button>
                        <button onClick={handleBackup} className="w-full flex items-center gap-4 p-5 hover:bg-white/40 transition-colors">
                            <span className="material-symbols-outlined text-blue-400">cloud_sync</span>
                            <span className="text-slate-700 text-sm font-bold flex-1 text-left">Sao lưu & Đồng bộ</span>
                            <span className="material-symbols-outlined text-blue-200">chevron_right</span>
                        </button>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="pt-6">
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full bg-white text-red-400 font-bold py-4 rounded-2xl border border-red-50 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                    >
                        <span className="material-symbols-outlined">person_remove</span>
                        Xóa tài khoản vĩnh viễn
                    </button>
                </section>
            </main>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {showDeleteConfirm && (
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
                                <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Bạn chắc chứ?</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-8">Hành động này không thể hoàn tác. Mọi kỷ niệm và dữ liệu của bạn sẽ bị xóa vĩnh viễn.</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleDeleteAccount} className="w-full bg-red-500 text-white font-bold py-4 rounded-full shadow-lg shadow-red-500/20 active:scale-95 transition-all">
                                    {loading ? "Đang xóa..." : "Xác nhận xóa"}
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-full active:scale-95 transition-all">Quay lại</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Navbar profile={profile} />
        </div>
    );
};

export default SecuritySettings;
