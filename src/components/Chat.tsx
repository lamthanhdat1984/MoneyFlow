import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Plus, Check, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processFinanceMessage } from '../services/gemini';
import { getFinancialContext } from '../services/financeService';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseContext';
import { formatCurrency } from '../lib/formatter';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface ChatProps {
  onBack?: () => void;
}

export const Chat: React.FC<ChatProps> = ({ onBack }) => {
  const { user } = useFirebase();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Chào bạn! Hôm nay bạn đã chi tiêu hay nhận được khoản tiền nào chưa? Hãy nhắn cho tôi nhé!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      
      // Fetch financial context to help AI answer queries or distinguish logging
      const financialContext = await getFinancialContext(user.uid);
      
      const result = await processFinanceMessage(userMessage, history, financialContext);

      if (result.success && result.intent === 'logging' && result.transaction) {
        // Parse date from AI or fallback to current
        let transactionDate = new Date();
        if (result.transaction.date && typeof result.transaction.date === 'string') {
          const [year, month, day] = result.transaction.date.split('-').map(Number);
          transactionDate = new Date(year, month - 1, day, 12, 0, 0);
        }

        // Save to Firestore
        try {
          await addDoc(collection(db, 'transactions'), {
            type: result.transaction.type,
            amount: result.transaction.amount,
            category: result.transaction.category,
            description: result.transaction.description || '',
            userId: user.uid,
            date: transactionDate,
            createdAt: serverTimestamp(),
          });
          setMessages(prev => [...prev, { role: 'ai', text: result.message }]);
        } catch (error) {
          console.error("Error saving transaction:", error);
          setMessages(prev => [...prev, { role: 'ai', text: "Tôi đã nhận được thông tin nhưng có lỗi khi lưu vào cơ sở dữ liệu. Bạn kiểm tra lại kết nối mạng nhé!" }]);
          
          const errInfo = {
            error: error instanceof Error ? error.message : String(error),
            operationType: 'write',
            path: 'transactions',
            authInfo: { userId: user.uid, email: user.email }
          };
          console.error('Firestore Error Payload:', JSON.stringify(errInfo));
        }
      } else {
        // Just a query or more info needed
        setMessages(prev => [...prev, { role: 'ai', text: result.message }]);
      }
    } catch (error) {
      console.error("AI processing UI error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Rất tiếc, đã có lỗi khi xử lý. Bạn thử lại nhé!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors lg:hidden"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white font-display">Trợ lý AI Tài Chính</h3>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Đang trực tuyến
            </p>
          </div>
        </div>
        
        {onBack && (
          <button 
            onClick={onBack}
            className="hidden lg:flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-all"
          >
            <ChevronLeft size={14} /> Quay lại
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600/40 text-white rounded-tr-none border border-white/10 shadow-lg shadow-indigo-500/5' 
                : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
              <Loader2 size={16} className="animate-spin text-indigo-400" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 bg-white/5 border-t border-white/5">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhắn tin cho AI..."
            className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
