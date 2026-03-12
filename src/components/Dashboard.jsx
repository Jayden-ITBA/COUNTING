import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { doc, onSnapshot, updateDoc, writeBatch, collection, query, where, orderBy, limit, getDocs, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { generatePairingCode } from '../utils/pairing_utils';
import { getDashboardLabel } from '../utils/ui_helpers';
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
    const [showReceiverSuccess, setShowReceiverSuccess] = useState(false);

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
            const senderUid = senderInfo.uid || senderInfo.id;

            if (!senderUid) {
                throw new Error("Không tìm thấy UID người gửi");
            }

            const coupleId = `${senderUid}_${auth.currentUser.uid}`;

            batch.set(doc(db, 'couples', coupleId), {
                uids: [senderUid, auth.currentUser.uid],
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

    return (
        <div className="bg-neutral-50 flex items-center justify-center min-h-screen antialiased text-neutral-900 selection:bg-rose-100 selection:text-rose-900">
            {/* App Container */}
            <main className="w-full max-w-md bg-white min-h-screen sm:min-h-[850px] sm:max-h-[900px] sm:rounded-[2.5rem] sm:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-y-auto sm:border sm:border-neutral-100 sm:my-8 pb-32">
                
                {/* Subtle Background Glow */}
                <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-rose-50/80 via-rose-50/20 to-transparent pointer-events-none -z-10"></div>

                <header className="flex justify-between items-center p-6 sticky top-0 bg-white/50 backdrop-blur-xl z-50 border-b border-transparent transition-all duration-300">
                    <div className="flex items-center gap-1">
                        <div className="font-semibold text-base tracking-tight text-neutral-800 uppercase tracking-[0.15em] text-xs">OUR LITTLE CORNER</div>
                    </div>
                    <button onClick={() => navigate('/notifications')} className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors rounded-full hover:bg-neutral-50 relative">
                        <iconify-icon icon="solar:bell-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </header>

                {profile?.link_status === 'paired' ? (
                    <>
                        {/* Main Counter */}
                        <section className="flex flex-col items-center mt-6 px-6">
                            <div className="relative group cursor-pointer">
                                <h1 className="text-8xl font-light text-neutral-900 tabular-nums transition-transform duration-300 group-hover:scale-105" style={{ letterSpacing: '-0.06em' }}>
                                    {daysTogether}
                                </h1>
                                <div className="absolute -bottom-2 -right-4 bg-white shadow-sm border border-neutral-100 rounded-full px-2.5 py-1 flex items-center gap-1 transform rotate-6">
                                    <iconify-icon icon="solar:fire-linear" width="14" height="14" class="text-orange-500" style={{ strokeWidth: 1.5 }}></iconify-icon>
                                    <span className="text-xs font-semibold text-neutral-700">Streak</span>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-rose-500 uppercase tracking-[0.2em] mt-6">
                                {getDashboardLabel(profile)}
                            </p>
                        </section>

                        {/* Couple Avatars */}
                        <section className="flex justify-center items-center gap-4 mt-12 px-6">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] relative transition-transform hover:scale-105">
                                    <img src={profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"} alt="You" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-sm font-medium text-neutral-700 tracking-tight">{profile?.nickname || 'Bạn'}</span>
                            </div>

                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100 text-rose-400 z-10 -mt-8 relative animate-pulse">
                                <iconify-icon icon="solar:heart-angle-linear" width="20" height="20" style={{ strokeWidth: 1.5 }}></iconify-icon>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] relative transition-transform hover:scale-105">
                                    <img src={partnerProfile?.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80"} alt="Partner" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-sm font-medium text-neutral-700 tracking-tight">{partnerProfile?.nickname || 'Người ấy'}</span>
                            </div>
                        </section>

                        {/* Info Grid */}
                        <section className="px-6 mt-14 grid grid-cols-2 gap-4">
                            <div className="bg-neutral-50/50 hover:bg-neutral-50 transition-colors border border-neutral-100/80 rounded-3xl p-4 flex flex-col gap-8 cursor-default">
                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-500">
                                    <iconify-icon icon="solar:calendar-date-linear" width="16" height="16" style={{ strokeWidth: 1.5 }}></iconify-icon>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400 font-medium mb-1 uppercase tracking-wider">Started</p>
                                    <p className="text-sm font-semibold text-neutral-800 tracking-tight">
                                        {coupleData?.anniversary_date ? (coupleData.anniversary_date.toDate ? coupleData.anniversary_date.toDate() : new Date(coupleData.anniversary_date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-neutral-50/50 hover:bg-neutral-50 transition-colors border border-neutral-100/80 rounded-3xl p-4 flex flex-col gap-8 cursor-default relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/30 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-rose-500 relative z-10">
                                    <iconify-icon icon="solar:star-linear" width="16" height="16" style={{ strokeWidth: 1.5 }}></iconify-icon>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs text-neutral-400 font-medium mb-1 uppercase tracking-wider">Milestone</p>
                                    <p className="text-sm font-semibold text-neutral-800 tracking-tight">
                                        {(Math.floor(daysTogether / 100) + 1) * 100} Days
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Upcoming Timeline */}
                        <section className="px-6 mt-10">
                            <div className="flex justify-between items-end mb-5">
                                <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Sự kiện sắp tới</h2>
                                <button onClick={() => navigate('/anniversary')} className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors">See all</button>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                {partnerProfile?.birthday && (
                                    <div className="group flex items-center gap-4 p-3.5 rounded-2xl bg-white border border-neutral-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] hover:border-neutral-200 transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-neutral-50 text-neutral-600 flex flex-col items-center justify-center">
                                            <span className="text-xs font-medium uppercase tracking-wider opacity-70 mb-0.5">
                                                {new Date(partnerProfile.birthday).toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-sm font-semibold leading-none">
                                                {new Date(partnerProfile.birthday).getDate()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-neutral-800 tracking-tight group-hover:text-rose-600 transition-colors">
                                                Sinh nhật {partnerProfile.nickname}
                                            </h3>
                                            <p className="text-xs text-neutral-500 mt-1">Sắp tới rồi đó!</p>
                                        </div>
                                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-300 group-hover:text-neutral-500 group-hover:bg-neutral-50 transition-all">
                                            <iconify-icon icon="solar:alt-arrow-right-linear" width="18" height="18" style={{ strokeWidth: 1.5 }}></iconify-icon>
                                        </button>
                                    </div>
                                )}
                                <div className="group flex items-center gap-4 p-3.5 rounded-2xl bg-white border border-neutral-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] hover:border-neutral-200 transition-all cursor-pointer">
                                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex flex-col items-center justify-center">
                                        <span className="text-xs font-medium uppercase tracking-wider opacity-70 mb-0.5">Feb</span>
                                        <span className="text-sm font-semibold leading-none">14</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-neutral-800 tracking-tight group-hover:text-rose-600 transition-colors">Valentine's Day</h3>
                                        <p className="text-xs text-neutral-500 mt-1">Lễ tình yêu</p>
                                    </div>
                                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-300 group-hover:text-neutral-500 group-hover:bg-neutral-50 transition-all">
                                        <iconify-icon icon="solar:alt-arrow-right-linear" width="18" height="18" style={{ strokeWidth: 1.5 }}></iconify-icon>
                                    </button>
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <div className="px-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
                        {profile?.link_status === 'pending' ? (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-neutral-50/50 border border-neutral-100 rounded-[2.5rem] p-8">
                                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <iconify-icon icon="solar:hourglass-linear" width="32" height="32" class="text-rose-400"></iconify-icon>
                                </div>
                                <h3 className="text-xl font-bold text-neutral-800">Đang chờ nửa kia...</h3>
                                <div className="bg-white p-6 rounded-3xl my-6 border border-neutral-100 shadow-sm">
                                    <h2 className="text-4xl font-black text-rose-500 tracking-[0.2em] font-mono">{profile.invite_id}</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(profile.invite_id);
                                        alert("Đã sao chép mã!");
                                    }}
                                    className="text-rose-500 font-bold text-xs uppercase flex items-center justify-center gap-2 mx-auto tracking-widest"
                                >
                                    <iconify-icon icon="solar:copy-linear" width="16" height="16"></iconify-icon> Sao chép mã
                                </button>
                            </motion.div>
                        ) : (
                            <div className="w-full max-w-sm space-y-6">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-neutral-100 rounded-[2.5rem] p-8 shadow-sm">
                                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <iconify-icon icon="solar:link-linear" width="32" height="32" class="text-rose-400"></iconify-icon>
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-800 mb-2">Bắt đầu hành trình</h3>
                                    <p className="text-sm text-neutral-400 mb-8 px-4">Tạo mã để "người ấy" cùng tham gia nhé!</p>
                                    <button onClick={() => setShowWarning(true)} className="w-full bg-neutral-900 text-white font-bold py-4 rounded-full shadow-lg hover:bg-neutral-800 transition-all">Tạo mã ngay</button>
                                </motion.div>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-100"></div></div>
                                    <div className="relative flex justify-center text-[10px]"><span className="px-4 bg-white text-neutral-300 font-bold uppercase tracking-widest">Hoặc</span></div>
                                </div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-neutral-100 rounded-[2.5rem] p-8 shadow-sm">
                                    <h3 className="text-base font-bold text-neutral-800 mb-4">Kết nối bằng mã</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="AB12CD"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                            className="flex-1 bg-neutral-50 border-none rounded-2xl px-4 py-4 text-center font-mono font-bold text-lg text-neutral-700 outline-none ring-2 ring-transparent focus:ring-rose-100 transition-all uppercase"
                                            maxLength={6}
                                        />
                                        <button
                                            onClick={() => handlePrepareJoin(manualCode)}
                                            disabled={manualCode.length !== 6 || loading}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${manualCode.length === 6 ? 'bg-neutral-900 text-white shadow-lg' : 'bg-neutral-50 text-neutral-200'}`}
                                        >
                                            <iconify-icon icon="solar:alt-arrow-right-linear" width="24" height="24"></iconify-icon>
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}
            </main>

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
                                    <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16"></iconify-icon> Lưu ý quan trọng
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
                                <iconify-icon icon="solar:magic-stick-3-linear" width="64" height="64" class="text-blue-500"></iconify-icon>
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
                                <iconify-icon icon="solar:danger-triangle-linear" width="32" height="32" class="text-orange-500"></iconify-icon>
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
                                Bạn chuẩn bị lên xe bông với tình yêu của mình. <br /> Hãy đợi xe tới nhé {'<3 <3'}
                            </p>

                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-rose-500 text-white font-black py-5 rounded-full shadow-xl shadow-rose-500/40 hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-widest uppercase"
                            >
                                Bắt đầu ngay
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Navbar profile={profile} />
        </div>
    );
};

export default Dashboard;
