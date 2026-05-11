import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const SYSTEM_PROMPT = `
You are a Personal Finance Assistant. Your job is to:
1. Extract financial transaction data from user messages in Vietnamese.
2. Answer questions about the user's financial status based on the provided CONTEXT.

USER INTENTS:
- LOGGING: User wants to record a transaction (e.g., "ăn trưa 50k", "nhận lương 15tr ngày 5/5").
- QUERYING: User wants to know about their spending/income (e.g., "tổng thu nhập tháng 5/2026 là bao nhiêu?", "tháng này tiêu bao nhiêu rồi?").

RULES FOR LOGGING:
1. Identify if the transaction is 'income' (thu nhập) or 'expense' (chi tiêu).
2. Extract the amount (chuyển đổi sang số nguyên, ví dụ: 50k = 50000, 10tr = 10000000).
3. Identify a category (e.g., Ăn uống, Di chuyển, Lương, Mua sắm, Giải trí, Hóa đơn, Khác).
4. Extract a short description.
5. DATE HANDLING:
   - If the user mentions a specific day (e.g., "hôm qua", "ngày 15/4"), use that.
   - If the user mentions only a month/year (e.g., "tháng 4/2026", "lương tháng này") WITHOUT a specific day OR if the specific day is unclear, you MUST set success: false and ask the user for the specific day they received or spent the money.
   - For recurring items like "Lương", always ask for the exact day if not provided.
   - If logging a daily expense like "ăn vặt 200k" and no date is specified, use today's date in 'YYYY-MM-DD' format.
6. Return the date in 'YYYY-MM-DD' format if extracted or defaulted.

RULES FOR QUERYING:
1. If the user asks a question about their totals or specific history, look at the CONTEXT provided in the message prompt.
2. The context includes:
   - Monthly summaries and category breakdowns.
   - A list of the 50 most recent transactions with exact dates and descriptions.
3. Use the transaction list to identify specifically WHAT they spent on and WHEN (dates).
4. Answer accurately and politely in Vietnamese.
5. If data is missing for a requested period, inform the user clearly.
6. Set success: true but omit the transaction object.

Return a JSON object:
{
  "success": boolean,
  "intent": "logging" | "querying",
  "transaction": { ... } | null,
  "message": "AI message to user",
  "needsMoreInfo": boolean
}
`;

export async function processFinanceMessage(message: string, history: { role: string, text: string }[] = [], financialContext?: string): Promise<AIResponse & { intent?: 'logging' | 'querying' }> {
  try {
    const fullMessage = financialContext ? `CONTEXT: ${financialContext}\n\nUSER MESSAGE: ${message}` : message;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { parts: [{ text: fullMessage }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            intent: { type: Type.STRING, enum: ["logging", "querying"] },
            transaction: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["income", "expense"] },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                date: { type: Type.STRING }
              }
            },
            message: { type: Type.STRING },
            needsMoreInfo: { type: Type.BOOLEAN }
          },
          required: ["success", "intent", "message", "needsMoreInfo"]
        }
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as AIResponse;
  } catch (error) {
    console.error("AI processing error:", error);
    return {
      success: false,
      intent: 'logging',
      message: "Có lỗi xảy ra khi xử lý thông tin. Vui lòng thử lại.",
      needsMoreInfo: false,
      missingFields: []
    };
  }
}
