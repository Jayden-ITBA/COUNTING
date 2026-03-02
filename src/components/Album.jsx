import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Navbar from './Navbar';

const Album = ({ profile }) => {
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.couple_id) {
            const q = query(
                collection(db, 'diary'),
                where('couple_id', '==', profile.couple_id),
                orderBy('created_at', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const results = [];
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.media && Array.isArray(data.media)) {
                        data.media.forEach((item, index) => {
                            results.push({
                                id: `${doc.id}-${index}`,
                                url: item.url,
                                type: item.type,
                                title: data.content ? data.content.substring(0, 30) + '...' : 'Moment',
                                date: data.created_at?.toDate()
                            });
                        });
                    }
                });
                setMediaList(results);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [profile]);

    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-slate-800">Album kỷ niệm</h1>
                <p className="text-slate-500">Khoảnh khắc đáng nhớ</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : mediaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
                    <span className="material-symbols-outlined text-6xl text-blue-100 mb-4 animate-bounce">photo_library</span>
                    <p className="text-slate-400">Chưa có ảnh nào trong album. Hãy chia sẻ khoảnh khắc đầu tiên trong Nhật ký nhé!</p>
                </div>
            ) : (
                <div className="px-4 columns-2 gap-4 space-y-4">
                    {mediaList.map((photo, index) => (
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="break-inside-avoid relative group"
                        >
                            <div className="rounded-2xl overflow-hidden glass shadow-sm bg-white">
                                {photo.type === 'video' ? (
                                    <video src={photo.url} className="w-full h-auto object-cover" />
                                ) : (
                                    <img src={photo.url} alt={photo.title} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" />
                                )}
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl">
                                <p className="text-white text-[10px] font-bold uppercase truncate">{photo.title}</p>
                                <p className="text-white/70 text-[8px]">{photo.date?.toLocaleDateString('vi-VN')}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <Navbar profile={profile} />
        </div>
    );
};

export default Album;
