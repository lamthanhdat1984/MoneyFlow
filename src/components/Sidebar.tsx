import React from 'react';
import { Home, MessageSquare, PieChart, Settings, LogOut, Menu, X, Plus } from 'lucide-react';
import { useFirebase } from '../firebase/FirebaseContext';
import { logout } from '../firebase/config';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { user } = useFirebase();

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Tổng quan' },
    { id: 'chat', icon: MessageSquare, label: 'Trợ lý AI' },
    { id: 'analytics', icon: PieChart, label: 'Phân tích' },
    { id: 'settings', icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -300 }}
        className={`fixed inset-y-0 left-0 w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 pl-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold">AI</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">Fin AI</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                  activeTab === item.id
                    ? 'bg-white/10 text-white border border-white/10 shadow-lg shadow-black/5'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/20">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Home size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate text-white">{user?.displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium text-sm">Đăng xuất</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
