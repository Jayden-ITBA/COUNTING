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
        <div className="relative min-h-screen bg-neutral-50 pb-32">
            <header className="flex items-center bg-neutral-50/80 p-4 justify-between sticky top-0 z-10 backdrop-blur-md border-b border-neutral-100">
                <button 
                    onClick={() => navigate('/settings')}
                    className="text-neutral-400 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
                >
                    <iconify-icon icon="solar:arrow-left-bold" width="24" height="24"></iconify-icon>
                </button>
                <h2 className="text-neutral-800 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Bảo mật & Dữ liệu</h2>
                <div className="w-10"></div>
            </header>

            <main className="max-w-lg mx-auto px-6 pt-10 space-y-10">
                {/* Security Section */}
                <section className="space-y-4">
                    <h3 className="px-4 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Quyền riêng tư</h3>
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 space-y-8">
                        {/* Passcode Lock */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                                    <iconify-icon icon="solar:lock-password-bold-duotone" width="28" height="28"></iconify-icon>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-neutral-800 text-[15px] font-bold leading-tight">Khóa ứng dụng</h4>
                                    <p className="text-neutral-400 text-xs font-medium mt-1">{passcodeEnabled ? "Đang bảo vệ" : "Chưa thiết lập"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/settings/security/lock')}
                                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${passcodeEnabled ? 'bg-blue-400' : 'bg-neutral-200'}`}
                            >
                                <motion.div
                                    animate={{ x: passcodeEnabled ? 28 : 4 }}
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                />
                            </button>
                        </div>

                        {/* Biometric Lock */}
                        <div className="flex items-center justify-between opacity-50">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 shadow-sm">
                                    <iconify-icon icon="solar:fingerprint-bold-duotone" width="28" height="28"></iconify-icon>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-neutral-800 text-[15px] font-bold leading-tight">Face ID / Vân tay</h4>
                                    <p className="text-neutral-400 text-xs font-medium mt-1">Sắp ra mắt</p>
                                </div>
                            </div>
                            <div className="w-14 h-8 rounded-full bg-neutral-50 relative">
                                <div className="absolute top-1 left-1 w-6 h-6 bg-white border border-neutral-100 rounded-full" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Section */}
                <section className="space-y-4">
                    <h3 className="px-4 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Dữ liệu</h3>
                    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-neutral-100">
                        <button onClick={handleExportData} className="w-full flex items-center gap-5 p-6 hover:bg-neutral-50 transition-colors border-b border-neutral-50">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                <iconify-icon icon="solar:download-bold" width="20" height="20"></iconify-icon>
                            </div>
                            <span className="text-neutral-700 text-[14px] font-bold flex-1 text-left">Xuất dữ liệu kỷ niệm</span>
                            <iconify-icon icon="solar:alt-arrow-right-bold" width="18" height="18" class="text-neutral-200"></iconify-icon>
                        </button>
                        <button onClick={handleBackup} className="w-full flex items-center gap-5 p-6 hover:bg-neutral-50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <iconify-icon icon="solar:cloud-upload-bold" width="20" height="20"></iconify-icon>
                            </div>
                            <span className="text-neutral-700 text-[14px] font-bold flex-1 text-left">Sao lưu & Đồng bộ</span>
                            <iconify-icon icon="solar:alt-arrow-right-bold" width="18" height="18" class="text-neutral-200"></iconify-icon>
                        </button>
                    </div>
                    <p className="text-[10px] text-neutral-400 px-6 italic">* Dữ liệu của bạn được mã hóa an toàn trên máy chủ đám mây.</p>
                </section>

                {/* Danger Zone */}
                <section className="pt-8">
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full bg-white text-rose-500 font-black py-5 rounded-[2rem] border border-rose-100 shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <iconify-icon icon="solar:user-minus-bold" width="20" height="20"></iconify-icon>
                        Xóa tài khoản vĩnh viễn
                    </button>
                </section>
            </main>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[3.5rem] p-10 w-full max-w-sm shadow-2xl text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
                                <iconify-icon icon="solar:danger-bold-duotone" width="40" height="40"></iconify-icon>
                            </div>
                            <h3 className="text-xl font-bold text-neutral-800 mb-2">Bạn chắc chứ?</h3>
                            <p className="text-sm text-neutral-500 font-medium leading-relaxed mb-10">Mọi kỷ niệm và dữ liệu của bạn sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.</p>
                            <div className="flex flex-col gap-4">
                                <button onClick={handleDeleteAccount} className="w-full bg-rose-500 text-white font-black py-5 rounded-full shadow-xl shadow-rose-500/20 active:scale-95 transition-all uppercase tracking-widest text-sm">
                                    {loading ? "Đang xóa..." : "Xác nhận xóa"}
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="w-full text-neutral-400 font-black py-2 text-[10px] uppercase tracking-widest active:scale-95 transition-all">Quay lại</button>
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
