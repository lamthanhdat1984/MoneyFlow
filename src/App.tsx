/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FirebaseProvider, useFirebase } from './firebase/FirebaseContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Chat } from './components/Chat';
import { Menu, X, Plus, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, loading } = useFirebase();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-bold"
        >
          AI
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden relative font-sans">
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[120px]"></div>
      </div>

      <div className="flex w-full relative z-10">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Header (Mobile: Visible) */}
          <header className="lg:hidden p-4 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between sticky top-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20">AI</div>
              <span className="font-bold tracking-tight">Fin AI</span>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
              <img src={user.photoURL || ''} alt="avatar" />
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-6xl mx-auto h-full">
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold tracking-tight font-display text-white">Tổng quan tài chính</h1>
                      <p className="text-slate-400">Chào mừng trở lại, {user.displayName}!</p>
                    </div>
                    <Dashboard />
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full flex flex-col"
                  >
                    <div className="mb-4">
                      <h1 className="text-3xl font-bold tracking-tight font-display text-white">Trợ lý AI</h1>
                      <p className="text-slate-400">Ghi lại thu chi bằng cách nhắn tin tự nhiên.</p>
                    </div>
                    <div className="flex-1 overflow-hidden min-h-[500px]">
                      <Chat onBack={() => setActiveTab('dashboard')} />
                    </div>
                  </motion.div>
                )}
                
                {activeTab === 'analytics' && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-12 text-center"
                  >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                      <PieChart size={40} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Tính năng đang phát triển</h2>
                    <p className="text-slate-400 max-w-sm mx-auto">Chúng tôi đang hoàn thiện bộ công cụ phân tích chuyên sâu cho bạn.</p>
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel overflow-hidden"
                  >
                    <div className="p-8 border-b border-white/5">
                      <h2 className="text-xl font-bold">Cài đặt tài khoản</h2>
                    </div>
                    <div className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">Đơn vị tiền tệ</p>
                          <p className="text-sm text-slate-400">Chọn đơn vị tiền tệ mặc định</p>
                        </div>
                        <select className="bg-white/5 px-4 py-2 rounded-xl outline-none border border-white/10 font-medium text-slate-200 focus:ring-2 focus:ring-indigo-500/50">
                          <option className="bg-slate-900">VND (₫)</option>
                          <option className="bg-slate-900">USD ($)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Action Button (Fixed Bottom) */}
          {activeTab !== 'chat' && (
            <button 
              onClick={() => setActiveTab('chat')}
              className="fixed bottom-8 right-8 p-5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 hover:scale-110 active:scale-95 transition-all z-20 group"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
