export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  currency: string;
  createdAt: any;
}

export interface AIResponse {
  success: boolean;
  intent: 'logging' | 'querying';
  transaction?: Partial<Transaction>;
  message: string;
  needsMoreInfo: boolean;
  missingFields?: string[];
}
