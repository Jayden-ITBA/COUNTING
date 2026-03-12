import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadMedia } from '../services/cloudinary';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';

const ProfileSettings = () => {
    const { profile, refreshData } = useData();
    const navigate = useNavigate();
    const [nickname, setNickname] = useState(profile?.nickname || '');
    const [birthday, setBirthday] = useState(profile?.birthday || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    const [dashboardLabel, setDashboardLabel] = useState(profile?.dashboard_label || '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setNickname(profile.nickname || '');
            setBirthday(profile.birthday || '');
            setAvatarUrl(profile.avatar_url || '');
            setDashboardLabel(profile.dashboard_label || '');
        }
    }, [profile]);

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
            await refreshData();
            navigate('/settings');
        } catch (error) {
            console.error("Save Error:", error);
            alert("Lỗi khi lưu thông tin!");
        } finally {
            setSaving(false);
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
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Hồ sơ cá nhân</h1>
                <button 
                  onClick={handleSave} 
                  disabled={saving || uploading} 
                  className="w-12 h-12"
                >
                    <p className="text-primary text-sm font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
                        {saving ? "..." : "Lưu"}
                    </p>
                </button>
            </header>

            <main className="px-6 mt-8 space-y-10">
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[3rem] bg-white shadow-2xl shadow-blue-100/50 border-4 border-white overflow-hidden flex items-center justify-center">
                            {uploading ? (
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <img src={avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + nickname} className="w-full h-full object-cover" alt="Avatar" />
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white cursor-pointer hover:scale-110 transition-all">
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            <iconify-icon icon="solar:camera-bold" width="20" height="20"></iconify-icon>
                        </label>
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] p-10 shadow-xl shadow-blue-100/20 border border-blue-50 space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Biệt danh</label>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                          <iconify-icon icon="solar:user-bold-duotone" width="20" height="20"></iconify-icon>
                        </div>
                        <input
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="w-full bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-100 rounded-2xl py-4 pl-12 pr-4 text-slate-800 font-bold transition-all outline-none"
                          placeholder="Nhập biệt danh của bạn"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ngày sinh nhật</label>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                          <iconify-icon icon="solar:calendar-bold-duotone" width="20" height="20"></iconify-icon>
                        </div>
                        <input
                          type="date"
                          value={birthday}
                          onChange={(e) => setBirthday(e.target.value)}
                          className="w-full bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-100 rounded-2xl py-4 pl-12 pr-4 text-slate-800 font-bold transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nhãn Dashboard</label>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                          <iconify-icon icon="solar:heart-bold-duotone" width="20" height="20"></iconify-icon>
                        </div>
                        <input
                          type="text"
                          value={dashboardLabel}
                          onChange={(e) => setDashboardLabel(e.target.value)}
                          className="w-full bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-100 rounded-2xl py-4 pl-12 pr-4 text-slate-800 font-bold transition-all outline-none"
                          placeholder="Nhãn hiển thị..."
                        />
                      </div>
                    </div>
                </div>

                <div className="space-y-4">
                  <button
                      onClick={handleSave}
                      disabled={saving || uploading}
                      className="w-full bg-primary text-white font-black py-5 rounded-full shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-[11px]"
                  >
                      {saving ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
                  </button>
                  <button 
                      onClick={() => navigate('/settings')}
                      className="w-full bg-white text-slate-400 font-black py-5 rounded-full border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all uppercase tracking-widest text-[10px]"
                  >
                      Hủy thay đổi
                  </button>
                </div>
            </main>
            <Navbar />
        </div>
    );
};

export default ProfileSettings;
