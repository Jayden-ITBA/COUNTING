import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadMedia } from '../services/cloudinary';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const ProfileSettings = ({ profile, onUpdate }) => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState(profile?.nickname || '');
    const [birthday, setBirthday] = useState(profile?.birthday || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    const [dashboardLabel, setDashboardLabel] = useState(profile?.dashboard_label || '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadMedia(file);
            setAvatarUrl(url);
        } catch (error) {
            alert("Lỗi tải ảnh!");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
                nickname,
                birthday,
                avatar_url: avatarUrl,
                dashboard_label: dashboardLabel.trim() || null
            });
            onUpdate();
            navigate('/settings');
        } catch (error) {
            console.error("Save Error:", error);
            alert("Lỗi khi lưu thông tin!");
        } finally {
            setSaving(false);
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
                <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Thông tin cá nhân</h2>
                <button onClick={handleSave} disabled={saving} className="flex w-10 items-center justify-end">
                    <p className="text-blue-400 text-base font-bold leading-normal tracking-wide hover:opacity-80 transition-opacity">
                        {saving ? "..." : "Lưu"}
                    </p>
                </button>
            </header>

            <main className="max-w-lg mx-auto w-full px-4 pb-12">
                <section className="flex py-8">
                    <div className="flex w-full flex-col gap-6 items-center">
                        <div className="flex gap-4 flex-col items-center">
                            <div className="relative group">
                                <div 
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32 ring-4 ring-blue-100 shadow-xl overflow-hidden bg-white flex items-center justify-center"
                                >
                                    {uploading ? (
                                        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <img src={avatarUrl || "/api/placeholder/128/128"} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <label className="absolute bottom-1 right-1 bg-blue-500 text-white p-2 rounded-full shadow-lg border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                                </label>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <h3 className="text-slate-900 text-xl font-bold leading-tight text-center">Ảnh của bạn</h3>
                                <p className="text-blue-400 text-sm font-normal leading-normal text-center">Nơi lưu giữ nét đẹp riêng của bạn</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="bg-white/60 backdrop-blur-md border border-blue-100/20 rounded-3xl p-6 space-y-6 shadow-sm">
                    <h4 className="text-slate-800 text-base font-bold leading-tight tracking-tight border-b border-blue-100 pb-3">Chi tiết tài khoản</h4>
                    
                    <div className="space-y-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-600 text-sm font-medium px-1">Biệt danh</label>
                            <div className="bg-white flex w-full items-center rounded-xl border border-blue-100 focus-within:border-blue-300 transition-all">
                                <input 
                                    className="flex w-full border-none bg-transparent h-12 text-slate-900 focus:ring-0 px-4 text-base font-normal"
                                    placeholder="Nhập biệt danh của bạn"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                />
                                <div className="text-blue-300 pr-4">
                                    <span className="material-symbols-outlined">favorite</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-slate-600 text-sm font-medium px-1">Ngày sinh</label>
                            <div className="bg-white flex w-full items-center rounded-xl border border-blue-100 focus-within:border-blue-300 transition-all">
                                <input 
                                    className="flex w-full border-none bg-transparent h-12 text-slate-900 focus:ring-0 px-4 text-base font-normal"
                                    type="date"
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                />
                                <div className="text-blue-300 pr-4">
                                    <span className="material-symbols-outlined">wb_sunny</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-slate-600 text-sm font-medium px-1">Nhãn Dashboard</label>
                            <div className="bg-white flex w-full items-center rounded-xl border border-blue-100 focus-within:border-blue-300 transition-all">
                                <input 
                                    className="flex w-full border-none bg-transparent h-12 text-slate-900 focus:ring-0 px-4 text-base font-normal"
                                    placeholder="Tên hiển thị trên Dashboard"
                                    value={dashboardLabel}
                                    onChange={(e) => setDashboardLabel(e.target.value)}
                                />
                                <div className="text-blue-300 pr-4">
                                    <span className="material-symbols-outlined">label_important</span>
                                </div>
                            </div>
                            <p className="text-xs text-blue-400/70 px-1 italic">* Tên này sẽ xuất hiện trên màn hình chính của ứng dụng.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 px-2 space-y-4">
                    <button 
                        onClick={handleSave}
                        disabled={saving || uploading}
                        className="w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                    >
                        {saving ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
                    </button>
                    <button 
                        onClick={() => navigate('/settings')}
                        className="w-full bg-transparent border-2 border-blue-200 text-blue-400 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors"
                    >
                        Hủy thay đổi
                    </button>
                </div>
                <div className="h-12"></div>
            </main>

            <Navbar profile={profile} />
        </div>
    );
};

export default ProfileSettings;
