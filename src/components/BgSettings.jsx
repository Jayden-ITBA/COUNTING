import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { uploadMedia } from '../services/cloudinary';
import Navbar from './Navbar';

const BgSettings = ({ profile }) => {
    const [blur, setBlur] = useState(12);
    const [currentBg, setCurrentBg] = useState('https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=2000');
    const [loading, setLoading] = useState(false);
    const [daysTogether, setDaysTogether] = useState(0);

    useEffect(() => {
        if (profile?.couple_id) {
            const unsubscribe = onSnapshot(doc(db, 'couples', profile.couple_id), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.background_url) setCurrentBg(data.background_url);
                    if (data.blur_level !== undefined) setBlur(data.blur_level);

                    const anniversary = data.anniversary_date.toDate();
                    const diffDays = Math.floor(Math.abs(new Date() - anniversary) / (1000 * 60 * 60 * 24));
                    setDaysTogether(diffDays);
                }
            });
            return () => unsubscribe();
        }
    }, [profile]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const url = await uploadMedia(file);
            await updateDoc(doc(db, 'couples', profile.couple_id), {
                background_url: url
            });
        } catch (error) {
            alert("Lỗi khi tải ảnh: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const saveBlur = async () => {
        if (!profile?.couple_id) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, 'couples', profile.couple_id), {
                blur_level: blur
            });
            alert("Đã lưu cài đặt!");
        } catch (error) {
            alert("Lỗi khi lưu: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-slate-800">Cài đặt ảnh nền</h1>
                <p className="text-slate-500 text-sm">Cá nhân hóa Dashboard cho cả hai</p>
            </div>

            <div className="px-6 space-y-8">
                {/* Preview Area */}
                <div className="relative aspect-[9/16] w-full max-w-[220px] mx-auto rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white glass">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                        style={{
                            backgroundImage: `url(${currentBg})`,
                            filter: `blur(${blur}px) brightness(0.9)`
                        }}
                    />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center p-4">
                        <span className="material-symbols-outlined text-white text-3xl mb-1 fill-1 opacity-80">favorite</span>
                        <h2 className="text-white text-4xl font-extrabold tracking-tighter drop-shadow-lg">{daysTogether}</h2>
                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Days</p>
                    </div>
                    {loading && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="space-y-6">
                    <div className="glass p-6 rounded-[2.5rem]">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500">blur_on</span>
                            Độ mờ của ảnh (Blur)
                        </h4>
                        <input
                            type="range"
                            min="0"
                            max="30"
                            value={blur}
                            onChange={(e) => setBlur(parseInt(e.target.value))}
                            className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Sắc nét</span>
                            <span>Mơ màng</span>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-[2.5rem]">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500">upload</span>
                            Thay đổi ảnh nền
                        </h4>
                        <label className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center flex flex-col items-center cursor-pointer hover:bg-blue-50/50 transition-colors">
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            <span className="material-symbols-outlined text-4xl text-blue-300 mb-2">add_photo_alternate</span>
                            <p className="text-xs text-slate-400 font-medium">Chọn ảnh kỷ niệm của hai bạn</p>
                        </label>
                    </div>

                    <button
                        onClick={saveBlur}
                        disabled={loading}
                        className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-transform mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Đang xử lý...' : 'Lưu tất cả thay đổi'}
                    </button>
                </div>
            </div>

            <Navbar />
        </div>
    );
};

export default BgSettings;
