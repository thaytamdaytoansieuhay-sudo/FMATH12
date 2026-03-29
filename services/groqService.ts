import { LessonContent, ChatMessage, PracticeConfig, Exercise, TheorySection } from "../types";
import { supabase } from "./supabaseClient";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

/* ================== COMMON GROQ CALL ================== */
const callGroq = async (messages: any[]) => {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error("AI_ERROR");

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
};

/* ================== ERROR HANDLER ================== */
const handleApiError = (error: any) => {
  console.error("Lỗi AI:", error);
  throw new Error("AI_ERROR");
};

/* ================== PARSE THEORY ================== */
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
    const tag = matches[i][1];
    const start = matches[i].index! + matches[i][0].length;
    const end = i < matches.length - 1 ? matches[i + 1].index! : rawText.length;
    const content = rawText.substring(start, end).trim();

    parts.push({ tag, content });
  }

  parts.forEach(part => {
    if (part.tag === "TITLE" || part.tag === "SECTION") {
      sections.push({ title: part.content, content: "" });
    } else {
      if (sections.length === 0) {
        sections.push({ title: "Mở đầu", content: "" });
      }

      let formatted = part.content;

      if (part.tag === "EXAMPLE") {
        formatted = `\n\n**Ví dụ:**\n${part.content}`;
      }
      if (part.tag === "NOTE") {
        formatted = `\n\n> **Ghi nhớ:** ${part.content}`;
      }

      sections[sections.length - 1].content +=
        (sections[sections.length - 1].content ? "\n\n" : "") + formatted;
    }
  });

  return sections;
};

/* ================== GET LESSON ================== */
export const getLessonContent = async (topic: string): Promise<LessonContent> => {
  const normalizedTopic = topic.replace(/^Bài\s+\d+:\s+/i, "").trim();

  const { data, error } = await supabase
    .from("lesson_data_12")
    .select("*")
    .ilike("tenbai", `%${normalizedTopic}%`)
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

  return {
    topic,
    theory: "Dữ liệu đang cập nhật...",
    theorySections: [
      { title: "Thông báo", content: `Bài "${normalizedTopic}" chưa có dữ liệu.` }
    ],
    exercises: []
  };
};

/* ================== GENERATE EXERCISES ================== */
export const generatePracticeExercises = async (
  topic: string,
  config: PracticeConfig,
  theoryContext: string
): Promise<Exercise[]> => {

  const prompt = `
Tạo bài tập Toán 12 chủ đề "${topic}".

⚠️ Chỉ trả về JSON hợp lệ, không thêm text ngoài JSON.

Số lượng:
- Trắc nghiệm: ${config.mcPure + config.mcReal}
- Đúng sai: ${config.tfPure + config.tfReal}
- Trả lời ngắn: ${config.saPure + config.saReal}
`;

  try {
    const content = await callGroq([
      { role: "system", content: "Trả về JSON hợp lệ" },
      { role: "user", content: prompt }
    ]);

    return JSON.parse(content);
  } catch (e) {
    return handleApiError(e);
  }
};

/* ================== HINT ================== */
export const generateHint = async (question: string, topic: string): Promise<string> => {
  try {
    return await callGroq([
      {
        role: "system",
        content: `Gia sư Toán 12, không dùng LaTeX`
      },
      {
        role: "user",
        content: `Gợi ý ngắn:\n${question}`
      }
    ]);
  } catch (e) {
    return handleApiError(e);
  }
};

/* ================== EXPLANATION ================== */
export const generateAlternativeExplanation = async (
  question: string,
  originalExplanation: string
): Promise<string> => {
  try {
    return await callGroq([
      {
        role: "system",
        content: "Giải thích dễ hiểu, không LaTeX"
      },
      {
        role: "user",
        content: `${question}\nGiải lại:\n${originalExplanation}`
      }
    ]);
  } catch (e) {
    return handleApiError(e);
  }
};

/* ================== CHAT ================== */
export const chatWithAI = async (
  history: ChatMessage[],
  message: string,
  topic: string
): Promise<string> => {

  const messages = [
    { role: "system", content: `Trợ lý Toán 12 - ${topic}` },
    ...history.map(h => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content
    })),
    { role: "user", content: message }
  ];

  try {
    return await callGroq(messages);
  } catch (e) {
    return handleApiError(e);
  }
};

/* ================== FEEDBACK ================== */
export const generateAIFeedback = async (
  topic: string,
  score: number,
  analysis: any[]
): Promise<string> => {
  try {
    return await callGroq([
      {
        role: "system",
        content: "Nhận xét bài Toán"
      },
      {
        role: "user",
        content: `Bài: ${topic}, điểm ${score}/10\n${JSON.stringify(analysis)}`
      }
    ]);
  } catch (e) {
    return handleApiError(e);
  }
};