import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseContext';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/formatter';
import { TrendingUp, TrendingDown, Wallet, Calendar, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { TransactionModal } from './TransactionModal';

export const Dashboard: React.FC = () => {
  const { user } = useFirebase();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Filtering state
  const now = new Date();
  const [viewType, setViewType] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    if (!user) return;

    // Calculate dates for filtering
    const startDate = viewType === 'month' 
      ? new Date(selectedYear, selectedMonth, 1)
      : new Date(selectedYear, 0, 1);
      
    const endDate = viewType === 'month'
      ? new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)
      : new Date(selectedYear, 11, 31, 23, 59, 59);

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      
      // Filter by date on client side
      const txs = allTxs.filter(t => {
        const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return d >= startDate && d <= endDate;
      });

      // Sort manually
      txs.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setRecentTransactions(txs.slice(0, 50)); 

      const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      setSummary({ income, expense, balance: income - expense });

      if (viewType === 'month') {
        const daysInMonth = endDate.getDate();
        const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayStr = `${day < 10 ? '0' : ''}${day}`;
          const dayTxs = txs.filter(t => {
            const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
            return d.getDate() === day && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
          });

          return {
            name: dayStr,
            chi: dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
            thu: dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
          };
        });
        setChartData(dailyData);
      } else {
        // Yearly view: Group by month
        const monthlyData = months.map((m, i) => {
          const monthTxs = txs.filter(t => {
            const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
            return d.getMonth() === i && d.getFullYear() === selectedYear;
          });

          return {
            name: m.replace('Tháng ', 'T'),
            chi: monthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
            thu: monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
          };
        });
        setChartData(monthlyData);
      }
    }, (error) => {
      console.error("Firestore error in Dashboard:", error);
    });

    return unsubscribe;
  }, [user, selectedMonth, selectedYear, viewType]);

  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <TransactionModal 
        transaction={selectedTransaction} 
        isOpen={!!selectedTransaction} 
        onClose={() => setSelectedTransaction(null)} 
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white font-display">Tổng quan tài chính</h2>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setViewType('month')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewType === 'month' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tháng
            </button>
            <button 
              onClick={() => setViewType('year')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewType === 'year' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Năm
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
          {viewType === 'month' && (
            <>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-slate-300 text-sm font-medium py-2 px-3 outline-none cursor-pointer hover:text-white transition-colors"
              >
                {months.map((m, i) => (
                  <option key={i} value={i} className="bg-slate-900">{m}</option>
                ))}
              </select>
              <div className="w-[1px] h-4 bg-white/10"></div>
            </>
          )}
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-slate-300 text-sm font-medium py-2 px-3 outline-none cursor-pointer hover:text-white transition-colors"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-slate-900">{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600/20 backdrop-blur-xl border border-indigo-500/30 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <Wallet size={20} className="text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300/70">Số dư hiện tại</span>
          </div>
          <h2 className="text-3xl font-bold font-display">{formatCurrency(summary.balance)}</h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={20} className="text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng thu nhập</span>
          </div>
          <h2 className="text-3xl font-bold text-emerald-400 font-display">{formatCurrency(summary.income)}</h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown size={20} className="text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng chi tiêu</span>
          </div>
          <h2 className="text-3xl font-bold text-amber-400 font-display">{formatCurrency(summary.expense)}</h2>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="glass-panel p-6 h-[400px]">
          <h3 className="font-bold text-lg mb-6 text-white font-display">
            {viewType === 'month' ? 'Biểu đồ thu chi hàng ngày' : 'Biểu đồ thu chi hàng tháng'}
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #ffffff10', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#f1f5f9' }}
                cursor={{ fill: '#ffffff05' }}
              />
              <Bar dataKey="thu" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="chi" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-white font-display">Giao dịch gần đây</h3>
            <button className="text-sm text-slate-500 hover:text-white transition-colors">Xem tất cả</button>
          </div>
          <div className="space-y-4 flex-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <button 
                  key={tx.id} 
                  onClick={() => setSelectedTransaction(tx)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors group border border-transparent hover:border-white/5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {tx.type === 'income' ? <Plus size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-200">{tx.description || tx.category}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 group-hover:text-slate-500 transition-colors">
                      {tx.category}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <p className="text-sm">Chưa có giao dịch nào.</p>
                <p className="text-xs">Hãy nhắn tin cho AI để bắt đầu!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

