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
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">{label}</span>
            <div className="h-44 w-20 overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar bg-neutral-100/50 rounded-2xl border border-neutral-200">
                <div className="h-20" /> {/* Padding top */}
                {options.map((opt) => (
                    <div
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={`h-8 flex items-center justify-center snap-center cursor-pointer transition-all ${value === opt ? 'text-rose-500 font-black text-lg scale-110' : 'text-neutral-300 text-sm font-bold'}`}
                    >
                        {opt}
                    </div>
                ))}
                <div className="h-20" /> {/* Padding bottom */}
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
        <div className="relative min-h-screen bg-neutral-50 pb-32">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <header className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Kết nối cục cưng</h1>
                <p className="text-neutral-400 text-xs font-medium mt-1 uppercase tracking-widest leading-relaxed">Hãy tìm nửa kia giữa muôn vạn người nhé !!</p>
            </header>

            <div className="px-6 space-y-8">
                {(loading || joining) && (
                    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-neutral-100 shadow-sm">
                        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-6" />
                        <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Đang kết nối...</p>
                    </div>
                )}

                {!loading && !joining && (profile?.link_status === 'none' || profile?.link_status === 'pending') && (
                    <>
                        {profile?.link_status === 'none' && step === 'none' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-10 rounded-[3.5rem] text-center border border-neutral-100 shadow-sm"
                            >
                                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-8 text-neutral-400">
                                    <iconify-icon icon="solar:link-circle-bold" width="40" height="40"></iconify-icon>
                                </div>
                                <h3 className="text-xl font-bold text-neutral-800 mb-2">Gửi tín hiệu</h3>
                                <p className="text-sm text-neutral-500 leading-relaxed mb-10 px-4">
                                    Bắt đầu hành trình hạnh phúc bằng cách tạo tín hiệu kết nối ngay.
                                </p>
                                <button
                                    onClick={handleCreateLink}
                                    className="w-full bg-neutral-900 text-white font-black py-5 rounded-full shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                                >
                                    Tạo tín hiệu kết nối
                                </button>
                            </motion.div>
                        )}

                        {profile?.link_status === 'none' && step === 'date_selection' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-10 rounded-[3.5rem] text-center border border-neutral-100 shadow-sm"
                            >
                                <h3 className="text-xl font-black text-neutral-800 mb-8 tracking-tighter uppercase">Ngày định mệnh</h3>
                                
                                <div className="flex justify-center gap-4 mb-10">
                                    <WheelPicker label="Ngày" options={days} value={day} onChange={setDay} />
                                    <WheelPicker label="Tháng" options={months} value={month} onChange={setMonth} />
                                    <WheelPicker label="Năm" options={years} value={year} onChange={setYear} />
                                </div>

                                <button
                                    onClick={confirmCreateLink}
                                    className="w-full bg-neutral-900 text-white font-black py-5 rounded-full shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                                >
                                    Xác nhận & Tạo mã
                                </button>
                                <button
                                    onClick={() => setStep('none')}
                                    className="w-full mt-6 text-neutral-400 font-black text-[10px] uppercase tracking-widest"
                                >
                                    Quay lại
                                </button>
                            </motion.div>
                        )}

                        {profile?.link_status === 'none' && step === 'none' && (
                            <div className="relative py-4 flex justify-center items-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-neutral-100"></div>
                                </div>
                                <span className="relative px-6 bg-neutral-50 text-[10px] font-black text-neutral-200 uppercase tracking-[0.3em]">Hoặc</span>
                            </div>
                        )}

                        {profile?.link_status === 'pending' && (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white p-10 rounded-[3.5rem] text-center border-2 border-rose-100 shadow-xl shadow-rose-100/20 mb-8"
                            >
                                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse text-rose-500">
                                    <iconify-icon icon="solar:heart-angle-bold" width="32" height="32"></iconify-icon>
                                </div>
                                <h3 className="text-lg font-bold text-neutral-800 mb-8 tracking-tight">Đang đợi tín hiệu phản hồi...</h3>

                                <div className="bg-neutral-50 p-8 rounded-[2.5rem] mb-6 border border-neutral-100">
                                    <h2 className="text-4xl font-black text-rose-500 tracking-[0.2em] mb-6 font-mono">
                                        {profile.invite_id}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(profile.invite_id);
                                            setHasCopied(true);
                                            alert("Đã sao chép mã!");
                                        }}
                                        className="bg-white text-rose-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 px-6 py-3 rounded-full shadow-sm mx-auto active:scale-95 transition-transform"
                                    >
                                        <iconify-icon icon="solar:copy-bold" width="16" height="16"></iconify-icon>
                                        Sao chép mã
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(inviteLink);
                                        setHasCopied(true);
                                        alert("Đã sao chép link!");
                                    }}
                                    className="w-full bg-neutral-100 text-neutral-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
                                >
                                    Sao chép link kết nối
                                </button>
                            </motion.div>
                        )}

                        {step === 'none' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-10 rounded-[3.5rem] border border-neutral-100 shadow-sm"
                            >
                                <h3 className="text-base font-bold text-neutral-800 mb-8 text-center tracking-tight">Cục cưng đã gửi mã cho bạn ?</h3>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="VÍ DỤ: AB12CD"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        className="flex-1 bg-neutral-50 border-2 border-transparent focus:border-rose-100 rounded-[1.5rem] px-6 py-5 text-center font-mono font-black text-xl text-neutral-700 outline-none transition-all uppercase"
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={() => handlePrepareJoin(manualCode)}
                                        disabled={manualCode.length !== 6 || loading}
                                        className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl ${manualCode.length === 6 ? 'bg-neutral-900 text-white scale-100' : 'bg-neutral-200 text-white scale-95 opacity-50'}`}
                                    >
                                        <iconify-icon icon="solar:arrow-right-bold" width="32" height="32"></iconify-icon>
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
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md" onClick={() => setShowConfirmModal(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[4rem] p-10 w-full max-w-sm shadow-2xl text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-24 h-24 rounded-full border-4 border-rose-100 overflow-hidden mx-auto mb-8 shadow-xl">
                                <img src={senderInfo.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + senderInfo.nickname} alt={senderInfo.nickname} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-800 mb-2">Tìm thấy {senderInfo.nickname} rồi?</h3>
                            <div className="bg-rose-50 rounded-[2rem] p-6 mb-10 border border-rose-100">
                                <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                                    <iconify-icon icon="solar:danger-bold" width="14" height="14"></iconify-icon> Chắc chưa hở?
                                </p>
                                <p className="text-xs text-neutral-600 leading-relaxed font-bold">
                                    Tìm được nhau là không rời nhau được. Chắc chưa hở cục cưng ???
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={confirmJoinInvite}
                                    disabled={loading}
                                    className="w-full bg-neutral-900 text-white font-black py-5 rounded-full shadow-2xl active:scale-95 transition-all uppercase tracking-widest text-sm"
                                >
                                    {loading ? 'Đang kết nối...' : 'Đặt bút ký đơn'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setSenderInfo(null);
                                        setActiveInviteId(null);
                                        setJoining(false);
                                    }}
                                    className="w-full text-neutral-400 font-black text-[10px] uppercase tracking-widest py-2"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Warning Popup (For Sender creating link) */}
            <AnimatePresence>
                {showWarning && (
                    <div className="fixed inset-0 z-[180] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md" onClick={() => setShowWarning(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[4rem] p-10 w-full max-w-sm shadow-2xl text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-8 mx-auto text-rose-500">
                                <iconify-icon icon="solar:danger-triangle-bold" width="40" height="40"></iconify-icon>
                            </div>
                            <h3 className="text-xl font-black text-neutral-800 mb-4 uppercase tracking-tighter">Lưu ý quan trọng</h3>
                            <p className="text-sm text-neutral-500 font-medium leading-[1.8] mb-10">
                                Bạn chỉ có thể kết nối với **một người duy nhất**. Khi người ấy xác nhận, mối liên kết này sẽ không thể thay đổi.
                            </p>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => {
                                        setShowWarning(false);
                                        setStep('date_selection');
                                    }}
                                    className="w-full bg-neutral-900 text-white font-black py-5 rounded-full shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest"
                                >
                                    Đã hiểu & Tiếp tục
                                </button>
                                <button
                                    onClick={() => setShowWarning(false)}
                                    className="w-full text-neutral-400 font-black text-[10px] uppercase tracking-widest"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Success Modal (Sender Only - When Partner confirmed) */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-white/95 backdrop-blur-3xl">
                        <motion.div
                            initial={{ scale: 0.8, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            className="text-center w-full max-w-md"
                        >
                            <div className="w-40 h-40 bg-rose-50 rounded-[3rem] rotate-12 flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-rose-100">
                                <iconify-icon icon="solar:star-bold-duotone" width="80" height="80" class="text-rose-500 -rotate-12"></iconify-icon>
                            </div>
                            
                            <h2 className="text-5xl font-black text-neutral-900 mb-6 tracking-tighter italic">CHÚC MỪNG</h2>
                            <p className="text-xl text-neutral-400 leading-relaxed mb-16 font-medium px-8">
                                Giữa muôn vạn người, <br/> tình yêu đã tìm thấy được bạn!!
                            </p>
                            
                            <button
                                onClick={() => {
                                    refreshData();
                                    navigate('/');
                                }}
                                className="w-full bg-neutral-900 text-white font-black py-7 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-[1.05] active:scale-95 transition-all text-xl tracking-[0.2em] uppercase"
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
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-white/95 backdrop-blur-3xl">
                        <motion.div
                            initial={{ scale: 0.8, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            className="text-center w-full max-w-md"
                        >
                            <div className="w-40 h-40 bg-rose-50 rounded-[3rem] -rotate-12 flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-rose-100">
                                <iconify-icon icon="solar:magic-stick-3-bold" width="80" height="80" class="text-rose-500 rotate-12"></iconify-icon>
                            </div>

                            <h2 className="text-5xl font-black text-neutral-800 mb-6 tracking-tighter italic">CHÚC MỪNG</h2>
                            <p className="text-xl text-neutral-400 leading-relaxed mb-16 font-medium px-8">
                                Xe bông đã ở trước cửa. <br/> Đợi tay bạn mở cửa
                            </p>

                            <button
                                onClick={() => {
                                    refreshData();
                                    navigate('/');
                                }}
                                className="w-full bg-rose-500 text-white font-black py-7 rounded-full shadow-[0_20px_50px_rgba(244,63,94,0.3)] hover:scale-[1.05] active:scale-95 transition-all text-xl tracking-[0.2em] uppercase"
                            >
                                Lên xe nào
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
