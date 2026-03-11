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
        <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm glass p-8 rounded-[3rem] text-center"
            >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl text-blue-500 fill-1">person</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Mến chào bạn thân yêu!</h2>
                <p className="text-sm text-slate-500 mb-8">Hãy cho chúng mình biết một chút về bạn nhé.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-left">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">Biệt danh của bạn</label>
                        <input
                            required
                            type="text"
                            placeholder="Ở nhà cục cưng gọi bạn là gì nhỉ?"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="text-left">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">Ngày bạn khóc oe oe</label>
                        <input
                            required
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-transform mt-4 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : "Kết nối với cục cưng nào!!"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ProfileOnboarding;
