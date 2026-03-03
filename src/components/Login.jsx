import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (error) {
            console.error("Login Error:", error);
            alert("Đăng nhập thất bại! Vui lòng kiểm tra lại email và mật khẩu.");
        } finally {
            setLoading(false);
        }
    };

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
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-background-light overflow-y-auto">
            {/* Soft Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#3B82F6 0.5px, transparent 0.5px), radial-gradient(#3B82F6 0.5px, #f0f7ff 0.5px)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px'
                }}
            />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

            <div className="w-full max-w-md z-20 flex flex-col items-center">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8 flex flex-col items-center"
                >
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-4 border-primary/20 shadow-sm">
                        <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight">LoveDays</h1>
                    <p className="text-slate-500 text-center text-sm">Nơi lưu giữ từng khoảnh khắc hạnh phúc của chúng mình</p>
                </motion.div>

                <form onSubmit={handleLogin} className="w-full space-y-5 px-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 ml-5">Email</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                            <input
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary rounded-full py-4 pl-14 pr-6 text-slate-900 transition-all outline-none"
                                placeholder="Nhập email của bạn"
                                type="email"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 ml-5">Mật khẩu</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                            <input
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary rounded-full py-4 pl-14 pr-14 text-slate-900 transition-all outline-none"
                                placeholder="Nhập mật khẩu"
                                type={showPassword ? "text" : "password"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end px-2">
                        <a className="text-sm font-medium text-primary hover:underline" href="#">Quên mật khẩu?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:brightness-105 text-white font-bold py-4 rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2"
                    >
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </button>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-background-light text-slate-400 font-medium">Hoặc tiếp tục với</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-6 pt-2">
                        <button type="button" onClick={handleGoogleLogin} className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                        </button>
                        <button type="button" onClick={handleFacebookLogin} className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
                            <svg className="w-6 h-6 fill-[#1877F2]" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </button>
                    </div>
                </form>

                <div className="text-center mt-12 mb-8">
                    <p className="text-slate-500 text-sm">
                        Chưa có tài khoản?
                        <Link to="/signup" className="text-primary font-bold ml-1 hover:underline">Đăng ký ngay</Link>
                    </p>
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-xs aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl mb-12 border-4 border-white"
                >
                    <img alt="Couple holding hands" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyPDXLyy7qyT3FqroPDTV3qlqCe2Dweec4NpH3sT6ucoqfGTOUEQ6NKIPljDj1puFLMxAvDUv-kgHXoDT6EdWKnv-avxXicBABvR5Jl0329_-1vI8QwysxcIhu4n_kT6SPfye_lFyxduekOsn7SDAIduFhIQbh1nVnRjRYNudX7f_AyeN-MYGXUQqFPOfSvgRj4Kpb9jtBBS5brKAEAUFbOrmAQ5kglORoUfc_MM0ndlOkHNWc8-Yi_N6kRB9Zuiipgqiq09osMg" />
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
