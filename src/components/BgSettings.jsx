import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getDashboardLabel } from '../utils/ui_helpers';
import { uploadMedia } from '../services/cloudinary';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';

const BgSettings = () => {
    const { profile, couple, refreshData } = useData();
    const navigate = useNavigate();
    const [blur, setBlur] = useState(couple?.blur_level || 12);
    const [loading, setLoading] = useState(false);
    const [daysTogether, setDaysTogether] = useState(0);

    const calculateDays = (anniversaryDate) => {
        if (!anniversaryDate) return;
        const anniversary = anniversaryDate.toDate ? anniversaryDate.toDate() : new Date(anniversaryDate);
        const diffTime = Math.abs(new Date() - anniversary);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setDaysTogether(diffDays);
    };

    useEffect(() => {
        if (couple?.anniversary_date) {
            calculateDays(couple.anniversary_date);
        }
        if (couple?.blur_level !== undefined) {
            setBlur(couple.blur_level);
        }
    }, [couple]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !profile?.couple_id) return;

        setLoading(true);
        try {
            const url = await uploadMedia(file);
            await updateDoc(doc(db, 'couples', profile.couple_id), {
                background_url: url
            });
            await refreshData();
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
            await refreshData();
        } catch (error) {
            alert("Lỗi khi lưu: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const currentBg = couple?.background_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=2000';

    return (
        <div className="relative min-h-screen bg-[#f8faff] pb-32 font-sans">
            <header className="flex items-center justify-between p-6 sticky top-0 bg-[#f8faff]/80 backdrop-blur-md z-10 border-b border-blue-50">
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100/50 border border-blue-50"
                >
                  <iconify-icon icon="solar:arrow-left-bold-duotone" width="24" height="24" class="text-slate-400"></iconify-icon>
                </button>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Giao diện & Hình nền</h1>
                <div className="w-12" />
            </header>

            <main className="px-6 mt-8 space-y-10">
                {/* Preview Area */}
                <section className="flex flex-col items-center">
                    <div className="relative aspect-[9/16] w-full max-w-[220px] rounded-[3.5rem] overflow-hidden shadow-2xl ring-8 ring-white">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out"
                            style={{
                                backgroundImage: `url(${currentBg})`,
                                filter: `blur(${blur}px) brightness(0.8)`
                            }}
                        />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center p-6 bg-black/5">
                            <h2 className="text-white text-5xl font-black tracking-tighter drop-shadow-2xl italic">{daysTogether}</h2>
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] mt-3 drop-shadow-md">
                                {getDashboardLabel(profile)}
                            </p>
                        </div>
                        {loading && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest mt-6">Xem trước Dashboard</p>
                </section>

                <div className="space-y-8">
                    {/* Background Picker */}
                    <div className="bg-white rounded-[3.5rem] p-8 shadow-xl shadow-blue-100/20 border border-blue-50">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <iconify-icon icon="solar:gallery-bold-duotone" width="24" height="24" class="text-primary"></iconify-icon>
                                <h4 className="text-slate-800 text-sm font-black uppercase tracking-widest">Hình nền kỷ niệm</h4>
                            </div>
                            <label className="bg-blue-50 text-primary px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-white transition-all">
                                THAY ĐỔI
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                        <div className="grid grid-cols-3 gap-5">
                            <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-blue-100 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50/50 transition-all group overflow-hidden">
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                <iconify-icon icon="solar:camera-add-bold" width="32" height="32" class="text-blue-100 group-hover:text-primary transition-colors"></iconify-icon>
                            </label>
                            <div className="aspect-[3/4] col-span-2 rounded-[2.5rem] bg-cover bg-center ring-4 ring-blue-50 shadow-inner relative overflow-hidden" 
                                style={{ backgroundImage: `url(${currentBg})` }}>
                                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]"></div>
                                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/50 shadow-sm">
                                    <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest">ĐANG DÙNG</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Opacity/Blur Slider */}
                    <div className="bg-white rounded-[3.5rem] p-10 shadow-xl shadow-blue-100/20 border border-blue-50">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                                <iconify-icon icon="solar:mask-haze-bold-duotone" width="28" height="28"></iconify-icon>
                            </div>
                            <div>
                                <h4 className="text-slate-800 text-sm font-black uppercase tracking-widest">Độ mờ Dashboard</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Làm nổi bật kỷ niệm</p>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="relative pt-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    value={blur}
                                    onChange={(e) => setBlur(parseInt(e.target.value))}
                                    onMouseUp={saveBlur}
                                    onTouchEnd={saveBlur}
                                    className="w-full h-2 bg-blue-50 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                                />
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 transition-opacity pointer-events-none group-active:opacity-100 shadow-xl">
                                    {blur} PX
                                </div>
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
                                <span className="flex items-center gap-2">
                                    <iconify-icon icon="solar:eye-bold-duotone" width="14" height="14"></iconify-icon>
                                    Cực nét
                                </span>
                                <span className="flex items-center gap-2">
                                    Mờ ảo
                                    <iconify-icon icon="solar:eye-closed-bold-duotone" width="14" height="14"></iconify-icon>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                  <button 
                      onClick={() => navigate('/settings')}
                      className="w-full bg-primary text-white font-black py-5 rounded-full shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-[11px]"
                  >
                      Xác nhận thay đổi
                  </button>
                </div>
            </main>

            <Navbar />
        </div>
    );
};

export default BgSettings;
