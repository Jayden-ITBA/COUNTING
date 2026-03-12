import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import Navbar from './Navbar';

const Album = () => {
    const { profile } = useData();
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState(null);

    useEffect(() => {
        if (profile?.couple_id) {
            const q = query(
                collection(db, 'diaries'),
                where('couple_id', '==', profile.couple_id),
                orderBy('created_at', 'desc')
            );
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const results = [];
                snapshot.forEach(doc => {
                    const entry = doc.data();
                    if (entry.media && Array.isArray(entry.media)) {
                        entry.media.forEach((item, index) => {
                            results.push({
                                id: `${doc.id}-${index}`,
                                url: item.url,
                                type: item.type,
                                title: entry.content ? entry.content.substring(0, 30) : 'Moment',
                                date: entry.created_at?.toDate ? entry.created_at.toDate() : (entry.created_at ? new Date(entry.created_at) : null)
                            });
                        });
                    }
                });
                setMediaList(results);
                setLoading(false);
            }, (error) => {
                console.error("Album listener error:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [profile]);

    return (
        <div className="relative min-h-screen bg-neutral-50 pb-32">
            <header className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Album kỷ niệm</h1>
                <p className="text-neutral-400 text-xs font-medium mt-1 uppercase tracking-widest">Tình yêu trong từng hơi thở</p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : mediaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-20 px-10 text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-8">
                        <iconify-icon icon="solar:camera-square-linear" width="48" height="48" className="text-neutral-200"></iconify-icon>
                    </div>
                    <p className="text-neutral-400 text-sm font-medium leading-relaxed">Chưa có ảnh nào trong album. Hãy chia sẻ khoảnh khắc đầu tiên trong Nhật ký nhé!</p>
                </div>
            ) : (
                <div className="px-4 columns-2 gap-4 space-y-4">
                    {mediaList.map((photo, index) => (
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedMedia(photo)}
                            className="break-inside-avoid relative group cursor-pointer"
                        >
                            <div className="rounded-[2rem] overflow-hidden bg-white border border-neutral-100 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                {photo.type === 'video' ? (
                                    <video src={photo.url} className="w-full h-auto object-cover" />
                                ) : (
                                    <img src={photo.url} alt={photo.title} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" />
                                )}
                            </div>
                            <div className="absolute inset-x-2 bottom-2 p-4 bg-white/40 backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] text-neutral-800">
                                <p className="text-[10px] font-black uppercase tracking-widest truncate">{photo.title}</p>
                                <p className="text-[8px] font-bold opacity-60 mt-0.5">{photo.date?.toLocaleDateString('vi-VN')}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Media Zoom Modal */}
            <AnimatePresence>
                {selectedMedia && (
                    <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl" onClick={() => setSelectedMedia(null)}>
                        <button className="absolute top-10 right-10 text-white hover:scale-125 transition-transform">
                             <iconify-icon icon="solar:close-circle-bold" width="32" height="32"></iconify-icon>
                        </button>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-5xl max-h-[85vh] w-full" onClick={e => e.stopPropagation()}>
                            {selectedMedia.type === 'video' ? (
                                <video src={selectedMedia.url} controls autoPlay className="w-full h-full object-contain rounded-[3rem]" />
                            ) : (
                                <img src={selectedMedia.url} className="w-full h-full object-contain rounded-[3rem]" alt="Zoomed" />
                            )}
                            <div className="mt-8 text-center px-6">
                                <p className="text-white text-xl font-bold tracking-tight">{selectedMedia.title}</p>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2">{selectedMedia.date?.toLocaleDateString('vi-VN', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Navbar />
        </div>
    );
};

export default Album;

