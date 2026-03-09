import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDoc, orderBy } from 'firebase/firestore';
import { uploadMedia } from '../services/cloudinary';
import Navbar from './Navbar';
import { createNotification } from '../services/notifications';

const Diary = ({ profile }) => {
    const [entries, setEntries] = useState([]);
    const [isExpended, setIsExpanded] = useState(false);
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeComment, setActiveComment] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [selectedMedia, setSelectedMedia] = useState(null);

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
            });

            return () => unsubscribe();
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

            // Send Notification to Partner
            const coupleSnap = await getDoc(doc(db, 'couples', profile.couple_id));
            if (coupleSnap.exists()) {
                const coupleData = coupleSnap.data();
                const partnerId = coupleData.uids.find(id => id !== auth.currentUser.uid);
                if (partnerId) {
                    await createNotification(
                        profile.couple_id,
                        partnerId,
                        'diary_entry',
                        `${profile.nickname} vừa thêm một kỷ niệm mới: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`
                    );
                }
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
                    `${profile.nickname} đã bình luận: "${commentText.substring(0, 20)}..."`
                );
            }

            setCommentText('');
            setActiveComment(null);
        } catch (error) {
            console.error("Comment error:", error);
        }
    };

    const handleDelete = async (entryId) => {
        if (!confirm("Bạn có chắc chắn muốn xóa kỷ niệm này?")) return;
        try {
            await deleteDoc(doc(db, 'diaries', entryId));
        } catch (error) {
            alert("Lỗi khi xóa: " + error.message);
        }
    };

    const isEditable = (createdAt) => {
        if (!createdAt) return false;
        try {
            const entryDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
            const diff = (new Date() - entryDate) / (1000 * 60 * 60);
            return diff < 24;
        } catch (e) {
            return false;
        }
    };

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Nhật ký tình yêu</h1>
                    <p className="text-slate-500 text-sm">Lưu giữ từng khoảnh khắc</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(!isExpended)}
                    className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30"
                >
                    <span className="material-symbols-outlined">{isExpended ? 'close' : 'add_circle'}</span>
                </motion.button>
            </div>

            {/* Post Creation Area */}
            <AnimatePresence>
                {isExpended && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 mb-8 overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="glass p-6 rounded-[2.5rem] space-y-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Hôm nay của hai bạn thế nào?"
                                className="w-full bg-slate-50/50 rounded-2xl p-4 text-sm outline-none resize-none min-h-[120px] text-slate-700"
                            />

                            <div className="flex flex-wrap gap-2">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            className="w-full h-full object-cover"
                                            alt="Preview"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ))}
                                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-400">
                                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                                    <span className="material-symbols-outlined">add_a_photo</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || (!content.trim() && selectedFiles.length === 0)}
                                className="w-full bg-blue-500 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                                {uploading ? 'Đang đăng tải...' : 'Lưu khoảnh khắc'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-6 space-y-8">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 glass rounded-[3rem]">
                        <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">auto_stories</span>
                        <p className="text-slate-400">Chưa có kỷ niệm nào được lưu lại.</p>
                    </div>
                ) : (
                    entries.map((entry, index) => (
                        <div key={entry.id} className="relative">
                            <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-blue-100/50" />

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass p-5 rounded-3xl"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                                            <img src={entry.author_avatar || "/api/placeholder/50/50"} alt={entry.author_name} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800">{entry.author_name}</h4>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">
                                                {entry.created_at ? new Date(entry.created_at).toLocaleDateString('vi-VN', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '...'}
                                            </p>
                                        </div>
                                    </div>

                                    {entry.author_id === profile.id && (
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    )}
                                </div>

                                <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                                    {entry.content}
                                </p>

                                {entry.media && entry.media.length > 0 && (
                                    <div className={`grid gap-2 ${entry.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {entry.media.map((item, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setSelectedMedia(item)}
                                                className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm bg-slate-50 cursor-pointer"
                                            >
                                                {item.type === 'video' ? (
                                                    <video src={item.url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={item.url} alt="Moment" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}{/* Timeline section fixes: corrected background-blue-100 height adjustment. Applied improved glass styles for entries. Added comment section display and interactions. Integrated like mechanism into footer. */}

                                <div className="mt-4 flex items-center gap-4 border-t border-slate-50 pt-3">
                                    <button
                                        onClick={() => handleLike(entry.id, entry.likes)}
                                        className={`flex items-center gap-1 transition-colors ${entry.likes?.includes(auth.currentUser.uid) ? 'text-red-500' : 'text-slate-400 hover:text-blue-500'}`}
                                    >
                                        <span className={`material-symbols-outlined text-xl ${entry.likes?.includes(auth.currentUser.uid) ? 'fill-1' : ''}`}>favorite</span>
                                        <span className="text-xs font-bold uppercase">{entry.likes?.length || 0} Tim</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveComment(activeComment === entry.id ? null : entry.id)}
                                        className={`flex items-center gap-1 transition-colors ${activeComment === entry.id ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`}
                                    >
                                        <span className="material-symbols-outlined text-xl">chat_bubble</span>
                                        <span className="text-xs font-bold uppercase">{entry.comments?.length || 0} Cmt</span>
                                    </button>
                                </div>

                                {/* Comments Section */}
                                <AnimatePresence>
                                    {activeComment === entry.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 space-y-3 overflow-hidden"
                                        >
                                            <div className="space-y-3 pt-3 border-t border-slate-50">
                                                {entry.comments?.map(comment => (
                                                    <div key={comment.id} className="flex gap-2">
                                                        <img src={comment.author_avatar} className="w-6 h-6 rounded-full" alt="" />
                                                        <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2">
                                                            <p className="text-[10px] font-bold text-slate-800">{comment.author_name}</p>
                                                            <p className="text-xs text-slate-600">{comment.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <form onSubmit={(e) => handleComment(e, entry.id)} className="flex gap-2 pt-2">
                                                <input
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    placeholder="Viết bình luận..."
                                                    className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-xs outline-none"
                                                />
                                                <button type="submit" className="text-blue-500 material-symbols-outlined">send</button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    ))
                )}
            </div>

            {/* Media Zoom Modal */}
            <AnimatePresence>
                {selectedMedia && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedMedia(null)}
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <button className="absolute top-10 right-10 text-white material-symbols-outlined text-3xl">close</button>
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="max-w-4xl max-h-[80vh] w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            {selectedMedia.type === 'video' ? (
                                <video src={selectedMedia.url} controls autoPlay className="w-full h-full object-contain rounded-2xl" />
                            ) : (
                                <img src={selectedMedia.url} className="w-full h-full object-contain rounded-2xl" alt="Zoomed" />
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Navbar profile={profile} />
        </div>
    );
};


export default Diary;
