import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AppLock = ({ onVerified, mode = 'verify', currentPin }) => {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState(mode === 'set' ? 'enter' : 'verify');
    const [error, setError] = useState(false);

    const handleNumberClick = (num) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);

            if (newPin.length === 4) {
                if (step === 'verify') {
                    if (newPin === currentPin) {
                        onVerified(newPin);
                    } else {
                        setError(true);
                        setTimeout(() => {
                            setPin('');
                            setError(false);
                        }, 500);
                    }
                } else if (step === 'enter') {
                    setConfirmPin(newPin);
                    setPin('');
                    setStep('confirm');
                } else if (step === 'confirm') {
                    if (newPin === confirmPin) {
                        onVerified(newPin);
                    } else {
                        setError(true);
                        setTimeout(() => {
                            setPin('');
                            setStep('enter');
                            setError(false);
                        }, 500);
                    }
                }
            }
        }
    };

    const handleDelete = () => setPin(pin.slice(0, -1));

    const getTitle = () => {
        if (step === 'verify') return 'Mật mã bảo vệ';
        if (step === 'enter') return 'Thiết lập mã PIN';
        if (step === 'confirm') return 'Xác nhận mã PIN';
    };

    const getSubtitle = () => {
        if (step === 'verify') return 'Nhập mã PIN để mở khóa ứng dụng';
        if (step === 'enter') return 'Vui lòng nhập 4 chữ số bảo mật';
        if (step === 'confirm') return 'Nhập lại mã PIN để xác nhận';
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#f8faff] flex flex-col items-center justify-center p-8 pb-24 overflow-hidden font-sans">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-16"
            >
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-primary shadow-xl shadow-blue-100/50 border border-blue-50">
                    <iconify-icon icon="solar:lock-password-bold-duotone" width="48" height="48"></iconify-icon>
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{getTitle()}</h2>
                <p className="text-slate-400 text-sm font-bold mt-3 uppercase tracking-widest">{getSubtitle()}</p>
                {error && (
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em] mt-6"
                    >
                        Mật mã không đúng, thử lại nhé!
                    </motion.p>
                )}
            </motion.div>

            <div className="flex gap-8 mb-20">
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`w-6 h-6 rounded-2xl border-2 transition-all duration-300 ${pin.length > i ? 'bg-primary border-primary scale-125 shadow-lg shadow-blue-200' : 'border-slate-200'}`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-x-10 gap-y-8 w-full max-w-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num.toString())}
                        className="w-16 h-16 rounded-3xl bg-white border border-blue-50 shadow-sm text-2xl font-black text-slate-800 active:scale-90 active:bg-blue-50 transition-all flex items-center justify-center mx-auto"
                    >
                        {num}
                    </button>
                ))}
                <div />
                <button
                    onClick={() => handleNumberClick('0')}
                    className="w-16 h-16 rounded-3xl bg-white border border-blue-50 shadow-sm text-2xl font-black text-slate-800 active:scale-90 active:bg-blue-50 transition-all flex items-center justify-center mx-auto"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="w-16 h-16 rounded-3xl text-slate-300 active:text-primary active:scale-90 transition-all flex items-center justify-center mx-auto"
                >
                    <iconify-icon icon="solar:backspace-bold-duotone" width="32" height="32"></iconify-icon>
                </button>
            </div>

            <div className="absolute bottom-16 flex flex-col items-center">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em] italic">SECURED BY COUNTING</p>
            </div>
        </div>
    );
};

export default AppLock;
