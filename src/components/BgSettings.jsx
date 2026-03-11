import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDashboardLabel } from '../utils/ui_helpers';
import { uploadMedia } from '../services/cloudinary';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const BgSettings = ({ profile }) => {
    const navigate = useNavigate();
    const [blur, setBlur] = useState(12);
    const [currentBg, setCurrentBg] = useState('https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=2000');
    const [loading, setLoading] = useState(false);
    const [daysTogether, setDaysTogether] = useState(0);

    const calculateDays = (anniversaryDate) => {
        if (!anniversaryDate) return;
        const anniversary = anniversaryDate.toDate ? anniversaryDate.toDate() : new Date(anniversaryDate);
        const diffDays = Math.floor(Math.abs(new Date() - anniversary) / (1000 * 60 * 60 * 24));
        setDaysTogether(diffDays);
    };

    useEffect(() => {
        if (profile?.couple_id) {
            const unsubscribe = onSnapshot(doc(db, 'couples', profile.couple_id), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.background_url) setCurrentBg(data.background_url);
                    if (data.blur_level !== undefined) setBlur(data.blur_level);
                    calculateDays(data.anniversary_date);
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
        } catch (error) {
            alert("Lỗi khi lưu: " + error.message);
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
                <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Tùy chỉnh giao diện</h2>
                <div className="w-10"></div>
            </header>

            <main className="max-w-lg mx-auto px-4 pb-12">
                {/* Preview Area */}
                <section className="py-6">
                    <div className="relative aspect-[9/16] w-full max-w-[200px] mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                            style={{
                                backgroundImage: `url(${currentBg})`,
                                filter: `blur(${blur}px) brightness(0.9)`
                            }}
                        />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center p-4">
                            <h2 className="text-white text-4xl font-extrabold tracking-tighter drop-shadow-lg">{daysTogether}</h2>
                            <p className="text-[8px] font-bold text-blue-100 uppercase tracking-[0.2em] mt-2">
                                {getDashboardLabel(profile)}
                            </p>
                        </div>
                        {loading && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </section>

                <div className="space-y-6">
                    {/* Background Picker */}
                    <div className="bg-white/60 backdrop-blur-md border border-blue-100/20 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-slate-800 text-sm font-bold leading-tight tracking-tight">Hình nền của chúng mình</h4>
                            <label className="text-blue-400 text-xs font-bold hover:underline cursor-pointer">
                                Thêm mới
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors group">
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                <span className="material-symbols-outlined text-blue-300 group-hover:scale-110 transition-transform">add_a_photo</span>
                            </label>
                            {/* Preset images could go here, or just show the current one */}
                            <div className="aspect-[3/4] rounded-xl bg-cover bg-center ring-2 ring-blue-400" style={{ backgroundImage: `url(${currentBg})` }}></div>
                        </div>
                    </div>

                    {/* Opacity/Blur Slider */}
                    <div className="bg-white/60 backdrop-blur-md border border-blue-100/20 rounded-3xl p-6 shadow-sm">
                        <h4 className="text-slate-800 text-sm font-bold mb-4">Độ mờ Dashboard</h4>
                        <div className="space-y-4">
                            <input
                                type="range"
                                min="0"
                                max="30"
                                value={blur}
                                onChange={(e) => setBlur(parseInt(e.target.value))}
                                onMouseUp={saveBlur}
                                onTouchEnd={saveBlur}
                                className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-blue-400 uppercase tracking-widest px-1">
                                <span>Sắc nét</span>
                                <span>Mờ ảo</span>
                            </div>
                        </div>
                    </div>

                    {/* Widget Styles - Link to Widgets page */}
                    <div 
                        onClick={() => navigate('/settings/widgets')}
                        className="bg-white/60 backdrop-blur-md border border-blue-100/20 rounded-3xl p-6 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                    >
                        <div>
                            <h4 className="text-slate-800 text-sm font-bold leading-tight tracking-tight">Kiểu Widget</h4>
                            <p className="text-blue-400/80 text-xs mt-1">Chọn phong cách hiển thị kỷ niệm</p>
                        </div>
                        <span className="material-symbols-outlined text-blue-400">chevron_right</span>
                    </div>
                </div>

                <div className="mt-8">
                    <button 
                        onClick={() => navigate('/settings')}
                        className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                    >
                        Hoàn tất
                    </button>
                </div>
            </main>

            <Navbar profile={profile} />
        </div>
    );
};

export default BgSettings;
