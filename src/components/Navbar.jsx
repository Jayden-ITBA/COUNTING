import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="fixed bottom-6 left-6 right-6 glass rounded-full px-6 py-4 z-50 flex items-center justify-between">
            <NavLink to="/" className={({ isActive }) => isActive ? "text-blue-500 fill-1" : "text-slate-400"}>
                <span className="material-symbols-outlined">home</span>
            </NavLink>
            <NavLink to="/anniversary" className={({ isActive }) => isActive ? "text-blue-500 fill-1" : "text-slate-400"}>
                <span className="material-symbols-outlined">calendar_month</span>
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
