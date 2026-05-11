import React from 'react';
import { LogIn } from 'lucide-react';
import { signInWithGoogle } from '../firebase/config';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-panel p-10 shadow-2xl shadow-indigo-500/10 text-center relative z-10"
      >
        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20">
          <span className="text-white text-4xl font-bold font-display">AI</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-display">Fin AI</h1>
        <p className="text-slate-400 mb-10 text-sm leading-relaxed">Trợ lý quản lý thu chi cá nhân thông minh. Chỉ cần nhắn tin, AI lo tất.</p>
        
        <button
          onClick={signInWithGoogle}
          className="w-full py-4 px-6 bg-white text-slate-950 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" className="w-5 h-5" alt="Google" />
          Tiếp tục với Google
        </button>
        
        <p className="mt-10 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          An toàn • Bảo mật • Thông minh
        </p>
      </motion.div>
    </div>
  );
};
