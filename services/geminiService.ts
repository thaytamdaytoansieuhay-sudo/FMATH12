
import { GoogleGenAI, Type } from "@google/genai";
import { LessonContent, ChatMessage, PracticeConfig, Exercise, TheorySection } from "../types";
import { supabase } from "./supabaseClient";

// @google/genai error handler
const handleApiError = (error: any) => {
  console.error("Lỗi chi tiết từ Gemini API:", error);
  const errMsg = error?.message || "";
  if (
    errMsg.includes("entity was not found") || 
    errMsg.includes("API key not valid") || 
    errMsg.includes("401") || 
    errMsg.includes("403")
  ) {
    throw new Error("RESELECT_KEY");
  }
  throw new Error("AI_ERROR");
};

/**
 * Phân tách nội dung lý thuyết từ chuỗi có gắn thẻ [TAG]
 */
const parseTaggedContent = (rawText: string): TheorySection[] => {
  if (!rawText) return [];
  
  const tagRegex = /\[(TITLE|SECTION|CONTENT|EXAMPLE|NOTE)\]/g;
  const sections: TheorySection[] = [];
  
  const matches = Array.from(rawText.matchAll(tagRegex));
  
  if (matches.length === 0) {
    return [{ title: "Kiến thức trọng tâm", content: rawText }];
  }

  const parts: { tag: string; content: string }[] = [];
  
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const tagName = currentMatch[1];
    const startOfContent = currentMatch.index! + currentMatch[0].length;
    const endOfContent = (i < matches.length - 1) ? matches[i + 1].index : rawText.length;
    
    const content = rawText.substring(startOfContent, endOfContent).trim();
    parts.push({ tag: tagName, content });
  }

  parts.forEach(part => {
    if (part.tag === "TITLE" || part.tag === "SECTION") {
      sections.push({ title: part.content, content: "" });
    } else {
      if (sections.length === 0) {
        sections.push({ title: "Mở đầu", content: "" });
      }
      
      let formattedContent = part.content;
      if (part.tag === "EXAMPLE") {
        formattedContent = `\n\n**Ví dụ minh họa:**\n${part.content}`;
      } else if (part.tag === "NOTE") {
        formattedContent = `\n\n> **Ghi nhớ:** ${part.content}`;
      }
      
      const lastSection = sections[sections.length - 1];
      lastSection.content += (lastSection.content ? "\n\n" : "") + formattedContent;
    }
  });

  return sections;
};

export const getLessonContent = async (topic: string): Promise<LessonContent> => {
  const normalizedTopic = topic.replace(/^Bài\s+\d+:\s+/i, '').trim();
  try {
    // Sửa lỗi PGRST116 bằng cách thêm .limit(1)
    const { data, error } = await supabase
      .from('lesson_data_12')
      .select('*')
      .ilike('tenbai', `%${normalizedTopic}%`)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) {
        const sections = parseTaggedContent(data.noidung || "");
        if (data.vidu && sections.length > 0) {
           sections.push({ title: "Ví dụ bổ sung", content: data.vidu });
        }
        return {
            topic: data.tenbai || topic,
            theory: data.noidung || "",
            theorySections: sections,
            exercises: [] 
        };
    }
    
    // Fallback cho demo nếu không có dữ liệu trong Supabase
    if (normalizedTopic.includes("Tích phân")) {
      const demoContent = `
[TITLE] 1. Định nghĩa tích phân
[CONTENT] Cho $f(x)$ là hàm số liên tục trên đoạn $[a; b]$. Nếu $F(x)$ là một nguyên hàm của hàm số $f(x)$ trên đoạn $[a; b]$ thì hiệu số $F(b) - F(a)$ được gọi là tích phân từ $a$ đến $b$ của hàm số $f(x)$.

| Tên tính chất | Công thức |
| :--- | :--- |
| **Tuyến tính** | $\\int_a^b [f \\pm g]dx = \\int_a^b f dx \\pm \\int_a^b g dx$ |
| **Hằng số** | $\\int_a^b k f dx = k \\int_a^b f dx$ |
`;
      return {
          topic: topic,
          theory: demoContent,
          theorySections: parseTaggedContent(demoContent),
          exercises: []
      };
    }

    return {
        topic: topic,
        theory: "Dữ liệu đang cập nhật...",
        theorySections: [{ title: "Thông báo", content: `Bài học "${normalizedTopic}" chưa có dữ liệu.` }],
        exercises: []
    };
  } catch (err) {
      throw err;
  }
};

