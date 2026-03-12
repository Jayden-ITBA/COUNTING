import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, updateDoc, writeBatch, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { generatePairingCode } from '../utils/pairing_utils';
import { getDashboardLabel } from '../utils/ui_helpers';
import Navbar from './Navbar';

const Dashboard = () => {
    const navigate = useNavigate();
    const { profile, couple, partnerProfile, notifications, loading: contextLoading } = useData();
    const [daysTogether, setDaysTogether] = useState(0);
    const [loading, setLoading] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showWaitingAlert, setShowWaitingAlert] = useState(false);

    // New states for confirmation flow
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [senderInfo, setSenderInfo] = useState(null);
    const [activeInviteId, setActiveInviteId] = useState(null);
    const [showReceiverSuccess, setShowReceiverSuccess] = useState(false);

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    useEffect(() => {
        if (couple?.anniversary_date) {
            const anniversary = couple.anniversary_date.toDate ? couple.anniversary_date.toDate() : new Date(couple.anniversary_date);
            const diffTime = Math.abs(new Date() - anniversary);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            setDaysTogether(diffDays);
        }
    }, [couple]);

    // Listener for sender's success modal
    useEffect(() => {
        if (profile?.link_status === 'pending' && profile?.invite_id) {
            const unsubscribe = onSnapshot(doc(db, 'invites', profile.invite_id), (docSnap) => {
                if (docSnap.exists() && docSnap.data().status === 'paired') {
                    setShowSuccessModal(true);
                }
            });
            return () => unsubscribe();
        }
    }, [profile]);

    const handleCreateLink = async () => {
        setLoading(true);
        const inviteId = generatePairingCode();
        try {
            await setDoc(doc(db, 'invites', inviteId), {
                sender_id: auth.currentUser.uid,
                status: 'pending',
                receiver_id: null,
                created_at: serverTimestamp(),
                anniversary_date: serverTimestamp() // Default to today
            });
            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
                link_status: 'pending',
                invite_id: inviteId
            });
        } catch (error) {
            console.error("Create link error:", error);
            alert("Lỗi khi tạo mã!");
        } finally {
            setLoading(false);
            setShowWarning(false);
        }
    };

    const handlePrepareJoin = async (invId) => {
        if (!invId || invId.length !== 6) return;
        setLoading(true);
        try {
            const invSnap = await getDoc(doc(db, 'invites', invId));
            if (!invSnap.exists()) {
                alert("Mã này không tồn tại!");
                return;
            }
            const invData = invSnap.data();
            if (invData.status !== 'pending') {
                alert("Mã này đã được sử dụng!");
                return;
            }
            if (invData.sender_id === auth.currentUser.uid) {
                alert("Bạn không thể tự kết nối!");
                return;
            }

            const senderSnap = await getDoc(doc(db, 'profiles', invData.sender_id));
            if (senderSnap.exists()) {
                setSenderInfo(senderSnap.data());
                setActiveInviteId(invId);
                setShowConfirmModal(true);
            } else {
                alert("Không tìm thấy thông tin người gửi!");
            }
        } catch (error) {
            console.error("Prepare join error:", error);
            alert("Lỗi khi kiểm tra mã!");
        } finally {
            setLoading(false);
        }
    };

    const confirmJoinInvite = async () => {
        if (!activeInviteId || !senderInfo) return;
        setLoading(true);
        try {
            const batch = writeBatch(db);
            const senderUid = senderInfo.uid || senderInfo.id;
            const coupleId = `${senderUid}_${auth.currentUser.uid}`;

            const invSnap = await getDoc(doc(db, 'invites', activeInviteId));
            const anniversary = invSnap.data()?.anniversary_date || serverTimestamp();

            batch.set(doc(db, 'couples', coupleId), {
                uids: [senderUid, auth.currentUser.uid],
                anniversary_date: anniversary,
                created_at: serverTimestamp(),
                background_url: '',
                blur_level: 0
            });

            batch.update(doc(db, 'invites', activeInviteId), {
                status: 'paired',
                receiver_id: auth.currentUser.uid,
                paired_at: serverTimestamp()
            });

            batch.update(doc(db, 'profiles', senderUid), {
                link_status: 'paired',
                partner_id: auth.currentUser.uid,
                couple_id: coupleId
            });

            batch.update(doc(db, 'profiles', auth.currentUser.uid), {
                link_status: 'paired',
                partner_id: senderUid,
                couple_id: coupleId,
                invite_id: activeInviteId
            });

            await batch.commit();
            setShowReceiverSuccess(true);
        } catch (error) {
            console.error("Join error:", error);
            alert("Lỗi khi kết nối: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (contextLoading && !profile) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="bg-neutral-50 flex items-center justify-center min-h-screen antialiased text-neutral-900">
            <main className="w-full max-w-md bg-white min-h-screen sm:min-h-[850px] relative overflow-y-auto sm:border sm:border-neutral-100 sm:rounded-[2.5rem] sm:my-8 shadow-2xl pb-32">
                
                <header className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
                    <div className="font-bold text-[10px] tracking-[0.2em] text-neutral-400 uppercase">OUR LITTLE CORNER</div>
                    <button onClick={() => navigate('/notifications')} className="relative p-2 text-neutral-500">
                        <iconify-icon icon="solar:bell-bing-linear" width="24" height="24"></iconify-icon>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </header>

                {profile?.link_status === 'paired' ? (
                    <div className="px-6 animate-in fade-in duration-700">
                        <div className="flex flex-col items-center mt-12 mb-16">
                            <div className="relative group">
                                <span className="text-8xl font-light tracking-tighter tabular-nums drop-shadow-sm">{daysTogether}</span>
                                <div className="absolute -top-4 -right-6 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg rotate-12 shadow-lg">STREAK</div>
                            </div>
                            <p className="mt-8 text-[11px] font-bold tracking-[0.3em] text-rose-500 uppercase">{getDashboardLabel(profile)}</p>
                        </div>

                        <div className="flex items-center justify-center gap-6 mb-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden">
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Me" />
                                </div>
                                <span className="text-sm font-semibold text-neutral-800">{profile.nickname}</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 animate-pulse">
                                <iconify-icon icon="solar:heart-bold" width="24" height="24"></iconify-icon>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden">
                                    <img src={partnerProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=partner"} className="w-full h-full object-cover" alt="Partner" />
                                </div>
                                <span className="text-sm font-semibold text-neutral-800">{partnerProfile?.nickname || 'Người ấy'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-neutral-50 rounded-[2rem] p-6">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <iconify-icon icon="solar:calendar-linear" width="16" height="16" className="text-neutral-400"></iconify-icon>
                                </div>
                                <p className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase mb-1">Started</p>
                                <p className="text-sm font-bold text-neutral-800">
                                    {couple?.anniversary_date ? (couple.anniversary_date.toDate ? couple.anniversary_date.toDate() : new Date(couple.anniversary_date)).toLocaleDateString('vi-VN') : '---'}
                                </p>
                            </div>
                            <div className="bg-rose-50/50 rounded-[2rem] p-6 border border-rose-100/50">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-rose-400">
                                    <iconify-icon icon="solar:star-bold" width="16" height="16"></iconify-icon>
                                </div>
                                <p className="text-[10px] font-bold text-rose-400 tracking-widest uppercase mb-1">Milestone</p>
                                <p className="text-sm font-bold text-rose-500">{(Math.floor(daysTogether / 100) + 1) * 100} Ngày</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-neutral-800 px-2">Sự kiện sắp tới</h3>
                            {partnerProfile?.birthday && (
                                <div className="bg-white border border-neutral-100 rounded-3xl p-4 flex items-center gap-4 hover:border-rose-200 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex flex-col items-center justify-center">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase">{new Date(partnerProfile.birthday).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-sm font-black text-neutral-800">{new Date(partnerProfile.birthday).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-neutral-800">Sinh nhật {partnerProfile.nickname}</p>
                                        <p className="text-[10px] text-neutral-400">Đừng quên nha !!</p>
                                    </div>
                                    <iconify-icon icon="solar:alt-arrow-right-linear" width="20" height="20" className="text-neutral-200"></iconify-icon>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="px-8 py-12 flex flex-col gap-8 min-h-[70vh] justify-center text-center animate-in slide-in-from-bottom-8 duration-700">
                        {profile?.invite_id && (
                            <div className="bg-rose-50/50 border border-rose-100 rounded-[3rem] p-10">
                                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-6">Mã mời của bạn</p>
                                <h2 className="text-5xl font-black text-rose-500 tracking-[0.2em] font-mono mb-8">{profile.invite_id}</h2>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(profile.invite_id);
                                        setShowWaitingAlert(true);
                                    }}
                                    className="w-full bg-white text-rose-500 font-bold py-4 rounded-full shadow-lg shadow-rose-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm"
                                >
                                    <iconify-icon icon="solar:copy-bold" width="20" height="20"></iconify-icon>
                                    SAO CHÉP MÃ
                                </button>
                            </div>
                        )}

                        {!profile?.invite_id && (
                            <div className="p-8 border-2 border-dashed border-neutral-100 rounded-[3rem]">
                                <iconify-icon icon="solar:link-break-linear" width="48" height="48" className="text-neutral-200 mb-6"></iconify-icon>
                                <h3 className="text-xl font-bold text-neutral-800 mb-2">Chưa có mã kết nối</h3>
                                <button onClick={() => setShowWarning(true)} className="mt-4 bg-neutral-900 text-white font-bold px-8 py-4 rounded-full shadow-xl">Tạo mã ngay</button>
                            </div>
                        )}

                        <div className="relative h-px bg-neutral-100 w-24 mx-auto my-4">
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[10px] font-black text-neutral-200 uppercase tracking-widest">HOẶC</span>
                        </div>

                        <div className="bg-neutral-50 rounded-[3rem] p-10 border border-neutral-100">
                            <h3 className="text-base font-bold text-neutral-800 mb-6">Nhập mã từ nửa kia</h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Ví dụ: AB12CD"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                    className="flex-1 bg-white border-2 border-transparent focus:border-rose-200 rounded-3xl px-6 py-5 text-center font-mono font-black text-xl text-neutral-700 outline-none transition-all shadow-sm"
                                    maxLength={6}
                                />
                                <button
                                    onClick={() => handlePrepareJoin(manualCode)}
                                    disabled={manualCode.length !== 6 || loading}
                                    className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all ${manualCode.length === 6 ? 'bg-neutral-900 text-white scale-100' : 'bg-neutral-200 text-white scale-95 opacity-50'}`}
                                >
                                    <iconify-icon icon="solar:arrow-right-bold" width="24" height="24"></iconify-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {showWaitingAlert && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white rounded-[3.5rem] p-10 w-full max-w-sm shadow-2xl text-center">
                            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse text-rose-500">
                                <iconify-icon icon="solar:heart-angle-bold" width="48" height="48"></iconify-icon>
                            </div>
                            <h2 className="text-2xl font-black text-neutral-800 mb-4 tracking-tighter uppercase">Tik Tik Tik</h2>
                            <p className="text-sm text-neutral-500 font-medium leading-[1.8] mb-10 text-center px-4">
                                Tín hiệu đã được gửi đến tình yêu của bạn. <br/> Đợi chờ là hạnh phúc !!! <br/><br/>
                                <span className="italic font-bold text-rose-500 tracking-tighter text-base">Những điều tốt đẹp thường đến muộn, đợi tý nha !!!</span>
                            </p>
                            <button onClick={() => setShowWaitingAlert(false)} className="w-full bg-neutral-900 text-white font-black py-5 rounded-full shadow-xl shadow-neutral-200 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">Đã rõ hơ hơ</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showConfirmModal && senderInfo && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[3.5rem] p-10 w-full max-w-sm shadow-2xl text-center">
                            <div className="w-24 h-24 rounded-full border-4 border-rose-100 overflow-hidden mx-auto mb-8 shadow-xl">
                                <img src={senderInfo.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=partner"} alt={senderInfo.nickname} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-xl font-black text-neutral-800 mb-2">Kết nối với {senderInfo.nickname}?</h3>
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-8">⚠️ Ghép đôi vĩnh viễn</p>
                            
                            <div className="bg-orange-50/50 rounded-3xl p-6 mb-8 text-left">
                                <p className="text-xs text-orange-700 leading-relaxed font-medium">Tìm được nhau là duyên phận. Chắc chắn đây là "nửa kia" của bạn rồi chứ ?</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button onClick={confirmJoinInvite} disabled={loading} className="w-full bg-neutral-900 text-white font-black py-5 rounded-full shadow-xl active:scale-95 transition-all text-xs tracking-widest uppercase">{loading ? 'Đang cập bến...' : 'Đặt bút ký đơn'}</button>
                                <button onClick={() => setShowConfirmModal(false)} className="w-full py-4 text-neutral-400 font-bold text-xs uppercase tracking-widest">Hủy bỏ</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showReceiverSuccess && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-rose-500/90 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[4rem] p-12 w-full max-w-md shadow-2xl text-center">
                            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-10 text-rose-500 animate-bounce">
                                <iconify-icon icon="solar:stars-bold" width="64" height="64"></iconify-icon>
                            </div>
                            <h2 className="text-4xl font-black text-neutral-800 mb-4 tracking-tighter">CHÚC MỪNG</h2>
                            <p className="text-lg text-neutral-500 mb-12 font-medium">Bạn chuẩn bị lên xe bông với tình yêu của mình. <br/> Hãy đợi xe tới nhé {'<3 <3'}</p>
                            <button onClick={() => window.location.reload()} className="w-full bg-neutral-900 text-white font-black py-6 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">Lên xe nào</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-blue-500/90 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[4rem] p-12 w-full max-w-md shadow-2xl text-center">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-10 text-blue-500 animate-bounce">
                                <iconify-icon icon="solar:magic-stick-3-bold" width="64" height="64"></iconify-icon>
                            </div>
                            <h2 className="text-4xl font-black text-neutral-800 mb-4 tracking-tighter">CHÚC MỪNG</h2>
                            <p className="text-lg text-neutral-500 mb-12 font-medium">Tình yêu đời bạn đã tìm thấy được bạn!!</p>
                            <button onClick={() => window.location.reload()} className="w-full bg-neutral-900 text-white font-black py-6 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">Bắt đầu ngay</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showWarning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                                <iconify-icon icon="solar:danger-triangle-linear" width="32" height="32" className="text-orange-500"></iconify-icon>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Lưu ý quan trọng</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-8">Bạn chỉ có thể kết nối với **một người duy nhất**. Khi người ấy xác nhận, mối liên kết này sẽ không thể thay đổi.</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleCreateLink} className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/20">Tôi đã hiểu và tiếp tục</button>
                                <button onClick={() => setShowWarning(false)} className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-full">Hủy bỏ</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Navbar profile={profile} />
        </div>
    );
};

export default Dashboard;
