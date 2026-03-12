import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';

const SecuritySettings = () => {
    const { profile } = useData();
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
        <div className="relative min-h-screen bg-[#f8faff] pb-32 font-sans">
            <header className="flex items-center justify-between p-6 sticky top-0 bg-[#f8faff]/80 backdrop-blur-md z-10 border-b border-blue-50">
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100/50 border border-blue-50"
                >
                  <iconify-icon icon="solar:arrow-left-bold-duotone" width="24" height="24" class="text-slate-400"></iconify-icon>
                </button>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Bảo mật & Dữ liệu</h1>
                <div className="w-12" />
            </header>

            <main className="px-6 mt-8 space-y-10">
                {/* Security Section */}
                <section className="space-y-4">
                    <h3 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Quyền riêng tư</h3>
                    <div className="bg-white rounded-[3.5rem] p-10 shadow-xl shadow-blue-100/20 border border-blue-50 space-y-10">
                        {/* Passcode Lock */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-5 items-center">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-primary shadow-sm shadow-blue-100/50">
                                    <iconify-icon icon="solar:lock-password-bold-duotone" width="32" height="32"></iconify-icon>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-slate-800 text-sm font-bold leading-tight">Khóa ứng dụng</h4>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">{passcodeEnabled ? "Đang bảo vệ" : "Chưa thiết lập"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/settings/security/lock')}
                                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${passcodeEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                            >
                                <motion.div
                                    animate={{ x: passcodeEnabled ? 28 : 4 }}
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                />
                            </button>
                        </div>

                        {/* Biometric Lock */}
                        <div className="flex items-center justify-between opacity-50">
                            <div className="flex gap-5 items-center">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm">
                                    <iconify-icon icon="solar:fingerprint-bold-duotone" width="32" height="32"></iconify-icon>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-slate-800 text-sm font-bold leading-tight">Face ID / Vân tay</h4>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">Sắp ra mắt</p>
                                </div>
                            </div>
                            <div className="w-14 h-8 rounded-full bg-slate-100 relative">
                                <div className="absolute top-1 left-1 w-6 h-6 bg-white border border-slate-50 rounded-full" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Section */}
                <section className="space-y-4">
                    <h3 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Dữ liệu của bạn</h3>
                    <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-xl shadow-blue-100/20 border border-blue-50">
                        <button onClick={handleExportData} className="w-full flex items-center gap-6 p-8 hover:bg-slate-50 transition-colors border-b border-blue-50">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center">
                                <iconify-icon icon="solar:download-bold-duotone" width="24" height="24"></iconify-icon>
                            </div>
                            <span className="text-slate-700 text-sm font-bold flex-1 text-left">Xuất dữ liệu kỷ niệm</span>
                            <iconify-icon icon="solar:alt-arrow-right-bold" width="20" height="20" class="text-slate-200"></iconify-icon>
                        </button>
                        <button onClick={handleBackup} className="w-full flex items-center gap-6 p-8 hover:bg-slate-50 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center">
                                <iconify-icon icon="solar:cloud-upload-bold-duotone" width="24" height="24"></iconify-icon>
                            </div>
                            <span className="text-slate-700 text-sm font-bold flex-1 text-left">Sao lưu & Đồng bộ</span>
                            <iconify-icon icon="solar:alt-arrow-right-bold" width="20" height="20" class="text-slate-200"></iconify-icon>
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 px-8 italic font-medium leading-relaxed mt-4">
                        * Mọi dữ liệu của hai bạn đều được mã hóa và bảo mật tuyệt đối trên hệ thống đám mây.
                    </p>
                </section>

                {/* Danger Zone */}
                <section className="pt-10">
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full bg-white text-slate-400 font-black py-5 rounded-full border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-[11px] uppercase tracking-[0.15em] hover:text-red-400 transition-colors"
                    >
                        <iconify-icon icon="solar:user-minus-bold-duotone" width="20" height="20"></iconify-icon>
                        Xóa tài khoản vĩnh viễn
                    </button>
                </section>
            </main>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[3.5rem] p-12 w-full max-w-sm shadow-2xl text-center border border-blue-50"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-400 shadow-inner">
                                <iconify-icon icon="solar:danger-bold-duotone" width="48" height="48"></iconify-icon>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Bạn chắc chứ?</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-12">Mọi kỷ niệm và dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi trái tim ứng dụng. Hành động này không thể hoàn tác.</p>
                            <div className="flex flex-col gap-6">
                                <button onClick={handleDeleteAccount} className="w-full bg-slate-900 text-white font-black py-5 rounded-full shadow-2xl shadow-slate-200 active:scale-95 transition-all uppercase tracking-widest text-[11px]">
                                    {loading ? "Đang xóa..." : "Xác nhận xóa ngay"}
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="w-full text-slate-400 font-black py-2 text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all">Quay lại</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Navbar />
        </div>
    );
};

export default SecuritySettings;
