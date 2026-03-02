import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const Widgets = () => {
    return (
        <div className="relative min-h-screen bg-background-light pb-32">
            <div className="px-6 pt-16 pb-8">
                <h1 className="text-3xl font-bold text-slate-800">Widget Designs</h1>
                <p className="text-slate-500">Xem trước giao diện Widget</p>
            </div>

            <div className="px-6 space-y-8">
                {/* Small Widget */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Small (1x1)</h4>
                    <div className="w-32 h-32 glass rounded-[2rem] p-4 flex flex-col items-center justify-center shadow-xl">
                        <span className="material-symbols-outlined text-blue-500 text-2xl fill-1 mb-1">favorite</span>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">520</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Days</p>
                    </div>
                </div>

                {/* Medium Widget */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medium (2x1)</h4>
                    <div className="w-full max-w-xs h-32 glass rounded-[2rem] p-5 flex items-center justify-between shadow-xl">
                        <div className="flex -space-x-3">
                            <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-100" />
                            <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-200" />
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tighter">520 <span className="text-sm text-blue-500">Days</span></h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Jayden vs Summer</p>
                        </div>
                    </div>
                </div>

                {/* Large Widget */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Large (2x2)</h4>
                    <div className="w-full max-w-xs aspect-square glass rounded-[3rem] p-6 shadow-xl flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 tracking-tighter">520 <span className="text-sm text-blue-500">Days</span></h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Together Since Oct 2024</p>
                            </div>
                            <span className="material-symbols-outlined text-blue-400 fill-1">sparkles</span>
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="bg-blue-50/50 p-3 rounded-2xl flex items-center gap-3">
                                <span className="material-symbols-outlined text-sm text-blue-500">celebration</span>
                                <span className="text-[10px] font-bold text-slate-600">200 Ngày (Apr 20)</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
                                <span className="material-symbols-outlined text-sm text-slate-300">history_edu</span>
                                <span className="text-[10px] font-bold text-slate-400 italic">"Lần đầu đi xem phim..."</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                            <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">✨ Keep Loving ✨</span>
                        </div>
                    </div>
                </div>
            </div>

            <Navbar />
        </div>
    );
};

export default Widgets;
