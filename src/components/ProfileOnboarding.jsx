import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const ProfileOnboarding = ({ onComplete }) => {
    const [nickname, setNickname] = useState('');
    const [birthday, setBirthday] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nickname || !birthday) return;

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await setDoc(doc(db, 'profiles', user.uid), {
                    uid: user.uid,
                    nickname,
                    birthday,
                    avatar_url: user.photoURL || '',
                    link_status: 'none',
                    partner_id: null,
                    created_at: serverTimestamp()
                }, { merge: true });
                onComplete();
            }
        } catch (error) {
            console.error("Profile Onboarding Error:", error);
            alert("Lỗi khi lưu thông tin. Hãy thử lại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8faff] flex flex-col items-center justify-center p-6 font-sans">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-[100px] -z-10 translate-x-1/4 -translate-y-1/4" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-blue-100/50 border border-blue-50 text-center relative overflow-hidden">
                    <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-primary shadow-sm border border-blue-100/50">
                        <iconify-icon icon="solar:user-speak-bold-duotone" width="48" height="48"></iconify-icon>
                    </div>
                    
                    <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Mến chào bạn thân yêu!</h2>
                    <p className="text-sm text-slate-400 font-bold mb-10 uppercase tracking-widest px-4">Hãy cho chúng mình biết một chút về bạn nhé.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="text-left space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Biệt danh của bạn</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                    <iconify-icon icon="solar:star-bold-duotone" width="20" height="20"></iconify-icon>
                                </div>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ở nhà cục cưng gọi bạn là gì nhỉ?"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 rounded-full bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="text-left space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Ngày bạn khóc oe oe</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                    <iconify-icon icon="solar:calendar-bold-duotone" width="20" height="20"></iconify-icon>
                                </div>
                                <input
                                    required
                                    type="date"
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 rounded-full bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-primary text-white font-black py-5 rounded-full shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all mt-6 flex items-center justify-center uppercase tracking-widest text-xs"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            ) : "Kết nối với cục cưng nào!!"}
                        </button>
                    </form>
                </div>
                
                <p className="mt-10 text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">Connecting Hearts Since 2024</p>
            </motion.div>
        </div>
    );
};

export default ProfileOnboarding;
