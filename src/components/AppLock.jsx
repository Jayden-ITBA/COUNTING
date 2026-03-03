import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        if (step === 'verify') return 'Nhập mã PIN để mở khóa';
        if (step === 'enter') return 'Thiết lập mã PIN mới';
        if (step === 'confirm') return 'Xác nhận mã PIN mới';
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 pb-20">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-12"
            >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-3xl text-blue-500">lock</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">{getTitle()}</h2>
                {error && <p className="text-red-500 text-xs font-bold mt-2">Mã PIN không khớp, vui lòng thử lại!</p>}
            </motion.div>

            <div className="flex gap-4 mb-16">
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
                        className={`w-4 h-4 rounded-full border-2 border-blue-200 transition-all ${pin.length > i ? 'bg-blue-500 border-blue-500 scale-125' : ''}`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num.toString())}
                        className="w-16 h-16 rounded-full glass text-2xl font-bold text-slate-700 active:bg-blue-500 active:text-white transition-all flex items-center justify-center mx-auto"
                    >
                        {num}
                    </button>
                ))}
                <div />
                <button
                    onClick={() => handleNumberClick('0')}
                    className="w-16 h-16 rounded-full glass text-2xl font-bold text-slate-700 active:bg-blue-500 active:text-white transition-all flex items-center justify-center mx-auto"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="w-16 h-16 rounded-full text-slate-400 active:text-blue-500 flex items-center justify-center mx-auto"
                >
                    <span className="material-symbols-outlined">backspace</span>
                </button>
            </div>
        </div>
    );
};

export default AppLock;
