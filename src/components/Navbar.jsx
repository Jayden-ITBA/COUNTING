import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Navbar = ({ profile }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (profile?.couple_id) {
            const q = query(
                collection(db, 'notifications'),
                where('couple_id', '==', profile.couple_id),
                where('recipient_id', '==', auth.currentUser.uid),
                where('read', '==', false)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                setUnreadCount(snapshot.size);
            });

            return () => unsubscribe();
        }
    }, [profile]);

    return (
        <nav className="fixed bottom-6 left-6 right-6 glass rounded-full px-6 py-4 z-50 flex items-center justify-between shadow-2xl border border-white/20">
            <NavLink to="/" className={({ isActive }) => isActive ? "text-blue-500 fill-1" : "text-slate-400"}>
                <span className="material-symbols-outlined">home</span>
            </NavLink>
            <NavLink to="/anniversary" className={({ isActive }) => isActive ? "text-blue-500 fill-1" : "text-slate-400"}>
                <span className="material-symbols-outlined">calendar_month</span>
            </NavLink>
            <NavLink to="/notifications" className={({ isActive }) => isActive ? "text-blue-500 fill-1" : "text-slate-400"}>
                <div className="relative">
                    <span className="material-symbols-outlined">notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </NavLink>
            <NavLink to="/diary" className={({ isActive }) => isActive ? "text-blue-500 fill-1" : "text-slate-400"}>
                <span className="material-symbols-outlined">auto_stories</span>
            </NavLink>
            <NavLink to="/album" className={({ isActive }) => isActive ? "text-blue-500 fill-1" : "text-slate-400"}>
                <span className="material-symbols-outlined">photo_library</span>
            </NavLink>
            <NavLink to="/settings/background" className={({ isActive }) => isActive ? "text-blue-500 fill-1" : "text-slate-400"}>
                <span className="material-symbols-outlined">settings</span>
            </NavLink>
        </nav>
    );
};

export default Navbar;
