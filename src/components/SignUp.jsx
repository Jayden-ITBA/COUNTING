import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const SignUp = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update Auth Profile
            await updateProfile(user, { displayName: nickname });

            // Create Firestore Profile
            await setDoc(doc(db, 'profiles', user.uid), {
                uid: user.uid,
                nickname: nickname,
                email: email,
                avatar_url: '',
                link_status: 'none',
                created_at: serverTimestamp()
            });

            const location = useLocation();
            const from = location.state?.from || "/";
            navigate('/onboarding', { state: { from } });
        } catch (error) {
            console.error("Sign Up Error:", error);
            alert("Đăng ký thất bại! " + error.message);
        } finally {
            setLoading(false);
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

            <div className="w-full max-w-md z-20 flex flex-col items-center">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8 flex flex-col items-center"
                >
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-4 border-primary/20 shadow-sm">
                        <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight">Tham gia LoveDays</h1>
                    <p className="text-slate-500 text-center text-sm px-4">Bắt đầu hành trình lưu giữ kỷ niệm tình yêu của riêng bạn</p>
                </motion.div>

                <form onSubmit={handleSignUp} className="w-full space-y-5 px-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 ml-5">Biệt danh</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                            <input
                                required
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary rounded-full py-4 pl-14 pr-6 text-slate-900 transition-all outline-none"
                                placeholder="Bạn tên là gì nhỉ?"
                                type="text"
                            />
                        </div>
                    </div>

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
                                className="w-full bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary rounded-full py-4 pl-14 pr-6 text-slate-900 transition-all outline-none"
                                placeholder="Tạo mật khẩu bảo mật"
                                type="password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:brightness-105 text-white font-bold py-4 rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2"
                    >
                        {loading ? "Đang tạo tài khoản..." : "Đăng ký ngay"}
                    </button>
                </form>

                <div className="text-center mt-12 mb-8">
                    <p className="text-slate-500 text-sm">
                        Đã có tài khoản?
                        <Link to="/login" className="text-primary font-bold ml-1 hover:underline">Đăng nhập</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
