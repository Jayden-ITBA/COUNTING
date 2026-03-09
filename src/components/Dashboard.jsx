import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, onSnapshot, getDoc, collection, query, where, setDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { generatePairingCode } from '../utils/pairing_utils';
import Navbar from './Navbar';

const Dashboard = ({ profile }) => {
    const navigate = useNavigate();
    const [coupleData, setCoupleData] = useState(null);
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [daysTogether, setDaysTogether] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // New states for confirmation flow
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [senderInfo, setSenderInfo] = useState(null);
    const [activeInviteId, setActiveInviteId] = useState(null);

    const calculateDays = (anniversaryDate) => {
        if (!anniversaryDate) return;
        const anniversary = anniversaryDate.toDate ? anniversaryDate.toDate() : new Date(anniversaryDate);
        const diffTime = Math.abs(new Date() - anniversary);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setDaysTogether(diffDays);
    };

    useEffect(() => {
        if (profile?.couple_id) {
            const unsubscribeCouple = onSnapshot(doc(db, 'couples', profile.couple_id), async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCoupleData(data);
                    calculateDays(data.anniversary_date);

                    const pId = data.uids.find(id => id !== auth.currentUser.uid);
                    if (pId) {
                        const partnerSnap = await getDoc(doc(db, 'profiles', pId));
                        if (partnerSnap.exists()) setPartnerProfile(partnerSnap.data());
                    }
                }
            });

            const q = query(
                collection(db, 'notifications'),
                where('couple_id', '==', profile.couple_id),
                where('recipient_id', '==', auth.currentUser.uid),
                where('read', '==', false)
            );

            const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
                setUnreadCount(snapshot.size);
            });

            return () => {
                unsubscribeCouple();
                unsubscribeNotifs();
            };
        }
    }, [profile]);

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
                created_at: serverTimestamp()
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
        try {
            const batch = writeBatch(db);
            const coupleId = `${senderInfo.uid}_${auth.currentUser.uid}`;

            batch.set(doc(db, 'couples', coupleId), {
                uids: [senderInfo.uid, auth.currentUser.uid],
                anniversary_date: serverTimestamp(),
                created_at: serverTimestamp(),
                background_url: '',
                blur_level: 0
            });

            batch.update(doc(db, 'invites', activeInviteId), {
                status: 'paired',
                receiver_id: auth.currentUser.uid,
                paired_at: serverTimestamp()
            });

            batch.update(doc(db, 'profiles', senderInfo.uid), {
                link_status: 'paired',
                partner_id: auth.currentUser.uid,
                couple_id: coupleId
            });

            batch.update(doc(db, 'profiles', auth.currentUser.uid), {
                link_status: 'paired',
                partner_id: senderInfo.uid,
                couple_id: coupleId,
                invite_id: activeInviteId
            });

            await batch.commit();
        } catch (error) {
            console.error("Join error:", error);
            alert("Lỗi khi kết nối!");
        } finally {
            setLoading(false);
            setShowConfirmModal(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-background-light overflow-hidden">
            <div
                className="fixed inset-0 bg-cover bg-center -z-10 transition-all duration-1000"
                style={{
                    backgroundImage: `url(${coupleData?.background_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=2000'})`,
                    filter: `blur(${coupleData?.blur_level || 0}px) brightness(0.9)`
                }}
            />

            <div className="flex items-center justify-between px-6 pt-12 pb-6 z-20">
                <button onClick={() => navigate('/settings')} className="glass w-10 h-10 flex items-center justify-center rounded-full">
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden glass">
                        <img src={profile?.avatar_url || "/api/placeholder/100/100"} alt="You" />
                    </div>
                    <motion.span
                        animate={{ scale: profile?.link_status === 'paired' ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`${profile?.link_status === 'paired' ? 'text-blue-500' : 'text-slate-300'} material-symbols-outlined text-3xl fill-1`}
                    >
                        favorite
                    </motion.span>
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden glass">
                        <img src={partnerProfile?.avatar_url || "/api/placeholder/100/100"} alt="Partner" />
                    </div>
                </div>

                <button onClick={() => navigate('/notifications')} className="glass w-10 h-10 flex items-center justify-center rounded-full relative">
                    <span className="material-symbols-outlined">notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 z-20">
                {profile?.link_status === 'paired' ? (
                    <div className="text-center">
                        <p className="text-slate-100 font-medium tracking-widest uppercase text-[10px] mb-2 drop-shadow-lg">We have been together for</p>
                        <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter drop-shadow-2xl">{daysTogether}</h1>
                        <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-sm mt-1">Days Together</p>
                        <p className="mt-8 text-white font-bold bg-white/20 px-6 py-2 rounded-full inline-block backdrop-blur-md border border-white/30 text-xs">
                            Since {coupleData?.anniversary_date ? (coupleData.anniversary_date.toDate ? coupleData.anniversary_date.toDate() : new Date(coupleData.anniversary_date)).toLocaleDateString('vi-VN') : '...'}
                        </p>
                    </div>
                ) : (
                    <div className="w-full max-w-sm space-y-6">
                        {profile?.link_status === 'pending' ? (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 rounded-[3rem] text-center border-2 border-blue-200">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <span className="material-symbols-outlined text-blue-400">hourglass_empty</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Đang chờ nửa kia...</h3>
                                <div className="bg-slate-50 p-6 rounded-[2rem] my-4 border border-blue-50">
                                    <h2 className="text-4xl font-black text-blue-500 tracking-[0.2em] font-mono">{profile.invite_id}</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(profile.invite_id);
                                        alert("Đã sao chép mã!");
                                    }}
                                    className="text-blue-500 font-bold text-xs uppercase flex items-center justify-center gap-2 mx-auto"
                                >
                                    <span className="material-symbols-outlined text-sm">content_copy</span> Sao chép mã
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-[3rem] text-center backdrop-blur-xl border-white/30 shadow-2xl">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="material-symbols-outlined text-3xl text-blue-500">link</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Bắt đầu hành trình</h3>
                                    <p className="text-sm text-slate-500 mb-8 px-4">Tạo mã để "người ấy" cùng tham gia nhé!</p>
                                    <button onClick={() => setShowWarning(true)} className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-all">Tạo mã ngay</button>
                                </motion.div>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/50"></div></div>
                                    <div className="relative flex justify-center text-xs"><span className="px-4 bg-background-light text-slate-400 font-bold uppercase tracking-widest">Hoặc</span></div>
                                </div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-8 rounded-[3rem] backdrop-blur-xl border-white/30 shadow-2xl">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Kết nối bằng mã</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="AB12CD"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                            className="flex-1 bg-white/50 border-none rounded-2xl px-4 py-4 text-center font-mono font-bold text-lg text-slate-700 outline-none ring-2 ring-transparent focus:ring-blue-200 transition-all uppercase"
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
                            </>
                        )}
                    </div>
                )}

                {profile?.link_status === 'paired' && (
                    <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md">
                        <div className="glass p-6 rounded-3xl flex flex-col items-center backdrop-blur-xl border-white/20">
                            <span className="material-symbols-outlined text-blue-500 mb-2">calendar_month</span>
                            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Months</span>
                            <span className="text-2xl font-bold text-slate-800">{Math.floor(daysTogether / 30)}</span>
                        </div>
                        <div className="glass p-6 rounded-3xl flex flex-col items-center backdrop-blur-xl border-white/20">
                            <span className="material-symbols-outlined text-blue-500 mb-2">sparkles</span>
                            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Weeks</span>
                            <span className="text-2xl font-bold text-slate-800">{Math.floor(daysTogether / 7)}</span>
                        </div>
                    </div>
                )}
            </div>

            {profile?.link_status === 'paired' && (
                <div className="px-6 pb-32 z-20">
                    <motion.div whileHover={{ scale: 1.02 }} onClick={() => navigate('/anniversary')} className="glass p-5 rounded-[2.5rem] flex items-center gap-4 backdrop-blur-xl border-white/20 cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="material-symbols-outlined">celebration</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Next Milestone</h4>
                            <p className="text-xs text-slate-500 font-medium">{(Math.floor(daysTogether / 100) + 1) * 100} Days in {((Math.floor(daysTogether / 100) + 1) * 100) - daysTogether} days</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </motion.div>
                </div>
            )}

            {/* Confirm Join Modal */}
            <AnimatePresence>
                {showConfirmModal && senderInfo && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-8 w-full max-w-sm shadow-2xl text-center">
                            <div className="w-20 h-20 rounded-full border-4 border-blue-100 overflow-hidden mx-auto mb-6">
                                <img src={senderInfo.avatar_url || "/api/placeholder/100/100"} alt={senderInfo.nickname} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Kết nối với {senderInfo.nickname}?</h3>
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-8">
                                <p className="text-xs text-orange-600 font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-sm">warning</span> Lưu ý quan trọng
                                </p>
                                <p className="text-xs text-orange-700 leading-relaxed font-medium">Đây là ghép đôi **vĩnh viễn**. Bạn sẽ không thể thay đổi sau khi xác nhận.</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button onClick={confirmJoinInvite} disabled={loading} className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest">{loading ? 'Đang kết nối...' : 'Xác nhận kết nối'}</button>
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setSenderInfo(null);
                                        setActiveInviteId(null);
                                    }}
                                    className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-full"
                                >
                                    Hủy
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Popup (Sender) */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-blue-600/90 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3.5rem] p-10 w-full max-w-md shadow-2xl text-center">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <span className="material-symbols-outlined text-6xl text-blue-500 fill-1">celebration</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">CHÚC MỪNG</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium">Tình yêu đời bạn đã tìm thấy được bạn!!</p>
                            <button onClick={() => window.location.reload()} className="w-full bg-blue-500 text-white font-black py-5 rounded-full shadow-xl shadow-blue-500/40 uppercase">Bắt đầu ngay</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Warning Popup */}
            <AnimatePresence>
                {showWarning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-3xl text-orange-500">warning</span>
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
