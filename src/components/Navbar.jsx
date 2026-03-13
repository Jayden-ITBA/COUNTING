import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';

const Navbar = () => {
    const { profile, couple, notifications } = useData();
    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    return (
        <nav className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-neutral-100 pb-safe pt-2 px-6 z-50">
            <div className="flex justify-between items-center h-16 max-w-sm mx-auto relative">
                <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-primary' : 'text-neutral-400'}`}>
                    {({ isActive }) => (
                        <>
                            {isActive && <div className="absolute -top-3 left-[12.5%] w-1.5 h-1.5 bg-primary rounded-full shadow-lg shadow-blue-200"></div>}
                            <iconify-icon icon="solar:home-smile-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        </>
                    )}
                </NavLink>

                <NavLink to="/anniversary" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-primary' : 'text-neutral-400'}`}>
                    {({ isActive }) => (
                        <>
                            {isActive && <div className="absolute -top-3 left-[37.5%] w-1.5 h-1.5 bg-primary rounded-full shadow-lg shadow-blue-200"></div>}
                            <iconify-icon icon="solar:calendar-date-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        </>
                    )}
                </NavLink>

                <div className="w-16 h-full flex items-center justify-center -mt-6">
                    <NavLink 
                        to="/diary" 
                        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all bg-cover bg-center ${!couple?.diary_button_url ? 'bg-neutral-900 shadow-neutral-900/20' : 'shadow-blue-200/40 border border-white/50'}`}
                        style={{ 
                            backgroundImage: couple?.diary_button_url ? `url(${couple.diary_button_url})` : 'none' 
                        }}
                    >
                        {!couple?.diary_button_url && (
                            <iconify-icon icon="solar:add-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        )}
                    </NavLink>
                </div>

                <NavLink to="/album" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-primary' : 'text-neutral-400'}`}>
                    {({ isActive }) => (
                        <>
                            {isActive && <div className="absolute -top-3 left-[62.5%] w-1.5 h-1.5 bg-primary rounded-full shadow-lg shadow-blue-200"></div>}
                            <iconify-icon icon="solar:gallery-wide-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        </>
                    )}
                </NavLink>

                <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-primary' : 'text-neutral-400'}`}>
                    {({ isActive }) => (
                        <>
                            {isActive && <div className="absolute -top-3 left-[87.5%] w-1.5 h-1.5 bg-primary rounded-full shadow-lg shadow-blue-200"></div>}
                            <iconify-icon icon="solar:user-linear" width="24" height="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
                        </>
                    )}
                </NavLink>
            </div>
        </nav>
    );
};

export default Navbar;
