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
        <div className="fixed inset-0 z-[200] bg-neutral-50 flex flex-col items-center justify-center p-6 pb-20 overflow-hidden">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-12"
            >
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500 shadow-sm border border-rose-100/50">
                    <iconify-icon icon="solar:lock-password-bold-duotone" width="40" height="40"></iconify-icon>
                </div>
                <h2 className="text-2xl font-black text-neutral-800 tracking-tight">{getTitle()}</h2>
                <p className="text-neutral-400 text-sm font-medium mt-2">{getSubtitle()}</p>
                {error && (
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-rose-500 text-xs font-black uppercase tracking-widest mt-4"
                    >
                        Mã PIN không khớp, thử lại nhé!
                    </motion.p>
                )}
            </motion.div>

            <div className="flex gap-6 mb-16">
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-neutral-800 border-neutral-800 scale-125 shadow-lg' : 'border-neutral-200'}`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-8 w-full max-w-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num.toString())}
                        className="w-16 h-16 rounded-full bg-white border border-neutral-100 shadow-sm text-2xl font-black text-neutral-800 active:scale-90 active:bg-neutral-50 transition-all flex items-center justify-center mx-auto"
                    >
                        {num}
                    </button>
                ))}
                <div />
                <button
                    onClick={() => handleNumberClick('0')}
                    className="w-16 h-16 rounded-full bg-white border border-neutral-100 shadow-sm text-2xl font-black text-neutral-800 active:scale-90 active:bg-neutral-50 transition-all flex items-center justify-center mx-auto"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="w-16 h-16 rounded-full text-neutral-300 active:text-neutral-800 active:scale-90 transition-all flex items-center justify-center mx-auto"
                >
                    <iconify-icon icon="solar:backspace-bold" width="32" height="32"></iconify-icon>
                </button>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center">
                <p className="text-[10px] text-neutral-300 font-black uppercase tracking-[0.4em]">Bảo mật bởi Counting</p>
            </div>
        </div>
    );
};

export default AppLock;
