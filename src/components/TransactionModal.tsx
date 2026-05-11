import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import { db } from '../firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { formatCurrency } from '../lib/formatter';
import { useFirebase } from '../firebase/FirebaseContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface TransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, isOpen, onClose }) => {
  const { user } = useFirebase();
  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData(transaction);
      setShowConfirmDelete(false);
    }
  }, [transaction]);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
      authInfo: {
        userId: user?.uid,
        email: user?.email,
      }
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    alert("Có lỗi xảy ra: " + (error instanceof Error ? error.message : "Vui lòng thử lại"));
  };

  const handleUpdate = async () => {
    if (!transaction?.id || loading || !user) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'transactions', transaction.id);
      await updateDoc(docRef, {
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description || '',
        type: formData.type,
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transaction.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction?.id || loading || !user) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'transactions', transaction.id);
      await deleteDoc(docRef);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${transaction.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && transaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel w-full max-w-md overflow-hidden relative z-10 flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-display">Chi tiết giao dịch</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Loại giao dịch</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`py-3 rounded-2xl font-bold transition-all border ${
                      formData.type === 'income' 
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                    }`}
                  >
                    Thu nhập
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`py-3 rounded-2xl font-bold transition-all border ${
                      formData.type === 'expense' 
                        ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                    }`}
                  >
                    Chi tiêu
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Số tiền (₫)</label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Hạng mục</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="VD: Ăn uống, Di chuyển..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Ghi chú</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                  rows={2}
                  placeholder="Mô tả chi tiết..."
                />
              </div>
            </div>

            <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3 relative overflow-hidden">
              <AnimatePresence>
                {showConfirmDelete ? (
                  <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="absolute inset-0 bg-slate-900 z-20 flex items-center justify-between px-6 border-t border-white/5"
                  >
                    <span className="text-sm font-bold text-white">Bạn chắc chứ?</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowConfirmDelete(false)}
                        className="px-4 py-2 text-slate-400 font-bold hover:text-white transition-colors"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={handleDelete}
                        disabled={loading}
                        className="px-6 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Xóa ngay"}
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button
                onClick={() => setShowConfirmDelete(true)}
                disabled={loading}
                className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={18} />
                Xóa
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-[2] py-4 bg-white text-slate-950 hover:bg-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Lưu thay đổi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
