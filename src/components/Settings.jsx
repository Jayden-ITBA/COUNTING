import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';

const Settings = () => {
  const navigate = useNavigate();
  const { profile, loading } = useData();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const SettingsItem = ({ icon, label, onClick, color = "text-primary", subtitle }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-6 bg-white active:bg-blue-50/50 transition-all border-b border-blue-50/50 last:border-0 group"
    >
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl ${color.replace('text', 'bg')}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <iconify-icon icon={icon} width="28" height="28" class={color}></iconify-icon>
        </div>
        <div className="text-left">
          <p className="font-black text-slate-800 tracking-tight text-lg">{label}</p>
          {subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
        </div>
      </div>
      <iconify-icon icon="solar:alt-arrow-right-bold-duotone" width="24" height="24" class="text-slate-300 group-hover:text-primary transition-colors"></iconify-icon>
    </button>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8faff] pb-32 font-sans">
      <div className="p-8 pt-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Cài Đặt</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Personalize your space</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100/50 border border-blue-50"
          >
            <iconify-icon icon="solar:close-circle-bold-duotone" width="24" height="24" class="text-slate-400"></iconify-icon>
          </button>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white rounded-[3rem] p-8 mb-10 shadow-xl shadow-blue-100/30 border border-blue-50 flex items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="w-20 h-20 rounded-[2rem] bg-blue-50 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <iconify-icon icon="solar:user-bold-duotone" width="40" height="40" class="text-primary"></iconify-icon>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{profile?.nickname || 'Người dùng'}</h2>
            <p className="text-[11px] text-primary font-black uppercase tracking-widest mt-1">Hội viên cao cấp ✨</p>
          </div>
          <button 
            onClick={() => navigate('/settings/profile')}
            className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            <iconify-icon icon="solar:pen-new-square-bold-duotone" width="22" height="22"></iconify-icon>
          </button>
        </div>

        <div className="space-y-10">
          <div className="bg-white rounded-[3rem] shadow-xl shadow-blue-100/20 border border-blue-50 overflow-hidden">
            <SettingsItem 
              icon="solar:palette-bold-duotone" 
              label="Giao diện & Hình nền" 
              subtitle="Tùy chỉnh không gian riêng"
              onClick={() => navigate('/settings/background')} 
            />
            <SettingsItem 
              icon="solar:bell-bing-bold-duotone" 
              label="Thông báo & Âm thanh" 
              subtitle="Không bỏ lỡ những lời yêu"
              onClick={() => navigate('/settings/notifications')} 
            />
            <SettingsItem 
              icon="solar:shield-keyhole-bold-duotone" 
              label="Bảo mật & Quyền riêng tư" 
              subtitle="Khóa ứng dụng, Passcode"
              onClick={() => navigate('/settings/security')} 
            />
          </div>

          <div className="bg-white rounded-[3rem] shadow-xl shadow-blue-100/20 border border-blue-50 overflow-hidden">
            <SettingsItem 
              icon="solar:widget-add-bold-duotone" 
              label="Tiện ích Widgets" 
              subtitle="Đưa tình yêu ra màn hình chính"
              onClick={() => navigate('/settings/widgets')} 
            />
            <SettingsItem 
              icon="solar:info-circle-bold-duotone" 
              label="Về ứng dụng" 
              subtitle="Phiên bản 2.4.0 • Pro"
              onClick={() => {}} 
            />
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-slate-50 text-slate-400 font-bold py-6 rounded-[2.5rem] flex items-center justify-center gap-3 hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100 group"
          >
            <iconify-icon icon="solar:logout-bold-duotone" width="24" height="24" class="group-hover:translate-x-1 transition-transform"></iconify-icon>
            <span className="uppercase tracking-[0.2em] text-[11px]">Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[4rem] p-10 text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-500">
                <iconify-icon icon="solar:exit-bold-duotone" width="48" height="48"></iconify-icon>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Xác nhận đăng xuất?</h3>
              <p className="text-slate-400 font-bold text-sm mb-10">Cửa trái tim sẽ tạm khóa lại cho đến khi bạn quay lại.</p>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 text-white font-black py-5 rounded-full shadow-lg shadow-red-200 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-[11px]"
                >
                  Đăng xuất ngay
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-slate-50 text-slate-400 font-black py-5 rounded-full hover:bg-slate-100 active:scale-95 transition-all uppercase tracking-widest text-[11px]"
                >
                  Ở lại thêm chút nữa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Navbar />
    </div>
  );
};

export default Settings;
