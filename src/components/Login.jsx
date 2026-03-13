import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect, getRedirectResult, FacebookAuthProvider } from 'firebase/auth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { isInAppBrowser } from '../utils/browser_detection';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const from = location.state?.from || "/";

    useEffect(() => {
        const checkRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    const savedPath = localStorage.getItem('redirectPath') || "/";
                    localStorage.removeItem('redirectPath');
                    navigate(savedPath, { replace: true });
                }
            } catch (error) {
                console.error("Redirect Result Error:", error);
                localStorage.removeItem('redirectPath');
            }
        };
        checkRedirect();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate(from, { replace: true });
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
            localStorage.setItem('redirectPath', from);
            await signInWithRedirect(auth, provider);
        } catch (error) {
            console.error("Google Login Error:", error);
            alert("Đăng nhập Google thất bại!");
        }
    };

    const handleFacebookLogin = async () => {
        try {
            const provider = new FacebookAuthProvider();
            localStorage.setItem('redirectPath', from);
            await signInWithRedirect(auth, provider);
        } catch (error) {
            console.error("Facebook Login Error:", error);
            alert("Đăng nhập Facebook thất bại!");
        }
    };

    const inApp = isInAppBrowser();

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

            {inApp && (
                <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed top-4 left-4 right-4 z-[100] bg-blue-500 text-white p-5 rounded-[2rem] shadow-2xl flex items-start gap-4 backdrop-blur-md"
                >
                    <iconify-icon icon="solar:danger-bold" width="28" height="28" class="shrink-0"></iconify-icon>
                    <div className="text-[13px]">
                        <p className="font-extrabold mb-1 uppercase tracking-widest">Trình duyệt không hỗ trợ!</p>
                        <p className="opacity-90 font-medium">
                            Hãy bấm vào <span className="font-bold">dấu 3 chấm</span> và chọn <span className="font-bold">"Mở bằng trình duyệt"</span> để đăng nhập nhé.
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="w-full max-w-md z-20 flex flex-col items-center">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-12 flex flex-col items-center text-center"
                >
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-blue-200/40 border border-white relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                        <iconify-icon icon="solar:heart-bold-duotone" width="56" height="56" class="text-primary"></iconify-icon>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tighter">Our Little Corner</h1>
                    <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] px-6">Mỗi giây chúng ta bên nhau là mỗi giây hạnh phúc. Cám ơn và Thương em</p>
                    </div>
                </motion.div>

                <div className="w-full bg-white rounded-[3.5rem] p-10 shadow-xl shadow-blue-100/50 border border-blue-50">
                    <form onSubmit={handleLogin} className="space-y-6">
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
                                    placeholder="Nhập email của bạn"
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
                                    className="w-full bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-100 rounded-full py-5 pl-16 pr-16 text-slate-900 font-bold transition-all outline-none placeholder:text-slate-300"
                                    placeholder="Nhập mật khẩu"
                                    type={showPassword ? "text" : "password"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                >
                                    <iconify-icon icon={showPassword ? 'solar:eye-closed-bold-duotone' : 'solar:eye-bold-duotone'} width="24" height="24"></iconify-icon>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end px-4">
                            <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Quên mật khẩu?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:brightness-110 text-white font-black py-5 rounded-full shadow-lg shadow-blue-200 transition-all active:scale-[0.98] mt-4 uppercase tracking-[0.2em] text-xs"
                        >
                            {loading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>
                    </form>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-50"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px]">
                            <span className="px-5 bg-white text-slate-300 font-black uppercase tracking-widest">Hoặc đăng nhập với</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-6">
                        <button type="button" onClick={handleGoogleLogin} className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-50 hover:bg-slate-50 transition-all active:scale-90">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-7 h-7" alt="Google" />
                        </button>
                        <button type="button" onClick={handleFacebookLogin} className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-50 hover:bg-slate-50 transition-all active:scale-90">
                            <iconify-icon icon="logos:facebook" width="30" height="30"></iconify-icon>
                        </button>
                    </div>
                </div>

                <div className="text-center mt-12 mb-12">
                    <p className="text-slate-400 text-sm font-medium">
                        Bạn chưa có tài khoản?
                        <Link to="/signup" className="text-primary font-extrabold ml-2 hover:underline">Đăng ký ngay</Link>
                    </p>
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">Designed with love by You</p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
