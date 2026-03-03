import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, collection, query, where, limit } from 'firebase/firestore';
import Navbar from './Navbar';

const Pairing = ({ profile, onUpdate }) => {
    const { inviteId: urlInviteId } = useParams();
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inviteData, setInviteData] = useState(null);
    const [partnerProfile, setPartnerProfile] = useState(null);

    // Initial check for join URL
    useEffect(() => {
        if (urlInviteId && profile) {
            // Even if link_status is pending, if the URL invite ID is different, we want to switch
            if (profile.link_status === 'none' || (profile.link_status === 'pending' && profile.invite_id !== urlInviteId)) {
                handleJoinInvite(urlInviteId);
            }
        }
    }, [urlInviteId, profile]);

    // Real-time listener for current user's invite if pending
    useEffect(() => {
        if (profile?.link_status === 'pending' && profile?.invite_id) {
            const unsubscribe = onSnapshot(doc(db, 'invites', profile.invite_id), async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setInviteData(data);
                    if (data.status === 'accepted' && data.receiver_id) {
                        const partnerId = data.sender_id === auth.currentUser.uid ? data.receiver_id : data.sender_id;
                        const pSnap = await getDoc(doc(db, 'profiles', partnerId));
                        if (pSnap.exists()) setPartnerProfile(pSnap.data());
                    } else if (data.status === 'approved') {
                        onUpdate(); // Refresh profile in parent
                        navigate('/');
                    }
                }
            });
            return () => unsubscribe();
        }
    }, [profile, onUpdate, navigate]);

    const handleCreateLink = () => setShowWarning(true);

    const confirmCreateLink = async () => {
        setLoading(true);
        const inviteId = Math.random().toString(36).substring(2, 10);
        const link = `${window.location.origin}/join/${inviteId}`;

        try {
            await setDoc(doc(db, 'invites', inviteId), {
                id: inviteId,
                sender_id: auth.currentUser.uid,
                status: 'pending',
                receiver_id: null,
                created_at: serverTimestamp()
            });

            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
                link_status: 'pending',
                invite_id: inviteId
            });

            setShowWarning(false);
            onUpdate();
        } catch (error) {
            alert("Lỗi khi tạo link mời!");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinInvite = async (invId) => {
        try {
            const iSnap = await getDoc(doc(db, 'invites', invId));
            if (!iSnap.exists()) return alert("Link không tồn tại!");

            const data = iSnap.data();
            if (data.status !== 'pending') return alert("Link này đã hết hạn!");
            if (data.sender_id === auth.currentUser.uid) return navigate('/settings/pairing');

            await updateDoc(doc(db, 'invites', invId), {
                status: 'accepted',
                receiver_id: auth.currentUser.uid
            });

            await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
                link_status: 'pending',
                invite_id: invId
            });

            onUpdate();
        } catch (error) {
            console.error("Join error:", error);
        }
    };

    const handleApprovePartner = async () => {
        if (!inviteData || !inviteData.receiver_id) return;
        setLoading(true);

        try {
            const coupleId = `${inviteData.sender_id}_${inviteData.receiver_id}`;
            const now = new Date();

            await setDoc(doc(db, 'couples', coupleId), {
                uids: [inviteData.sender_id, inviteData.receiver_id],
                anniversary_date: now,
                created_at: serverTimestamp()
            });

            await updateDoc(doc(db, 'invites', inviteData.id), { status: 'approved' });

            await updateDoc(doc(db, 'profiles', inviteData.sender_id), {
                link_status: 'paired',
                partner_id: inviteData.receiver_id,
                couple_id: coupleId
            });

            await updateDoc(doc(db, 'profiles', inviteData.receiver_id), {
                link_status: 'paired',
                partner_id: inviteData.sender_id,
                couple_id: coupleId
            });

            onUpdate();
            navigate('/');
        } catch (error) {
            alert("Lỗi khi phê duyệt!");
        } finally {
            setLoading(false);
        }
    };

    const inviteLink = profile?.invite_id ? `${window.location.origin}/join/${profile.invite_id}` : '';

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-slate-800">Kết nối cặp đôi</h1>
                <p className="text-slate-500">Mối quan hệ vĩnh viễn (No-Unpair)</p>
            </div>

            <div className="px-6">
                {profile?.link_status === 'none' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-8 rounded-[3rem] text-center"
                    >
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-blue-500">link</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Tạo link mời độc bản</h3>
                        <p className="text-sm text-slate-500 mb-8">
                            Gửi link này cho "người ấy" để bắt đầu hành trình đếm ngày của hai bạn.
                        </p>
                        <button
                            onClick={handleCreateLink}
                            disabled={loading}
                            className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
                        >
                            {loading ? "Đang xử lý..." : "Tạo link ngay"}
                        </button>
                    </motion.div>
                )}

                {profile?.link_status === 'pending' && (() => {
                    const isSender = inviteData?.sender_id === auth.currentUser.uid;

                    return (
                        <div className="space-y-6">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="glass p-8 rounded-[3rem] text-center border-2 border-blue-200"
                            >
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <span className="material-symbols-outlined text-blue-400">hourglass_empty</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Phòng chờ kết nối</h3>
                                <p className="text-xs text-slate-400 mb-6 uppercase tracking-widest font-bold">
                                    {inviteData?.status === 'accepted' ? 'Đã có người tham gia' : 'Đang chờ đối phương'}
                                </p>

                                {isSender && (
                                    <>
                                        <div className="bg-slate-100 p-4 rounded-2xl flex items-center gap-3 mb-4">
                                            <input
                                                readOnly
                                                value={inviteLink}
                                                className="bg-transparent border-none text-[10px] text-slate-500 flex-1 outline-none truncate"
                                                onClick={(e) => e.target.select()}
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(inviteLink);
                                                    alert("Đã sao chép!");
                                                }}
                                                className="text-blue-500 font-bold text-xs uppercase"
                                            >
                                                Sao chép
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400">Gửi link này cho partner của bạn.</p>
                                    </>
                                )}

                                {!isSender && inviteData?.status === 'accepted' && (
                                    <p className="text-sm text-slate-500">
                                        Bạn đã chấp nhận lời mời. Đang chờ {partnerProfile?.nickname || 'đối phương'} phê duyệt để hoàn tất kết nối.
                                    </p>
                                )}
                            </motion.div>

                            {inviteData?.status === 'accepted' && partnerProfile && (
                                <div className="glass p-5 rounded-3xl">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4">
                                        {isSender ? "Yêu cầu đang chờ duyệt" : "Thông tin đối phương"}
                                    </h4>
                                    <div className="flex items-center gap-3 bg-white/50 p-3 rounded-2xl">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                            <img src={partnerProfile.avatar_url || "/api/placeholder/50/50"} alt="Avatar" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-700">{partnerProfile.nickname}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {isSender ? "Vừa nhấn vào link của bạn" : "Người gửi lời mời cho bạn"}
                                            </p>
                                        </div>
                                        {isSender && (
                                            <button
                                                onClick={handleApprovePartner}
                                                disabled={loading}
                                                className="bg-blue-500 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-md"
                                            >
                                                {loading ? "..." : "DUYỆT"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {profile?.link_status === 'paired' && (
                    <div className="glass p-8 rounded-[3rem] text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-green-500">verified</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Đã kết nối thành công!</h3>
                        <p className="text-sm text-slate-500 mb-8">
                            Hai bạn hiện đang trong trạng thái "Gắn bó vĩnh viễn".
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-slate-800 text-white font-bold py-4 rounded-full shadow-lg active:scale-95 transition-transform"
                        >
                            Về Dashboard
                        </button>
                    </div>
                )}
            </div>

            {/* Warning Popup */}
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
                                Bạn chỉ có thể kết nối với **một người duy nhất** và không thể thay đổi sau này. Bạn có chắc chắn muốn tiếp tục?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmCreateLink}
                                    disabled={loading}
                                    className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/20"
                                >
                                    {loading ? "Đang tạo..." : "Tôi đã hiểu và tiếp tục"}
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

            <Navbar />
        </div>
    );
};

export default Pairing;
