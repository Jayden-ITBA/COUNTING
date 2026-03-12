import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDoc, orderBy } from 'firebase/firestore';
import { uploadMedia } from '../services/cloudinary';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';
import { createNotification } from '../services/notifications';

const Diary = () => {
    const { profile } = useData();
    const [entries, setEntries] = useState([]);
    const [isExpended, setIsExpanded] = useState(false);
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeComment, setActiveComment] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingEntryId, setDeletingEntryId] = useState(null);

    useEffect(() => {
        if (profile?.couple_id) {
            const q = query(
                collection(db, 'diaries'),
                where('couple_id', '==', profile.couple_id),
                orderBy('created_at', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEntries(data);
                setLoading(false);
            }, (error) => {
                console.error("Diary listener error:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [profile]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && selectedFiles.length === 0) return;
        if (!profile?.couple_id) return alert("Bạn cần kết nối với Partner trước!");

        setUploading(true);
        try {
            const mediaUrls = [];
            for (const file of selectedFiles) {
                const url = await uploadMedia(file);
                mediaUrls.push({ url, type: file.type.startsWith('video') ? 'video' : 'image' });
            }

            await addDoc(collection(db, 'diaries'), {
                couple_id: profile.couple_id,
                author_id: auth.currentUser.uid,
                author_name: profile.nickname,
                author_avatar: profile.avatar_url,
                content,
                media: mediaUrls,
                likes: [],
                comments: [],
                created_at: serverTimestamp()
            });

            // Notify Partner
            const partnerId = profile.partner_id;
            if (partnerId) {
                await createNotification(
                    profile.couple_id,
                    partnerId,
                    'diary_entry',
                    `${profile.nickname} vừa thêm một kỷ niệm mới: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`
                );
            }

            setContent('');
            setSelectedFiles([]);
            setIsExpanded(false);
        } catch (error) {
            console.error("Post error:", error);
            alert("Lỗi khi đăng bài: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleLike = async (entryId, currentLikes = []) => {
        try {
            const uid = auth.currentUser.uid;
            const isLiked = currentLikes.includes(uid);
            const newLikes = isLiked
                ? currentLikes.filter(id => id !== uid)
                : [...currentLikes, uid];

            await updateDoc(doc(db, 'diaries', entryId), {
                likes: newLikes
            });

            // Notify partner if it's a new like
            if (!isLiked) {
                const entry = entries.find(e => e.id === entryId);
                if (entry && entry.author_id !== uid) {
                    await createNotification(
                        profile.couple_id,
                        entry.author_id,
                        'like',
                        `${profile.nickname} đã thích kỷ niệm của bạn!`
                    );
                }
            }
        } catch (error) {
            console.error("Like error:", error);
        }
    };

    const handleComment = async (e, entryId) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const entry = entries.find(e => e.id === entryId);
            const newComment = {
                id: Date.now().toString(),
                author_id: auth.currentUser.uid,
                author_name: profile.nickname,
                author_avatar: profile.avatar_url,
                text: commentText,
                created_at: new Date().toISOString()
            };

            const updatedComments = [...(entry.comments || []), newComment];
            await updateDoc(doc(db, 'diaries', entryId), {
                comments: updatedComments
            });

            // Notify partner
            if (entry.author_id !== auth.currentUser.uid) {
                await createNotification(
                    profile.couple_id,
                    entry.author_id,
                    'comment',
                    `${profile.nickname} có ý kiến: "${commentText.substring(0, 20)}..."`
                );
            }

            setCommentText('');
            setActiveComment(null);
        } catch (error) {
            console.error("Comment error:", error);
        }
    };

    const confirmDelete = async () => {
        if (!deletingEntryId) return;
        try {
            await deleteDoc(doc(db, 'diaries', deletingEntryId));
            setShowDeleteModal(false);
            setDeletingEntryId(null);
        } catch (error) {
            alert("Lỗi khi xóa: " + error.message);
        }
    };

    const handleDelete = (entryId) => {
        setDeletingEntryId(entryId);
        setShowDeleteModal(true);
    };

    return (
        <div className="relative min-h-screen bg-neutral-50 pb-32">
            <header className="px-6 pt-16 pb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Góc tâm tình</h1>
                    <p className="text-neutral-400 text-xs font-medium mt-1 uppercase tracking-widest">Nơi lưu giữ ngọt ngào</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(!isExpended)}
                    className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-neutral-200"
                >
                    <iconify-icon icon={isExpended ? "solar:close-circle-linear" : "solar:add-circle-linear"} width="24" height="24"></iconify-icon>
                </motion.button>
            </header>

            {/* Post Creation Area */}
            <AnimatePresence>
                {isExpended && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="px-6 mb-8"
                    >
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-xl space-y-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Hôm nay chúng ta yêu thương nhau như thế nào?"
                                className="w-full bg-neutral-50 rounded-2xl p-4 text-sm outline-none resize-none min-h-[120px] text-neutral-700 border-none focus:ring-2 focus:ring-rose-100 transition-all"
                            />

                            <div className="flex flex-wrap gap-2">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden relative group border border-neutral-100">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            className="w-full h-full object-cover"
                                            alt="Preview"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                        >
                                            <iconify-icon icon="solar:close-circle-bold" width="20" height="20"></iconify-icon>
                                        </button>
                                    </div>
                                ))}
                                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center text-neutral-400 cursor-pointer hover:border-rose-400 hover:text-rose-400 transition-all bg-neutral-50">
                                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                                    <iconify-icon icon="solar:gallery-add-linear" width="24" height="24"></iconify-icon>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || (!content.trim() && selectedFiles.length === 0)}
                                className="w-full bg-neutral-900 text-white font-bold py-4 rounded-full shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                            >
                                {uploading ? 'Đang tàn tàn...' : 'Lưu lại nào'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-6 space-y-10">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-neutral-100 rounded-[3rem] shadow-sm">
                        <iconify-icon icon="solar:ghost-linear" width="64" height="64" className="text-neutral-200 mb-6"></iconify-icon>
                        <p className="text-neutral-400 font-medium text-sm">Trống trơn hà !! Viết gì đó đi</p>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className="relative group">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm group-hover:shadow-xl transition-shadow duration-500"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-neutral-100">
                                            <img src={entry.author_avatar || "https://api.dicebear.com/7.x/avataaars/svg"} alt={entry.author_name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-neutral-800 tracking-tight">{entry.author_name}</h4>
                                            <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest mt-0.5">
                                                {entry.created_at ? new Date(entry.created_at.seconds * 1000).toLocaleDateString('vi-VN', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'Vừa xong'}
                                            </p>
                                        </div>
                                    </div>

                                    {entry.author_id === auth.currentUser.uid && (
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="text-neutral-200 hover:text-rose-500 transition-colors"
                                        >
                                            <iconify-icon icon="solar:trash-bin-trash-linear" width="18" height="18"></iconify-icon>
                                        </button>
                                    )}
                                </div>

                                <p className="text-neutral-600 text-sm leading-[1.6] mb-5 whitespace-pre-wrap font-medium">
                                    {entry.content}
                                </p>

                                {entry.media && entry.media.length > 0 && (
                                    <div className={`grid gap-3 ${entry.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {entry.media.map((item, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setSelectedMedia(item)}
                                                className="aspect-[4/3] rounded-3xl overflow-hidden shadow-sm bg-neutral-50 cursor-pointer hover:opacity-90 transition-opacity"
                                            >
                                                {item.type === 'video' ? (
                                                    <video src={item.url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={item.url} alt="Moment" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-6 flex items-center gap-6 border-t border-neutral-50 pt-4">
                                    <button
                                        onClick={() => handleLike(entry.id, entry.likes)}
                                        className={`flex items-center gap-2 transition-colors ${entry.likes?.includes(auth.currentUser.uid) ? 'text-rose-500' : 'text-neutral-400 hover:text-rose-500'}`}
                                    >
                                        <iconify-icon icon={entry.likes?.includes(auth.currentUser.uid) ? "solar:heart-bold" : "solar:heart-linear"} width="20" height="20"></iconify-icon>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{entry.likes?.length || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveComment(activeComment === entry.id ? null : entry.id)}
                                        className={`flex items-center gap-2 transition-colors ${activeComment === entry.id ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-900'}`}
                                    >
                                        <iconify-icon icon="solar:chat-line-linear" width="20" height="20"></iconify-icon>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{entry.comments?.length || 0}</span>
                                    </button>
                                </div>

                                {/* Comments Section */}
                                <AnimatePresence>
                                    {activeComment === entry.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-6 space-y-4 overflow-hidden"
                                        >
                                            <div className="space-y-4 pt-6 border-t border-neutral-50">
                                                {entry.comments?.map(comment => (
                                                    <div key={comment.id} className="flex gap-3">
                                                        <img src={comment.author_avatar} className="w-7 h-7 rounded-full shadow-sm" alt="" />
                                                        <div className="flex-1 bg-neutral-50 rounded-[1.25rem] px-4 py-3">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest">{comment.author_name}</span>
                                                            </div>
                                                            <p className="text-xs text-neutral-600 leading-relaxed font-medium">{comment.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <form onSubmit={(e) => handleComment(e, entry.id)} className="flex gap-3 pt-2">
                                                <input
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    placeholder="Gõ gì đó tâm tình..."
                                                    className="flex-1 bg-neutral-50 border border-neutral-100 focus:bg-white focus:border-rose-100 rounded-full px-6 py-3 text-xs outline-none transition-all font-medium"
                                                />
                                                <button type="submit" className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                                                    <iconify-icon icon="solar:send-bold" width="16" height="16"></iconify-icon>
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    ))
                )}
            </div>

            {/* Confirm Delete Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl text-center">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500 animate-pulse">
                                <iconify-icon icon="solar:trash-bin-trash-bold" width="40" height="40"></iconify-icon>
                            </div>
                            <h3 className="text-2xl font-black text-neutral-800 mb-2 tracking-tighter uppercase">XÓA SAO?</h3>
                            <p className="text-sm text-neutral-500 leading-relaxed mb-10 font-medium">
                                Tiếc lắm ó !!! Kỷ niệm này đẹp mà, bạn chắc chứ?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button onClick={confirmDelete} className="w-full bg-rose-500 text-white font-black py-4 rounded-full shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs">Xóa luôn</button>
                                <button onClick={() => { setShowDeleteModal(false); setDeletingEntryId(null); }} className="w-full py-4 text-neutral-300 font-bold text-xs uppercase tracking-widest">Tiếc, để lại</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Media Zoom Modal */}
            <AnimatePresence>
                {selectedMedia && (
                    <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl" onClick={() => setSelectedMedia(null)}>
                        <button className="absolute top-10 right-10 text-white hover:scale-125 transition-transform">
                             <iconify-icon icon="solar:close-circle-bold" width="32" height="32"></iconify-icon>
                        </button>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-4xl max-h-[85vh] w-full" onClick={e => e.stopPropagation()}>
                            {selectedMedia.type === 'video' ? (
                                <video src={selectedMedia.url} controls autoPlay className="w-full h-full object-contain rounded-[2.5rem]" />
                            ) : (
                                <img src={selectedMedia.url} className="w-full h-full object-contain rounded-[2.5rem]" alt="Zoomed" />
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Navbar />
        </div>
    );
};


export default Diary;
