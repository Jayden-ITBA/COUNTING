import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadMedia } from '../services/cloudinary';
import Navbar from './Navbar';

const ProfileSettings = ({ profile, onUpdate }) => {
    const [nickname, setNickname] = useState(profile?.nickname || '');
    const [birthday, setBirthday] = useState(profile?.birthday || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadMedia(file);
            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
                avatar_url: url
            });
            onUpdate();
        } catch (error) {
            alert("Lỗi khi tải ảnh: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
                nickname,
                birthday
            });
            alert("Đã cập nhật thông tin!");
            onUpdate();
        } catch (error) {
            alert("Lỗi khi cập nhật: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-slate-800">Thông tin cá nhân</h1>
                <p className="text-slate-500 text-sm">Chỉnh sửa hồ sơ của bạn</p>
            </div>

            <div className="px-6 space-y-6">
                <div className="flex flex-col items-center py-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100">
                            {uploading ? (
                                <div className="w-full h-full flex items-center justify-center bg-black/10">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <img src={profile?.avatar_url || "/api/placeholder/100/100"} alt="Avatar" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white cursor-pointer shadow-lg active:scale-90 transition-transform">
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            <span className="material-symbols-outlined text-sm">photo_camera</span>
                        </label>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Chạm để đổi ảnh</p>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="glass p-6 rounded-[2.5rem] space-y-4">
                        <div className="text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">Biệt danh</label>
                            <input
                                required
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">Ngày sinh</label>
                            <input
                                required
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading || uploading}
                        className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </form>
            </div>

            <Navbar profile={profile} />
        </div>
    );
};

export default ProfileSettings;
