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
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="bg-[#f8faff] flex items-center justify-center min-h-screen antialiased text-slate-800 font-sans">
            <main className="w-full max-w-md bg-white min-h-screen sm:min-h-[850px] relative overflow-y-auto sm:border sm:border-blue-50 sm:rounded-[3.5rem] sm:my-8 shadow-2xl shadow-blue-100/30 pb-32">
                
                <header className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                    <div className="font-black text-[10px] tracking-[0.4em] text-slate-400 uppercase">OUR LITTLE CORNER</div>
                    <button onClick={() => navigate('/notifications')} className="relative w-12 h-12 bg-blue-50/50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                        <iconify-icon icon="solar:bell-bing-bold-duotone" width="24" height="24"></iconify-icon>
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </header>

                {profile?.link_status === 'paired' ? (
                    <div className="px-6 animate-in fade-in duration-700">
                        <div className="flex flex-col items-center mt-12 mb-16">
                            <div className="relative group">
                                <span className="text-8xl font-black tracking-tighter tabular-nums drop-shadow-sm text-slate-800">{daysTogether}</span>
                                <div className="absolute -top-4 -right-8 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-xl rotate-12 shadow-lg shadow-blue-200 uppercase tracking-widest">STREAK</div>
                            </div>
                            <p className="mt-10 text-[10px] font-black tracking-[0.4em] text-primary uppercase">{getDashboardLabel(profile)}</p>
                        </div>

                        <div className="flex items-center justify-center gap-8 mb-16">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-22 h-22 rounded-[2.5rem] border-4 border-white shadow-xl shadow-blue-100/50 overflow-hidden bg-blue-50">
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Me" />
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{profile.nickname}</span>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary shadow-lg shadow-blue-100/50 animate-pulse">
                                <iconify-icon icon="solar:heart-bold-duotone" width="28" height="28"></iconify-icon>
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-22 h-22 rounded-[2.5rem] border-4 border-white shadow-xl shadow-blue-100/50 overflow-hidden bg-blue-50">
                                    <img src={partnerProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=partner"} className="w-full h-full object-cover" alt="Partner" />
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{partnerProfile?.nickname || 'Người ấy'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 mb-10">
                            <div className="bg-slate-50 rounded-[2.5rem] p-7 border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-5 text-slate-300">
                                    <iconify-icon icon="solar:calendar-bold-duotone" width="20" height="20"></iconify-icon>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1.5">Ngày bắt đầu</p>
                                <p className="text-sm font-black text-slate-800">
                                    {couple?.anniversary_date ? (couple.anniversary_date.toDate ? couple.anniversary_date.toDate() : new Date(couple.anniversary_date)).toLocaleDateString('vi-VN') : '---'}
                                </p>
                            </div>
                            <div className="bg-blue-50/50 rounded-[2.5rem] p-7 border border-blue-100/50">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-5 text-primary">
                                    <iconify-icon icon="solar:star-bold-duotone" width="20" height="20"></iconify-icon>
                                </div>
                                <p className="text-[9px] font-black text-primary/60 tracking-widest uppercase mb-1.5">Mốc kỷ niệm</p>
                                <p className="text-sm font-black text-primary">{(Math.floor(daysTogether / 100) + 1) * 100} Ngày</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Sự kiện sắp tới</h3>
                                <iconify-icon icon="solar:add-circle-bold-duotone" width="20" height="20" class="text-slate-300"></iconify-icon>
                            </div>
                            {partnerProfile?.birthday && (
                                <div className="bg-white border border-blue-50 rounded-[2.5rem] p-5 flex items-center gap-5 hover:border-primary/30 transition-all cursor-pointer shadow-sm shadow-blue-100/10">
                                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-primary">
                                        <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">{new Date(partnerProfile.birthday).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-base font-black leading-none mt-0.5">{new Date(partnerProfile.birthday).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">Sinh nhật của {partnerProfile.nickname}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Đừng quên tạo bất ngờ nha!</p>
                                    </div>
                                    <iconify-icon icon="solar:alt-arrow-right-bold" width="24" height="24" className="text-slate-100"></iconify-icon>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="px-8 py-12 flex flex-col gap-10 min-h-[75vh] justify-center text-center animate-in slide-in-from-bottom-8 duration-700">
                        {profile?.invite_id && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-[3.5rem] p-10 shadow-xl shadow-blue-100/20">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-8">Mã mời của bạn</p>
                                <div className="bg-white rounded-3xl py-8 px-4 border border-blue-100/50 shadow-inner mb-10">
                                    <h2 className="text-5xl font-black text-blue-600 tracking-[0.25em] font-mono">{profile.invite_id.toUpperCase()}</h2>
                                </div>
                                {profile.invite_id.length !== 6 && (
                                    <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight mb-3">Mã mời không đúng 6 ký tự</p>
                                        <button 
                                            onClick={() => setShowWarning(true)}
                                            className="text-[11px] font-black text-amber-700 underline uppercase tracking-widest"
                                        >
                                            Tạo lại mã chuẩn (6 ký tự)
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(profile.invite_id.toUpperCase());
                                        setShowWaitingAlert(true);
                                    }}
                                    className="w-full bg-blue-500 text-white font-black py-5 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all text-[11px] uppercase tracking-widest"
                                >
                                    <iconify-icon icon="solar:copy-bold-duotone" width="20" height="20"></iconify-icon>
                                    SAO CHÉP MÃ GỬI NGƯỜI ẤY
                                </button>
                            </div>
                        )}

                        {!profile?.invite_id && (
                            <div className="p-12 border-2 border-dashed border-blue-100 rounded-[3.5rem] bg-slate-50/50">
                                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm text-slate-200">
                                    <iconify-icon icon="solar:link-broken-bold-duotone" width="48" height="48"></iconify-icon>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight">Chưa kết nối</h3>
                                <p className="text-xs text-slate-400 font-bold mb-8 uppercase tracking-widest">Hãy bắt đầu hành trình của hai bạn</p>
                                <button onClick={() => setShowWarning(true)} className="bg-primary text-white font-black px-10 py-5 rounded-full shadow-lg shadow-blue-200 hover:brightness-110 transition-all text-xs uppercase tracking-widest">Tạo mã kết nối</button>
                            </div>
                        )}

                        <div className="relative h-px bg-slate-100 w-24 mx-auto my-4 text-center flex items-center justify-center">
                            <span className="bg-[#f8faff] px-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] whitespace-nowrap">HOẶC</span>
                        </div>

                        <div className="bg-white rounded-[3.5rem] p-10 border border-blue-50 shadow-xl shadow-blue-100/10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Nhập mã từ nửa kia</h3>
                            <div className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    placeholder="AB12CD"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-200 focus:bg-white rounded-3xl px-6 py-6 text-center font-mono font-black text-2xl text-slate-800 outline-none transition-all shadow-inner"
                                    maxLength={6}
                                />
                                <button
                                    onClick={() => handlePrepareJoin(manualCode)}
                                    disabled={manualCode.length !== 6 || loading}
                                    className={`w-full py-5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${manualCode.length === 6 ? 'bg-slate-900 text-white shadow-slate-200 translate-y-0' : 'bg-slate-100 text-slate-300 shadow-none translate-y-1'}`}
                                >
                                    {loading ? 'Đang kiểm tra...' : 'Xác nhận kết nối'}
                                    <iconify-icon icon="solar:arrow-right-bold" width="18" height="18"></iconify-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {showWaitingAlert && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white rounded-[3.5rem] p-12 w-full max-w-sm shadow-2xl text-center border border-blue-50">
                            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-primary">
                                <iconify-icon icon="solar:heart-bold-duotone" width="56" height="56"></iconify-icon>
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter uppercase">Tik Tik Tik</h2>
                            <p className="text-sm text-slate-500 font-medium leading-[1.8] mb-12 text-center">
                                Tín hiệu đã được gửi đến người ấy.<br/>Đợi chờ là hạnh phúc mà !!!<br/><br/>
                                <span className="font-black text-primary uppercase tracking-widest text-xs">Những điều tốt đẹp thường đến muộn, đợi tý nha!</span>
                            </p>
                            <button onClick={() => setShowWaitingAlert(false)} className="w-full bg-primary text-white font-black py-5 rounded-full shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-[11px]">Đã hiểu hì hì</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showConfirmModal && senderInfo && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[3.5rem] p-12 w-full max-w-sm shadow-2xl text-center border border-blue-50">
                            <div className="w-24 h-24 rounded-[2.5rem] border-4 border-blue-50 overflow-hidden mx-auto mb-10 shadow-xl shadow-blue-100/50 bg-blue-50">
                                <img src={senderInfo.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=partner"} alt={senderInfo.nickname} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Ký tên với {senderInfo.nickname}?</h3>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-10">Kết nối vĩnh viễn</p>
                            
                            <div className="bg-blue-50/50 rounded-[2rem] p-6 mb-10 text-center border border-blue-50">
                                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">"Tìm được nhau là duyên phận. Chắc chắn đây là mảnh ghép của bạn rồi chứ?"</p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button onClick={confirmJoinInvite} disabled={loading} className="w-full bg-primary text-white font-black py-5 rounded-full shadow-lg shadow-blue-200 active:scale-95 transition-all text-[11px] tracking-widest uppercase">{loading ? 'Đang cập bến...' : 'Đặt bút ký tên'}</button>
                                <button onClick={() => setShowConfirmModal(false)} className="w-full py-2 text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all">Hủy bỏ</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showReceiverSuccess && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-primary/95 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[4rem] p-12 w-full max-w-md shadow-2xl text-center border-8 border-white/20">
                            <div className="w-28 h-28 bg-blue-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 text-primary animate-bounce">
                                <iconify-icon icon="solar:stars-bold-duotone" width="72" height="72"></iconify-icon>
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter uppercase">HOÀN TẤT</h2>
                            <p className="text-lg text-slate-500 mb-12 font-medium leading-relaxed">Bạn đã kết nối thành công với tình yêu của mình.<br/>Hết kiếp độc thân rồi nhé {'<3'}</p>
                            <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-black py-6 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">Mở cánh cửa tình yêu</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-primary/95 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[4rem] p-12 w-full max-w-md shadow-2xl text-center border-8 border-white/20">
                            <div className="w-28 h-28 bg-blue-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 text-primary animate-bounce">
                                <iconify-icon icon="solar:magic-stick-3-bold-duotone" width="72" height="72"></iconify-icon>
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter uppercase">CHÚC MỪNG</h2>
                            <p className="text-lg text-slate-500 mb-12 font-medium leading-relaxed">Nửa kia đã chính thức ký tên xác nhận!!<br/>Cùng nhau viết tiếp câu chuyện tình yêu nhé.</p>
                            <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-black py-6 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">Bắt đầu ngay</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showWarning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[4rem] p-12 w-full max-w-sm shadow-2xl text-center border-8 border-white/20">
                            <div className="w-20 h-20 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-primary shadow-xl shadow-blue-100/30">
                                <iconify-icon icon="solar:danger-triangle-bold-duotone" width="40" height="40"></iconify-icon>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tighter uppercase">Lưu ý cực quan trọng</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-12 font-bold px-2">Bạn chỉ có thể kết nối với **duy nhất một người**. Một khi đã xác nhận, mối liên kết tâm hồn này sẽ không thể thay đổi.</p>
                            <div className="flex flex-col gap-4">
                                <button onClick={handleCreateLink} className="w-full bg-primary text-white font-black py-6 rounded-full shadow-2xl shadow-blue-100 active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]">Tôi đã hiểu và tiếp tục</button>
                                <button onClick={() => setShowWarning(false)} className="w-full text-blue-200 font-black py-2 text-[10px] uppercase tracking-widest hover:text-primary transition-colors">Suy nghĩ lại</button>
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
