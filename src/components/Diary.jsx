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
    const [deletingEntryId, setDeletingEntryId] = useState(null);
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingEntry, setEditingEntry] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editDate, setEditDate] = useState('');

    useEffect(() => {
        if (profile?.couple_id) {
            const q = query(
                collection(db, 'diaries'),
                where('couple_id', '==', profile.couple_id),
                orderBy('entry_date', 'desc')
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
                entry_date: entryDate,
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

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setEditContent(entry.content);
        setEditDate(entry.entry_date || (entry.created_at ? new Date(entry.created_at.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingEntry) return;
        try {
            await updateDoc(doc(db, 'diaries', editingEntry.id), {
                content: editContent,
                entry_date: editDate
            });
            setEditingEntry(null);
        } catch (error) {
            alert("Lỗi khi cập nhật: " + error.message);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#f8faff] pb-32 font-sans">
            <header className="px-6 pt-16 pb-8 flex justify-between items-end border-b border-blue-50 bg-[#f8faff]/80 backdrop-blur-md sticky top-0 z-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Góc tâm tình</h1>
                    <p className="text-primary/60 text-[10px] font-black mt-1 uppercase tracking-[0.3em]">Nơi mà chúng ta gửi cho nhau những ngọt ngào và tâm tình</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(!isExpended)}
                    className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100/50"
                >
                    <iconify-icon icon={isExpended ? "solar:close-circle-bold-duotone" : "solar:add-circle-bold-duotone"} width="24" height="24"></iconify-icon>
                </motion.button>
            </header>

            <AnimatePresence>
                {isExpended && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="px-6 mb-8 mt-6"
                    >
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[3rem] border border-blue-50 shadow-2xl shadow-blue-100/30 space-y-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Hôm nay chúng ta yêu thương nhau như thế nào?"
                                className="w-full bg-blue-50/30 rounded-[2rem] p-6 text-sm outline-none resize-none min-h-[140px] text-slate-700 border border-blue-50/50 focus:bg-white focus:border-primary/30 transition-all font-medium"
                            />

                            <div className="flex items-center gap-3 px-2">
                                <iconify-icon icon="solar:calendar-bold-duotone" width="20" height="20" class="text-primary"></iconify-icon>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn ngày kỉ niệm:</span>
                                <input 
                                    type="date" 
                                    value={entryDate}
                                    onChange={(e) => setEntryDate(e.target.value)}
                                    className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2 text-xs font-bold text-primary outline-none focus:border-primary/30"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="w-16 h-16 rounded-2xl bg-blue-50 overflow-hidden relative group border border-blue-50 shadow-sm">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            className="w-full h-full object-cover"
                                            alt="Preview"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                                            className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                        >
                                            <iconify-icon icon="solar:close-circle-bold" width="20" height="20"></iconify-icon>
                                        </button>
                                    </div>
                                ))}
                                <label className="w-16 h-16 rounded-2xl border-2 border-dashed border-blue-100 flex items-center justify-center text-blue-300 cursor-pointer hover:border-primary hover:text-primary transition-all bg-blue-50/20">
                                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                                    <iconify-icon icon="solar:gallery-add-bold-duotone" width="28" height="28"></iconify-icon>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || (!content.trim() && selectedFiles.length === 0)}
                                className="w-full bg-primary text-white font-black py-5 rounded-full shadow-lg shadow-blue-100 active:scale-95 transition-all text-[11px] uppercase tracking-widest disabled:opacity-50"
                            >
                                {uploading ? 'Đang đăng tải...' : 'Lưu khoảnh khắc'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingEntry && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[4rem] p-10 w-full max-w-sm shadow-2xl border-8 border-white/20">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tighter uppercase text-center">CHỈNH SỬA KỈ NIỆM</h3>
                            
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nội dung</label>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full bg-blue-50/30 rounded-[2rem] p-6 text-sm outline-none resize-none min-h-[120px] text-slate-700 border border-blue-50/50 focus:bg-white focus:border-primary/30 transition-all font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ngày kỉ niệm</label>
                                    <input 
                                        type="date" 
                                        value={editDate}
                                        onChange={(e) => setEditDate(e.target.value)}
                                        className="w-full bg-blue-50/50 border border-blue-100 rounded-[1.5rem] px-6 py-4 text-xs font-bold text-primary outline-none focus:border-primary/30"
                                    />
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    <button type="submit" className="w-full bg-primary text-white font-black py-5 rounded-full shadow-2xl shadow-blue-100 active:scale-95 transition-all uppercase tracking-widest text-[11px]">Cập nhật ngay</button>
                                    <button type="button" onClick={() => setEditingEntry(null)} className="w-full py-2 text-slate-300 font-black text-[10px] uppercase tracking-widest">Hủy bỏ</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="px-6 space-y-10 pt-8">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-blue-50 rounded-[4rem] shadow-xl shadow-blue-100/20">
                        <iconify-icon icon="solar:ghost-bold-duotone" width="64" height="64" className="text-blue-100 mb-6"></iconify-icon>
                        <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.4em]">Kỉ niệm còn trống trơn...</p>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className="relative group">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-7 rounded-[3rem] border border-blue-50/50 shadow-2xl shadow-blue-100/20 group-hover:shadow-blue-100/50 transition-all duration-500"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1.25rem] border-4 border-white shadow-lg overflow-hidden bg-blue-50">
                                            <img src={entry.author_avatar || "https://api.dicebear.com/7.x/avataaars/svg"} alt={entry.author_name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-slate-800 tracking-tight">{entry.author_name}</h4>
                                            <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-1 opacity-60">
                                                {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('vi-VN', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                }) : (entry.created_at ? new Date(entry.created_at.seconds * 1000).toLocaleDateString('vi-VN', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'Vừa xong')}
                                            </p>
                                        </div>
                                    </div>

                                    {entry.author_id === auth.currentUser.uid && (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="text-slate-200 hover:text-primary transition-colors"
                                            >
                                                <iconify-icon icon="solar:pen-new-square-linear" width="18" height="18"></iconify-icon>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="text-slate-200 hover:text-primary transition-colors"
                                            >
                                                <iconify-icon icon="solar:trash-bin-trash-linear" width="18" height="18"></iconify-icon>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-slate-600 text-[15px] leading-relaxed mb-6 whitespace-pre-wrap font-medium">
                                    {entry.content}
                                </p>

                                {entry.media && entry.media.length > 0 && (
                                    <div className={`grid gap-4 ${entry.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {entry.media.map((item, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setSelectedMedia(item)}
                                                className="aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-lg border border-blue-50 bg-blue-50/20 cursor-pointer hover:opacity-90 transition-opacity"
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

                                <div className="mt-8 flex items-center gap-8 border-t border-blue-50/50 pt-6">
                                    <button
                                        onClick={() => handleLike(entry.id, entry.likes)}
                                        className={`flex items-center gap-2.5 transition-all ${entry.likes?.includes(auth.currentUser.uid) ? 'text-primary scale-110' : 'text-slate-300 hover:text-primary'}`}
                                    >
                                        <iconify-icon icon={entry.likes?.includes(auth.currentUser.uid) ? "solar:heart-bold-duotone" : "solar:heart-linear"} width="22" height="22"></iconify-icon>
                                        <span className="text-[11px] font-black uppercase tracking-wider">{entry.likes?.length || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveComment(activeComment === entry.id ? null : entry.id)}
                                        className={`flex items-center gap-2.5 transition-all ${activeComment === entry.id ? 'text-slate-900 border-b-2 border-primary/20' : 'text-slate-300 hover:text-slate-900'}`}
                                    >
                                        <iconify-icon icon="solar:chat-line-bold-duotone" width="22" height="22"></iconify-icon>
                                        <span className="text-[11px] font-black uppercase tracking-wider">{entry.comments?.length || 0}</span>
                                    </button>
                                </div>

                                {/* Comments Section */}
                                <AnimatePresence>
                                    {activeComment === entry.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-6 space-y-5 overflow-hidden"
                                        >
                                            <div className="space-y-4 pt-6 border-t border-blue-50/30">
                                                {entry.comments?.map(comment => (
                                                    <div key={comment.id} className="flex gap-4">
                                                        <img src={comment.author_avatar} className="w-8 h-8 rounded-xl shadow-md border-2 border-white" alt="" />
                                                        <div className="flex-1 bg-blue-50/30 rounded-[1.5rem] px-5 py-4 border border-blue-50/50">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em]">{comment.author_name}</span>
                                                            </div>
                                                            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{comment.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <form onSubmit={(e) => handleComment(e, entry.id)} className="flex gap-3 pt-3">
                                                <input
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    placeholder="Ý kiến giề !!"
                                                    className="flex-1 bg-blue-50/30 border border-blue-50 shadow-inner rounded-full px-7 py-4 text-xs outline-none focus:bg-white focus:border-primary/40 transition-all font-medium"
                                                />
                                                <button type="submit" className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 active:scale-90 transition-all">
                                                    <iconify-icon icon="solar:send-bold-duotone" width="20" height="20"></iconify-icon>
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
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[4rem] p-12 w-full max-w-sm shadow-2xl text-center border-8 border-white/20">
                            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-primary animate-bounce shadow-xl shadow-blue-100/50">
                                <iconify-icon icon="solar:trash-bin-trash-bold-duotone" width="48" height="48"></iconify-icon>
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter uppercase">XÓA SAO?</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-12 font-medium">
                                Tiếc lắm ó !!! Kỷ niệm này đẹp mà,<br/>bạn có chắc chắn muốn xóa không?
                            </p>
                            <div className="flex flex-col gap-4">
                                <button onClick={confirmDelete} className="w-full bg-primary text-white font-black py-5 rounded-full shadow-2xl shadow-blue-100 active:scale-95 transition-all uppercase tracking-widest text-[11px]">Xóa vĩnh viễn</button>
                                <button onClick={() => { setShowDeleteModal(false); setDeletingEntryId(null); }} className="w-full py-2 text-slate-300 font-black text-[10px] uppercase tracking-widest">Giữ lại kỉ niệm</button>
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
