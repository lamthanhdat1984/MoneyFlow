import { db } from '../firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface MonthSummary {
  month: number;
  year: number;
  income: number;
  expense: number;
}

export async function getFinancialContext(userId: string): Promise<string> {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const summaries: Record<string, { income: number, expense: number, categories: Record<string, number> }> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!summaries[key]) {
        summaries[key] = { income: 0, expense: 0, categories: {} };
      }
      
      if (data.type === 'income') {
        summaries[key].income += data.amount;
      } else {
        summaries[key].expense += data.amount;
        const cat = data.category || 'Khác';
        summaries[key].categories[cat] = (summaries[key].categories[cat] || 0) + data.amount;
      }
    });

    const now = new Date();
    let context = `Current User Time: ${now.toISOString()} (Local: ${now.toLocaleString('vi-VN')})\n`;
    context += "Financial Summary:\n";
    Object.entries(summaries).forEach(([period, data]) => {
      context += `- ${period}: Thu nhập: ${data.income.toLocaleString('vi-VN')}₫, Chi tiêu: ${data.expense.toLocaleString('vi-VN')}₫\n`;
      if (Object.keys(data.categories).length > 0) {
        context += `  Chi tiết chi tiêu: ${Object.entries(data.categories)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, amt]) => `${cat}: ${amt.toLocaleString('vi-VN')}₫`)
          .join(', ')}\n`;
      }
    });

    context += "\nRecent Transactions List:\n";
    const recentTxs = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
        return {
          rawDate: date,
          dateStr: date.toLocaleDateString('vi-VN'),
          description: data.description,
          amount: data.amount,
          type: data.type === 'income' ? 'Thu' : 'Chi',
          category: data.category
        };
      })
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
      .slice(0, 50);

    recentTxs.forEach(tx => {
      context += `- ${tx.dateStr}: ${tx.type} ${tx.amount.toLocaleString('vi-VN')}₫ | ${tx.description} (${tx.category})\n`;
    });

    return context || "No transaction data available yet.";
  } catch (error) {
    console.error("Error fetching financial context:", error);
    return "Error retrieving financial data.";
  }
}
