import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { generatePairingCode } from '../utils/pairing_utils';
import Navbar from './Navbar';

const WheelPicker = ({ options, value, onChange, label }) => {
    return (
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">{label}</span>
            <div className="h-40 w-20 overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="h-16" /> {/* Padding top */}
                {options.map((opt) => (
                    <div
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={`h-8 flex items-center justify-center snap-center cursor-pointer transition-all ${value === opt ? 'text-blue-500 font-bold text-lg' : 'text-slate-300 text-sm'}`}
                    >
                        {opt}
                    </div>
                ))}
                <div className="h-16" /> {/* Padding bottom */}
            </div>
        </div>
    );
};

const Pairing = ({ profile, onUpdate }) => {
    const { inviteId: urlInviteId } = useParams();
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [joining, setJoining] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    
    // New states for confirmation flow
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [senderInfo, setSenderInfo] = useState(null);
    const [activeInviteId, setActiveInviteId] = useState(null);
    const [showReceiverSuccess, setShowReceiverSuccess] = useState(false);

    // Step management for sender
    const [step, setStep] = useState('none'); // 'none', 'date_selection'
    const [day, setDay] = useState(new Date().getDate());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [hasCopied, setHasCopied] = useState(false);

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

    // Initial check for join URL - Fetch sender info instead of auto-joining
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

    // Real-time listener for current user's invite to show success modal to sender
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
            onUpdate();
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

            // Fetch sender info for confirmation modal
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

            // 1. Create Couple
            batch.set(doc(db, 'couples', coupleId), {
                uids: [senderUid, auth.currentUser.uid],
                anniversary_date: anniversaryDate,
                created_at: serverTimestamp(),
                background_url: '',
                blur_level: 0
            });

            // 2. Update Invite
            batch.update(doc(db, 'invites', activeInviteId), {
                status: 'paired',
                receiver_id: auth.currentUser.uid,
                paired_at: serverTimestamp()
            });

            // 3. Update Sender Profile
            batch.update(doc(db, 'profiles', senderUid), {
                link_status: 'paired',
                partner_id: auth.currentUser.uid,
                couple_id: coupleId
            });

            // 4. Update Receiver Profile
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
            setJoining(false);
            setShowConfirmModal(false);
        }
    };

    const inviteLink = profile?.invite_id ? `${window.location.origin}/join/${profile.invite_id}` : '';

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-slate-800">Kết nối cục cưng</h1>
                <p className="text-slate-500 text-sm">Hãy tìm cục cưng của bạn giữa muôn vạn người nhé !!</p>
            </div>

            <div className="px-6 space-y-6">
                {(loading || joining) && (
                    <div className="flex flex-col items-center justify-center p-20 bg-white/50 rounded-[3rem] glass">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 text-sm font-medium">Đang xử lý kết nối...</p>
                    </div>
                )}

                {!loading && !joining && (profile?.link_status === 'none' || profile?.link_status === 'pending') && (
                    <>
                        {profile?.link_status === 'none' && step === 'none' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass p-8 rounded-[3rem] text-center"
                            >
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-4xl text-blue-500">link</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Tìm cục cưng</h3>
                                <p className="text-sm text-slate-500 mb-8">
                                    Gửi tín hiệu kết nối cho cục cưng để bắt đầu hành trình nhé !!!
                                </p>
                                <button
                                    onClick={handleCreateLink}
                                    className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
                                >
                                    Tạo tín hiệu kết nối
                                </button>
                            </motion.div>
                        )}

                        {profile?.link_status === 'none' && step === 'date_selection' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass p-8 rounded-[3rem] text-center"
                            >
                                <h3 className="text-xl font-extrabold text-slate-800 mb-6">Ngày chúng ta thành đôi</h3>
                                
                                <div className="flex justify-center gap-4 mb-8">
                                    <WheelPicker label="Ngày" options={days} value={day} onChange={setDay} />
                                    <WheelPicker label="Tháng" options={months} value={month} onChange={setMonth} />
                                    <WheelPicker label="Năm" options={years} value={year} onChange={setYear} />
                                </div>

                                <button
                                    onClick={confirmCreateLink}
                                    className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
                                >
                                    Xác nhận & Tạo mã
                                </button>
                                <button
                                    onClick={() => setStep('none')}
                                    className="w-full mt-4 text-slate-400 font-bold text-sm uppercase"
                                >
                                    Quay lại
                                </button>
                            </motion.div>
                        )}

                        {profile?.link_status === 'none' && step === 'none' && (
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-4 bg-background-light text-slate-400 font-bold uppercase tracking-widest">Hoặc</span>
                                </div>
                            </div>
                        )}

                        {profile?.link_status === 'pending' && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="glass p-8 rounded-[3rem] text-center border-2 border-blue-200 mb-6"
                            >
                                {hasCopied && (
                                    <>
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                            <span className="material-symbols-outlined text-blue-400">hourglass_empty</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">Đang đợi cục cưng kết nối giữa muôn vạn người...</h3>
                                        <p className="text-xs text-slate-400 mb-6 uppercase tracking-widest font-bold">Chia sẻ mã bên dưới</p>
                                    </>
                                )}

                                <div className="bg-slate-50 p-6 rounded-[2rem] mb-4 border border-blue-50">
                                    <h2 className="text-4xl font-black text-blue-500 tracking-[0.2em] mb-4 font-mono">
                                        {profile.invite_id}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(profile.invite_id);
                                            setHasCopied(true);
                                            alert("Đã sao chép mã!");
                                        }}
                                        className="text-blue-500 font-bold text-xs uppercase flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                        Sao chép mã
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(inviteLink);
                                        setHasCopied(true);
                                        alert("Đã sao chép link!");
                                    }}
                                    className="w-full bg-blue-100 text-blue-600 font-bold py-3 rounded-2xl text-xs uppercase"
                                >
                                    Sao chép link kết nối
                                </button>
                            </motion.div>
                        )}

                        {step === 'none' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="glass p-8 rounded-[3rem]"
                            >
                                <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Cục cưng đã gửi tín hiệu gì cho bạn !</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: AB12CD"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-center font-mono font-bold text-lg text-slate-700 outline-none ring-2 ring-transparent focus:ring-blue-100 transition-all uppercase"
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={() => handlePrepareJoin(manualCode)}
                                        disabled={manualCode.length !== 6 || loading}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${manualCode.length === 6 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-300'}`}
                                    >
                                        <span className="material-symbols-outlined">arrow_forward</span>
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-[3rem] p-8 w-full max-w-sm shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 rounded-full border-4 border-blue-100 overflow-hidden mx-auto mb-6">
                                <img src={senderInfo.avatar_url || "/api/placeholder/100/100"} alt={senderInfo.nickname} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Đã tìm thấy cục cưng {senderInfo.nickname}?</h3>
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-8">
                                <p className="text-xs text-orange-600 font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-sm">warning</span> Lưu ý quan trọng
                                </p>
                                <p className="text-xs text-orange-700 leading-relaxed font-medium">
                                    Tìm được nhau là không rời nhau được. Chắc chưa hở cục cưng ???
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmJoinInvite}
                                    disabled={loading}
                                    className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest"
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
                                    className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-full"
                                >
                                    Bye
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Warning Popup (For Sender creating link) */}
            <AnimatePresence>
                {showWarning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-3xl text-orange-500">warning</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Lưu ý quan trọng</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-8">
                                Bạn chỉ có thể kết nối với **một người duy nhất**. Khi người ấy xác nhận, mối liên kết này sẽ không thể thay đổi.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShowWarning(false);
                                        setStep('date_selection');
                                    }}
                                    className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/20"
                                >
                                    Tôi đã hiểu và tiếp tục
                                </button>
                                <button
                                    onClick={() => setShowWarning(false)}
                                    className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-full"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Success Modal (Sender Only - When Partner confirmed) */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-blue-600/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-[3.5rem] p-10 w-full max-w-md shadow-2xl text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400" />
                            
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <span className="material-symbols-outlined text-6xl text-blue-500 fill-1">celebration</span>
                            </div>
                            
                            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">CHÚC MỪNG</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium">
                                Giữa muôn vạn người, tình yêu đã tìm thấy được bạn!!
                            </p>
                            
                            <button
                                onClick={() => {
                                    onUpdate();
                                    navigate('/');
                                }}
                                className="w-full bg-blue-500 text-white font-black py-5 rounded-full shadow-xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-widest uppercase"
                            >
                                Bắt đầu ngay
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Navbar profile={profile} />
            {/* Receiver Success Modal */}
            <AnimatePresence>
                {showReceiverSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-rose-500/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-[3.5rem] p-10 w-full max-w-md shadow-2xl text-center"
                        >
                            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <iconify-icon icon="solar:magic-stick-3-linear" width="64" height="64" class="text-rose-500"></iconify-icon>
                            </div>

                            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter uppercase">CHÚC MỪNG</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium">
                                Xe bông đã ở trước cửa. Đợi tay bạn mở cửa
                            </p>

                            <button
                                onClick={() => {
                                    onUpdate();
                                    navigate('/');
                                }}
                                className="w-full bg-rose-500 text-white font-black py-5 rounded-full shadow-xl shadow-rose-500/40 hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-widest uppercase"
                            >
                                Lên xe nào
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Pairing;
