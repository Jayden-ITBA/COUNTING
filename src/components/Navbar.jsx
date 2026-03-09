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
        <nav className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-neutral-100 pb-safe pt-2 px-6 z-50">
            <div className="flex justify-between items-center h-16 max-w-sm mx-auto relative">
                <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-rose-500' : 'text-neutral-400'}`}>
                    {({ isActive }) => (
                        <>
                            {isActive && <div className="absolute -top-3 left-[12.5%] w-1 h-1 bg-rose-500 rounded-full"></div>}
                            <iconify-icon icon="solar:home-smile-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        </>
                    )}
                </NavLink>

                <NavLink to="/anniversary" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-rose-500' : 'text-neutral-400'}`}>
                    {({ isActive }) => (
                        <>
                            {isActive && <div className="absolute -top-3 left-[37.5%] w-1 h-1 bg-rose-500 rounded-full"></div>}
                            <iconify-icon icon="solar:calendar-date-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        </>
                    )}
                </NavLink>

                <div className="w-16 h-full flex items-center justify-center -mt-6">
                    <NavLink to="/diary" className="w-12 h-12 bg-neutral-900 rounded-full shadow-lg shadow-neutral-900/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform">
                        <iconify-icon icon="solar:add-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                    </NavLink>
                </div>

                <NavLink to="/album" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-rose-500' : 'text-neutral-400'}`}>
                    {({ isActive }) => (
                        <>
                            {isActive && <div className="absolute -top-3 left-[62.5%] w-1 h-1 bg-rose-500 rounded-full"></div>}
                            <iconify-icon icon="solar:gallery-wide-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        </>
                    )}
                </NavLink>

                <NavLink to="/settings/background" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-rose-500' : 'text-neutral-400'}`}>
                    {({ isActive }) => (
                        <>
                            {isActive && <div className="absolute -top-3 left-[87.5%] w-1 h-1 bg-rose-500 rounded-full"></div>}
                            <iconify-icon icon="solar:user-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        </>
                    )}
                </NavLink>
            </div>
        </nav>
    );
};

export default Navbar;
