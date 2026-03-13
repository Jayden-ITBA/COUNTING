import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import { generatePairingCode } from '../utils/pairing_utils';
import Navbar from './Navbar';

const WheelPicker = ({ options, value, onChange, label }) => {
    return (
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.2em] mb-4">{label}</span>
            <div className="h-48 w-24 overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar bg-blue-50/30 rounded-[2rem] border border-blue-100/50 shadow-inner">
                <div className="h-24" /> {/* Padding top */}
                {options.map((opt) => (
                    <div
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${value === opt ? 'text-primary font-black text-xl scale-125' : 'text-blue-200 text-sm font-bold'}`}
                    >
                        {opt}
                    </div>
                ))}
                <div className="h-24" /> {/* Padding bottom */}
            </div>
        </div>
    );
};

const Pairing = () => {
    const { profile, refreshData } = useData();
    const { inviteId: urlInviteId } = useParams();
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [joining, setJoining] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [senderInfo, setSenderInfo] = useState(null);
    const [activeInviteId, setActiveInviteId] = useState(null);
    const [showReceiverSuccess, setShowReceiverSuccess] = useState(false);

    const [step, setStep] = useState('none');
    const [day, setDay] = useState(new Date().getDate());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [hasCopied, setHasCopied] = useState(false);

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        const fetchSenderForLink = async () => {
            if (urlInviteId && profile && profile.link_status === 'none') {
                setLoading(true);
                const invId = urlInviteId.toUpperCase();
                try {
                    const invSnap = await getDoc(doc(db, 'invites', invId));
                    if (invSnap.exists()) {
                        const invData = invSnap.data();
                        if (invData.status === 'pending' && invData.sender_id !== auth.currentUser.uid) {
                            const senderSnap = await getDoc(doc(db, 'profiles', invData.sender_id));
                            if (senderSnap.exists()) {
                                setSenderInfo(senderSnap.data());
                                setActiveInviteId(invId);
                                setShowConfirmModal(true);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching sender info:", error);
                } finally {
                    setLoading(false);
                }
            } else if (urlInviteId && profile?.link_status === 'paired') {
                navigate('/');
            }
        };

        fetchSenderForLink();
    }, [urlInviteId, profile]);

    useEffect(() => {
        if (profile?.link_status === 'pending' && profile?.invite_id) {
            const unsubscribe = onSnapshot(doc(db, 'invites', profile.invite_id), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.status === 'paired') {
                        setShowSuccessModal(true);
                    }
                }
            });

            return () => unsubscribe();
        }
    }, [profile]);

    const handleCreateLink = () => setShowWarning(true);

    const confirmCreateLink = async () => {
        setLoading(true);
        const inviteId = generatePairingCode();
        
        try {
            const anniversaryDate = new Date(year, month - 1, day);
            
            await setDoc(doc(db, 'invites', inviteId), {
                sender_id: auth.currentUser.uid,
                status: 'pending',
                receiver_id: null,
                created_at: serverTimestamp(),
                anniversary_date: anniversaryDate
            });

            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
                link_status: 'pending',
                invite_id: inviteId
            });

            setShowWarning(false);
            setStep('none');
            refreshData();
        } catch (error) {
            console.error("Invite Creation Error:", error);
            alert("Lỗi khi tạo mã mời!");
        } finally {
            setLoading(false);
        }
    };

    const handlePrepareJoin = async (invId) => {
        if (!invId) return;
        setLoading(true);
        try {
            const invSnap = await getDoc(doc(db, 'invites', invId));
            if (!invSnap.exists()) {
                alert("Mã này không tồn tại!");
                return;
            }

            const invData = invSnap.data();
            if (invData.status !== 'pending') {
                alert("Mã này đã được sử dụng hoặc hết hạn!");
                return;
            }

            if (invData.sender_id === auth.currentUser.uid) {
                alert("Bạn không thể tự kết nối với chính mình!");
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
        setJoining(true);
        try {
            const invSnap = await getDoc(doc(db, 'invites', activeInviteId));
            const invData = invSnap.data();
            const anniversaryDate = invData.anniversary_date || serverTimestamp();

            const batch = writeBatch(db);
            const senderUid = senderInfo.uid || senderInfo.id;
            
            if (!senderUid) {
                throw new Error("Không tìm thấy UID người gửi");
            }

            const coupleId = `${senderUid}_${auth.currentUser.uid}`;

            batch.set(doc(db, 'couples', coupleId), {
                uids: [senderUid, auth.currentUser.uid],
                anniversary_date: anniversaryDate,
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
            refreshData();
            setShowReceiverSuccess(true);
        } catch (error) {
            console.error("Join error:", error);
            alert("Lỗi khi kết nối: " + error.message);
        } finally {
            setLoading(false);
            setJoining(false);
            setShowConfirmModal(false);
        }
    };

    const inviteLink = profile?.invite_id ? `${window.location.origin}/join/${profile.invite_id}` : '';

    return (
        <div className="relative min-h-screen bg-[#f8faff] pb-32 font-sans overflow-hidden">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Background elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/40 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-50/30 blur-[120px] rounded-full" />
            </div>

            <header className="px-6 pt-16 pb-8 border-b border-blue-50 bg-[#f8faff]/80 backdrop-blur-md sticky top-0 z-10">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kết nối cục cưng</h1>
                <p className="text-primary/60 text-[10px] font-black mt-1 uppercase tracking-[0.3em]">Hãy tìm nửa kia giữa muôn vạn người nhé !!</p>
            </header>

            <div className="px-6 space-y-8 relative z-10">
                {(loading || joining) && (
                    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[4rem] border border-blue-50 shadow-2xl shadow-blue-100/20">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8" />
                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em]">Đang chuẩn bị...</p>
                    </div>
                )}

                {!loading && !joining && (profile?.link_status === 'none' || profile?.link_status === 'pending') && (
                    <>
                        {profile?.link_status === 'none' && step === 'none' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-12 rounded-[4rem] text-center border border-blue-50 shadow-2xl shadow-blue-100/20"
                            >
                                <div className="w-24 h-24 bg-blue-50/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-primary shadow-inner">
                                    <iconify-icon icon="solar:link-circle-bold-duotone" width="48" height="48"></iconify-icon>
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Gửi tín hiệu</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-12 px-2 font-medium">
                                    Bắt đầu hành trình hạnh phúc bằng cách tạo tín hiệu kết nối ngay.
                                </p>
                                <button
                                    onClick={handleCreateLink}
                                    className="w-full bg-primary text-white font-black py-6 rounded-full shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-[11px]"
                                >
                                    Tạo tín hiệu kết nối
                                </button>
                            </motion.div>
                        )}

                        {profile?.link_status === 'none' && step === 'date_selection' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-12 rounded-[4rem] text-center border border-blue-50 shadow-2xl shadow-blue-100/20"
                            >
                                <h3 className="text-xl font-black text-slate-800 mb-10 tracking-tighter uppercase">Ngày định mệnh</h3>
                                
                                <div className="flex justify-center gap-6 mb-12">
                                    <WheelPicker label="Ngày" options={days} value={day} onChange={setDay} />
                                    <WheelPicker label="Tháng" options={months} value={month} onChange={setMonth} />
                                    <WheelPicker label="Năm" options={years} value={year} onChange={setYear} />
                                </div>

                                <button
                                    onClick={confirmCreateLink}
                                    className="w-full bg-primary text-white font-black py-6 rounded-full shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-[11px]"
                                >
                                    Xác nhận & Tạo mã
                                </button>
                                <button
                                    onClick={() => setStep('none')}
                                    className="w-full mt-8 text-blue-300 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
                                >
                                    Quay lại
                                </button>
                            </motion.div>
                        )}

                        {profile?.link_status === 'none' && step === 'none' && (
                            <div className="relative py-6 flex justify-center items-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-blue-50"></div>
                                </div>
                                <span className="relative px-8 bg-[#f8faff] text-[11px] font-black text-blue-200 uppercase tracking-[0.4em]">Hoặc</span>
                            </div>
                        )}

                        {profile?.link_status === 'pending' && (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white p-12 rounded-[4rem] text-center border-2 border-blue-50 shadow-2xl shadow-blue-100/10 mb-8"
                            >
                                <div className="w-20 h-20 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-pulse text-primary shadow-lg shadow-blue-100/30">
                                    <iconify-icon icon="solar:heart-angle-bold-duotone" width="40" height="40"></iconify-icon>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-10 uppercase tracking-tight">Đang đợi phản hồi...</h3>

                                <div className="bg-blue-50/50 p-10 rounded-[3rem] mb-10 border border-blue-100/50 shadow-inner">
                                    <h2 className="text-4xl font-black text-blue-600 tracking-[0.25em] mb-8 font-mono">
                                        {profile.invite_id}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(profile.invite_id);
                                            setHasCopied(true);
                                            alert("Đã sao chép mã!");
                                        }}
                                        className="bg-white text-blue-600 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 px-8 py-4 rounded-full shadow-lg border border-blue-100 active:scale-95 transition-all mx-auto"
                                    >
                                        <iconify-icon icon="solar:copy-bold-duotone" width="18" height="18"></iconify-icon>
                                        Sao chép mã
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(inviteLink);
                                        setHasCopied(true);
                                        alert("Đã sao chép link!");
                                    }}
                                    className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl"
                                >
                                    Gửi link kết nối nhanh
                                </button>
                            </motion.div>
                        )}

                        {step === 'none' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-12 rounded-[4rem] border border-blue-50 shadow-2xl shadow-blue-100/10"
                            >
                                <h3 className="text-[15px] font-black text-slate-800 mb-10 text-center uppercase tracking-tighter">Bạn đã có mã định mệnh?</h3>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="AB12CD"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        className="flex-1 bg-blue-50/50 border-2 border-transparent focus:border-primary/30 rounded-[2rem] px-8 py-6 text-center font-mono font-black text-2xl text-primary outline-none transition-all uppercase tracking-widest shadow-inner"
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={() => handlePrepareJoin(manualCode)}
                                        disabled={manualCode.length !== 6 || loading}
                                        className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl ${manualCode.length === 6 ? 'bg-primary text-white scale-100 shadow-blue-100' : 'bg-blue-100 text-white scale-95 opacity-50'}`}
                                    >
                                        <iconify-icon icon="solar:arrow-right-bold-duotone" width="36" height="36"></iconify-icon>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            {/* Confirm Join Modal (From Link or Code) */}
            <AnimatePresence>
                {showConfirmModal && senderInfo && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowConfirmModal(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[4.5rem] p-12 w-full max-w-sm shadow-2xl text-center border-8 border-white/20"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-28 h-28 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden mx-auto mb-10 bg-blue-50">
                                <img src={senderInfo.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + senderInfo.nickname} alt={senderInfo.nickname} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Tìm thấy {senderInfo.nickname} rồi?</h3>
                            <div className="bg-blue-50/50 rounded-[2.5rem] p-8 mb-10 border border-blue-50">
                                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-2">
                                    <iconify-icon icon="solar:shield-check-bold-duotone" width="16" height="16"></iconify-icon> Bảo mật tuyệt đối
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed font-bold">
                                    Tìm được nhau là không rời nhau được. Chắc chắn kết nối với cục cưng này chứ?
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={confirmJoinInvite}
                                    disabled={loading}
                                    className="w-full bg-primary text-white font-black py-6 rounded-full shadow-2xl shadow-blue-100 active:scale-95 transition-all uppercase tracking-[0.2em] text-[11px]"
                                >
                                    {loading ? 'Đang chuẩn bị...' : 'Xác nhận kết nối'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setSenderInfo(null);
                                        setActiveInviteId(null);
                                        setJoining(false);
                                    }}
                                    className="w-full text-blue-200 font-black text-[10px] uppercase tracking-widest py-2"
                                >
                                    Để lát nữa nhé
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Warning Popup (For Sender creating link) */}
            <AnimatePresence>
                {showWarning && (
                    <div className="fixed inset-0 z-[180] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowWarning(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[4rem] p-12 w-full max-w-sm shadow-2xl text-center border-8 border-white/20"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-10 mx-auto text-primary shadow-xl shadow-blue-100/50">
                                <iconify-icon icon="solar:danger_triangle-bold-duotone" width="48" height="48"></iconify-icon>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Lưu ý quan trọng</h3>
                            <p className="text-sm text-slate-500 font-bold leading-[1.8] mb-12 px-2">
                                Bạn chỉ có thể kết nối với **một người duy nhất**. Khi người ấy xác nhận, mối liên kết này sẽ không thể thay đổi.
                            </p>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => {
                                        setShowWarning(false);
                                        setStep('date_selection');
                                    }}
                                    className="w-full bg-primary text-white font-black py-6 rounded-full shadow-2xl shadow-blue-100 active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]"
                                >
                                    Đã hiểu & Tiếp tục
                                </button>
                                <button
                                    onClick={() => setShowWarning(false)}
                                    className="w-full text-blue-200 font-black text-[10px] uppercase tracking-widest mt-2"
                                >
                                    Để tớ xem lại
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Success Modal (Sender Only - When Partner confirmed) */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-white/95 backdrop-blur-3xl overflow-hidden">
                        <div className="fixed inset-0 pointer-events-none opacity-30">
                            <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-blue-100 blur-[150px] rounded-full" />
                            <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-sky-100 blur-[150px] rounded-full" />
                        </div>
                        <motion.div
                            initial={{ scale: 0.8, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            className="text-center w-full max-w-lg relative z-10"
                        >
                            <div className="w-48 h-48 bg-blue-50/50 rounded-[4rem] rotate-12 flex items-center justify-center mx-auto mb-16 shadow-2xl shadow-blue-100/50 border-4 border-white/50 group">
                                <iconify-icon icon="solar:star-bold-duotone" width="100" height="100" class="text-primary -rotate-12 group-hover:scale-110 transition-transform"></iconify-icon>
                            </div>
                            
                            <h2 className="text-6xl font-black text-slate-800 mb-8 tracking-tighter italic uppercase">CHÚC MỪNG</h2>
                            <p className="text-xl text-slate-400 leading-relaxed mb-20 font-bold px-4 max-w-sm mx-auto">
                                Giữa muôn vạn người, <br/> tình yêu đã tìm thấy được bạn!!
                            </p>
                            
                            <button
                                onClick={() => {
                                    refreshData();
                                    navigate('/');
                                }}
                                className="w-full bg-slate-900 text-white font-black py-8 rounded-[2.5rem] shadow-2xl shadow-blue-100 hover:scale-[1.05] active:scale-95 transition-all text-xl tracking-[0.3em] uppercase"
                            >
                                Bắt đầu ngay
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Receiver Success Modal */}
            <AnimatePresence>
                {showReceiverSuccess && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-white/95 backdrop-blur-3xl overflow-hidden">
                        <div className="fixed inset-0 pointer-events-none opacity-30">
                            <div className="absolute top-0 left-0 w-[80%] h-[80%] bg-blue-100 blur-[150px] rounded-full" />
                            <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-sky-100 blur-[150px] rounded-full" />
                        </div>
                        <motion.div
                            initial={{ scale: 0.8, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            className="text-center w-full max-w-lg relative z-10"
                        >
                            <div className="w-48 h-48 bg-blue-50/50 rounded-[4rem] -rotate-12 flex items-center justify-center mx-auto mb-16 shadow-2xl shadow-blue-100/50 border-4 border-white/50 group">
                                <iconify-icon icon="solar:magic-stick-3-bold-duotone" width="100" height="100" class="text-primary rotate-12 group-hover:scale-110 transition-transform"></iconify-icon>
                            </div>

                            <h2 className="text-6xl font-black text-slate-800 mb-8 tracking-tighter italic uppercase">CHÚC MỪNG</h2>
                            <p className="text-xl text-slate-400 leading-relaxed mb-20 font-bold px-4 max-w-sm mx-auto">
                                Xe bông đã ở trước cửa. <br/> Đợi tay bạn mở cửa
                            </p>

                            <button
                                onClick={() => {
                                    refreshData();
                                    navigate('/');
                                }}
                                className="w-full bg-primary text-white font-black py-8 rounded-[2.5rem] shadow-2xl shadow-blue-100 hover:scale-[1.05] active:scale-95 transition-all text-xl tracking-[0.3em] uppercase"
                            >
                                Lên xe ngay
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Navbar />
        </div>
    );
};

export default Pairing;
