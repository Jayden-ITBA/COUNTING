import React from 'react';
import { motion } from 'framer-motion';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            navigate('/');
        } catch (error) {
            console.error("Google Login Error:", error);
            alert("Đăng nhập Google thất bại!");
        }
    };

    const handleFacebookLogin = async () => {
        try {
            const provider = new FacebookAuthProvider();
            await signInWithPopup(auth, provider);
            navigate('/');
        } catch (error) {
            console.error("Facebook Login Error:", error);
            alert("Đăng nhập Facebook thất bại!");
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-[#f0f7ff] overflow-hidden">
            {/* Soft Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#3B82F6 0.5px, transparent 0.5px), radial-gradient(#3B82F6 0.5px, #f0f7ff 0.5px)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px'
                }}
            />

            {/* Twinkle Mascot Image Placeholder */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="z-20 mb-8"
            >
                <div className="w-24 h-24 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <span className="material-symbols-outlined text-blue-400 text-5xl fill-1">favorite</span>
                </div>
            </motion.div>

            <div className="w-full max-w-md z-20 text-center">
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight font-display">Jayden vs Summer</h1>
                <p className="text-slate-500 mb-12">Nơi lưu giữ từng khoảnh khắc hạnh phúc của chúng mình</p>

                <div className="space-y-4 px-4">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white glass py-4 px-6 rounded-full flex items-center justify-center gap-3 shadow-md border border-white hover:bg-white/60 transition-all active:scale-95 group"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                        <span className="font-bold text-slate-700">Tiếp tục với Google</span>
                    </button>

                    <button
                        onClick={handleFacebookLogin}
                        className="w-full bg-[#1877F2] py-4 px-6 rounded-full flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 text-white"
                    >
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span className="font-bold">Tiếp tục với Facebook</span>
                    </button>

                    <button className="w-full bg-white glass py-4 px-6 rounded-full flex items-center justify-center gap-3 shadow-sm border border-white hover:bg-white/60 transition-all active:scale-95">
                        <span className="material-symbols-outlined text-blue-500">mail</span>
                        <span className="font-semibold text-slate-700">Tiếp tục với Email</span>
                    </button>
                </div>

                <div className="mt-12 text-center px-6">
                    <p className="text-slate-400 text-sm italic">"Love is not finding someone to live with; it's finding someone you can't live without."</p>
                </div>
            </div>

            <div className="absolute bottom-10 flex gap-4 opacity-40">
                <span className="material-symbols-outlined text-blue-300 transform rotate-12">pets</span>
                <span className="material-symbols-outlined text-blue-300 transform -rotate-12">star</span>
                <span className="material-symbols-outlined text-blue-300 transform rotate-45">auto_awesome</span>
            </div>
        </div>
    );
};

export default Login;