export const generatePracticeExercises = async (topic: string, config: PracticeConfig, theoryContext: string): Promise<Exercise[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Bạn là trợ lý AI chuyên Toán THPT theo chương trình GDPT 2018.
Chủ đề: "${topic}".
Lý thuyết tham khảo: ${theoryContext}

1️⃣ VAI TRÒ CỦA AI
Tạo câu hỏi trắc nghiệm – đúng sai – trả lời ngắn
Hiển thị toán học bằng ký hiệu Unicode trực quan
Cung cấp lời giải chi tiết sau khi nộp bài

2️⃣ QUY ĐỊNH HIỂN THỊ TOÁN HỌC (BẮT BUỘC)
⚠️ TUYỆT ĐỐI KHÔNG SỬ DỤNG LaTeX
❌ Cấm xuất hiện: \\, ^, _, { }, $, \\mathbb, \\infty, \\int, \\lim, \\frac
✅ CHỈ DÙNG KÝ HIỆU UNICODE: x², x³, ℝ, +∞, −∞, (a; b), [a; b], ℝ \\ {0}, y = f(x), f′(x), ≥, ≤, ≠, ∫, √, ½, ¼, ¾, π, α, β, ∆, ∈, ∉, ∪, ∩

3️⃣ CẤU TRÚC ĐỀ THI
- Trắc nghiệm nhiều lựa chọn: ${config.mcPure + config.mcReal} câu (Bắt buộc có 4 đáp án A, B, C, D để học sinh chọn).
- Trắc nghiệm đúng/sai: ${config.tfPure + config.tfReal} câu (Mỗi câu có 4 ý a, b, c, d. Học sinh chọn Đúng/Sai cho từng ý).
- Trả lời ngắn: ${config.saPure + config.saReal} câu (Học sinh điền đáp án cuối cùng).

Đảm bảo các câu hỏi đúng cấu trúc, kiến thức nằm trong yêu cầu cần đạt, khắc phục các lỗi thường gặp chỉ đưa câu hỏi mà không đưa đáp án để học sinh chọn.

4️⃣ ĐỊNH DẠNG ĐẦU RA (JSON)
Trả về JSON mảng các đối tượng Exercise theo cấu trúc sau (không dùng markdown code block, chỉ trả về mảng JSON hợp lệ):
[
  {
    "id": 1,
    "type": "multiple_choice",
    "category": "pure",
    "question": "Nội dung câu hỏi...",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "mcAnswer": "A", // hoặc B, C, D
    "solution": "Lời giải chi tiết..."
  },
  {
    "id": 2,
    "type": "true_false",
    "category": "pure",
    "question": "Cho hàm số y = f(x)...",
    "tfItems": [
      { "id": "a", "statement": "Mệnh đề a...", "isCorrect": true, "explanation": "Giải thích..." },
      { "id": "b", "statement": "Mệnh đề b...", "isCorrect": false, "explanation": "Giải thích..." },
      { "id": "c", "statement": "Mệnh đề c...", "isCorrect": true, "explanation": "Giải thích..." },
      { "id": "d", "statement": "Mệnh đề d...", "isCorrect": false, "explanation": "Giải thích..." }
    ],
    "solution": "Lời giải chung..."
  },
  {
    "id": 3,
    "type": "short_answer",
    "category": "pure",
    "question": "Nội dung câu hỏi...",
    "saAnswer": "Đáp án ngắn gọn (chỉ số hoặc biểu thức đơn giản)",
    "solution": "Lời giải chi tiết..."
  }
]`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      type: { type: Type.STRING },
                      category: { type: Type.STRING },
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      mcAnswer: { type: Type.STRING },
                      tfItems: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            statement: { type: Type.STRING },
                            isCorrect: { type: Type.BOOLEAN },
                            explanation: { type: Type.STRING }
                          },
                          required: ["id", "statement", "isCorrect", "explanation"]
                        }
                      },
                      saAnswer: { type: Type.STRING },
                      solution: { type: Type.STRING }
                    },
                    required: ["id", "type", "category", "question", "solution"]
                  }
                }
            },
        });
        return JSON.parse(response.text || "[]");
    } catch (error) {
        return handleApiError(error);
    }
};

export const generateHint = async (question: string, topic: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bạn là gia sư Toán THPT. Học sinh đang gặp khó khăn với câu hỏi sau thuộc chủ đề "${topic}":\n\n${question}\n\nHãy đưa ra một gợi ý ngắn gọn (không giải hẳn ra kết quả) để giúp học sinh tự suy nghĩ tiếp. Dùng Markdown. ⚠️ TUYỆT ĐỐI KHÔNG SỬ DỤNG LaTeX. CHỈ DÙNG KÝ HIỆU UNICODE.`,
    });
    return response.text || "";
  } catch (error) {
    return handleApiError(error);
  }
};

export const generateAlternativeExplanation = async (question: string, originalExplanation: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Câu hỏi: ${question}\nLời giải hiện tại: ${originalExplanation}\nGiải thích chi tiết hơn bằng Markdown. ⚠️ TUYỆT ĐỐI KHÔNG SỬ DỤNG LaTeX. CHỈ DÙNG KÝ HIỆU UNICODE (x², ℝ, +∞, ∫, √, v.v.).`,
    });
    return response.text || "";
  } catch (error) {
    return handleApiError(error);
  }
};

export const chatWithAI = async (history: ChatMessage[], message: string, topic: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `Bạn là trợ lý FMath12 chuyên Toán 12. Chủ đề: ${topic}. ⚠️ TUYỆT ĐỐI KHÔNG SỬ DỤNG LaTeX. CHỈ DÙNG KÝ HIỆU UNICODE (x², ℝ, +∞, ∫, √, v.v.).`,
      },
    });
    const response = await chat.sendMessage({ message });
    return response.text || "";
  } catch (error) {
    return handleApiError(error);
  }
};

export const generateAIFeedback = async (topic: string, score: number, analysis: any[]): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `Nhận xét bài làm Toán "${topic}", điểm ${score}/10. Phân tích: ${JSON.stringify(analysis)}. Dùng Markdown. ⚠️ TUYỆT ĐỐI KHÔNG SỬ DỤNG LaTeX. CHỈ DÙNG KÝ HIỆU UNICODE.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return handleApiError(error);
  }
};
