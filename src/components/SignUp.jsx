import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const SignUp = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user) {
                await setDoc(doc(db, 'profiles', user.uid), {
                    uid: user.uid,
                    nickname: nickname,
                    email: email,
                    link_status: 'none',
                    created_at: serverTimestamp()
                });

                const from = location.state?.from || "/";
                navigate('/onboarding', { state: { from } });
            }
        } catch (error) {
            console.error("Sign Up Error:", error);
            alert("Đăng ký thất bại! " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-[#f0f7ff] overflow-y-auto font-sans">
            {/* Background Pattern */}
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
                    className="mb-12 flex flex-col items-center text-center"
                >
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-blue-200/40 border border-white">
                        <iconify-icon icon="solar:heart-bold-duotone" width="56" height="56" class="text-primary"></iconify-icon>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter">Bắt Đầu Nhật Ký</h1>
                    <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">Love is in the air</p>
                </motion.div>

                <div className="w-full bg-white rounded-[3.5rem] p-10 shadow-xl shadow-blue-100/50 border border-blue-50">
                    <form onSubmit={handleSignUp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Biệt danh</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                    <iconify-icon icon="solar:user-bold-duotone" width="24" height="24"></iconify-icon>
                                </div>
                                <input
                                    required
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="w-full bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-100 rounded-full py-5 pl-16 pr-6 text-slate-900 font-bold transition-all outline-none placeholder:text-slate-300"
                                    placeholder="Cục cưng gọi bạn là gì?"
                                    type="text"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Email</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                    <iconify-icon icon="solar:letter-bold-duotone" width="24" height="24"></iconify-icon>
                                </div>
                                <input
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-100 rounded-full py-5 pl-16 pr-6 text-slate-900 font-bold transition-all outline-none placeholder:text-slate-300"
                                    placeholder="yourname@gmail.com"
                                    type="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Mật khẩu</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                    <iconify-icon icon="solar:lock-keyhole-bold-duotone" width="24" height="24"></iconify-icon>
                                </div>
                                <input
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-100 rounded-full py-5 pl-16 pr-6 text-slate-900 font-bold transition-all outline-none placeholder:text-slate-300"
                                    placeholder="Tạo mật khẩu bảo mật"
                                    type="password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:brightness-110 text-white font-black py-5 rounded-full shadow-lg shadow-blue-200 transition-all active:scale-[0.98] mt-4 uppercase tracking-[0.2em] text-xs"
                        >
                            {loading ? "Đang tạo tài khoản..." : "Đăng ký ngay"}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-12 mb-12">
                    <p className="text-slate-400 text-sm font-medium">
                        Đã có tài khoản?
                        <Link to="/login" className="text-primary font-extrabold ml-2 hover:underline">Đăng nhập</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
