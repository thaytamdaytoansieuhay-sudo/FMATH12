import React, { useState, useEffect } from 'react';
import { AppStatus, LessonContent, TextbookChapter } from './types';
import { getLessonContent } from './services/geminiService';
import LessonView from './components/LessonView';
import ChatBot from './components/ChatBot';
import { Menu, GraduationCap, Sparkles, ChevronDown, CheckCircle2, Play, ArrowRight, BookOpen, Layers, Star, Zap, ShieldAlert, Key, Check, AlertTriangle } from 'lucide-react';

const TEXTBOOK_STRUCTURE: TextbookChapter[] = [
    {
      title: "Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số",
      lessons: [
        "Bài 1: Tính đơn điệu và cực trị của hàm số",
        "Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số",
        "Bài 3: Đường tiệm cận của đồ thị hàm số",
        "Bài 4: Khảo sát sự biến thiên và vẽ đồ thị của hàm số",
        "Bài 5: Ứng dụng đạo hàm để giải quyết một số vấn đề thực tiễn"
      ]
    },
    {
      title: "Chương II: Vectơ và hệ trục tọa độ trong không gian",
      lessons: [
        "Bài 6: Vectơ trong không gian",
        "Bài 7: Hệ trục tọa độ trong không gian",
        "Bài 8: Biểu thức tọa độ của các phép toán vectơ"
      ]
    },
    {
      title: "Chương III: Các số đặc trưng đo mức độ phân tán (Mẫu ghép nhóm)",
      lessons: [
        "Bài 9: Khoảng biến thiên và khoảng tứ phân vị",
        "Bài 10: Phương sai và độ lệch chuẩn"
      ]
    },
    {
      title: "Chương IV: Nguyên hàm và Tích phân",
      lessons: [
        "Bài 11: Nguyên hàm",
        "Bài 12: Tích phân",
        "Bài 13: Ứng dụng hình học của tích phân"
      ]
    },
    {
      title: "Chương V: Phương pháp tọa độ trong không gian",
      lessons: [
        "Bài 14: Phương trình mặt phẳng",
        "Bài 15: Phương trình đường thẳng trong không gian",
        "Bài 16: Công thức tính góc trong không gian",
        "Bài 17: Phương trình mặt cầu"
      ]
    },
    {
      title: "Chương VI: Xác suất có điều kiện",
      lessons: [
        "Bài 18: Xác suất có điều kiện",
        "Bài 19: Công thức xác suất toàn phần và công thức Bayes"
      ]
    }
];

interface UserProgress {
  viewed: string[];
  completed: Record<string, number>;
}

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLessonName, setActiveLessonName] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isKeyInvalid, setIsKeyInvalid] = useState(false);
  
  const [expandedChapter, setExpandedChapter] = useState<number | null>(0);
  const [homeExpandedChapter, setHomeExpandedChapter] = useState<number | null>(0);
  
  const [userProgress, setUserProgress] = useState<UserProgress>({ viewed: [], completed: {} });

  const checkStatus = async () => {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      const systemKeyExists = !!process.env.API_KEY && process.env.API_KEY.length > 5;
      setHasApiKey(selected || systemKeyExists);
  };

  useEffect(() => {
    checkStatus();
    const saved = localStorage.getItem('math_progress');
    if (saved) {
      try { setUserProgress(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleActivateAI = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setIsKeyInvalid(false);
    setHasApiKey(true);
  };

  const saveProgress = (newProgress: UserProgress) => {
    setUserProgress(newProgress);
    localStorage.setItem('math_progress', JSON.stringify(newProgress));
  };

  const handleLessonSelect = async (lessonName: string) => {
    setActiveLessonName(lessonName);
    if (!userProgress.viewed.includes(lessonName)) {
        saveProgress({ ...userProgress, viewed: [...userProgress.viewed, lessonName] });
    }
    setStatus(AppStatus.LOADING);
    if (window.innerWidth < 1024) setSidebarOpen(false);
    try {
      const content = await getLessonContent(lessonName);
      setCurrentLesson(content);
      setStatus(AppStatus.VIEWING_LESSON);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleLessonComplete = (score: number) => {
      if (!currentLesson) return;
      saveProgress({
          ...userProgress,
          completed: { ...userProgress.completed, [currentLesson.topic]: Math.max(score, userProgress.completed[currentLesson.topic] || 0) }
      });
  };

  const onAIError = (errType: string) => {
    if (errType === 'RESELECT_KEY') {
        setIsKeyInvalid(true);
        setHasApiKey(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center gap-3 px-6 bg-white border-b border-slate-100 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <GraduationCap size={20} />
            </div>
            <div>
                <h1 className="font-extrabold text-xl tracking-tight text-slate-900">FMath12</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GDPT 2018</p>
            </div>
        </div>

        {/* AI Connection Status */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trợ lý AI</span>
                {hasApiKey ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <Check size={10} /> SẴN SÀNG
                    </span>
                ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        CHƯA KẾT NỐI
                    </span>
                )}
            </div>
            
            {isKeyInvalid && (
                <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 animate-pulse">
                    <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-700 font-medium leading-tight">Khóa cũ không hợp lệ hoặc hết hạn. Vui lòng kết nối lại.</p>
                </div>
            )}

            {!hasApiKey && (
                <button 
                    onClick={handleActivateAI}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-100"
                >
                    <Sparkles size={14} /> KÍCH HOẠT AI
                </button>
            )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {TEXTBOOK_STRUCTURE.map((chapter, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden transition-colors">
                    <button 
                        onClick={() => setExpandedChapter(expandedChapter === idx ? null : idx)}
                        className={`w-full flex items-center justify-between p-3 text-left rounded-lg transition-all ${expandedChapter === idx ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="text-sm font-bold truncate pr-2 leading-tight">{chapter.title}</span>
                        <ChevronDown size={14} className={`shrink-0 transition-transform ${expandedChapter === idx ? 'rotate-180' : ''}`}/>
                    </button>
                    
                    {expandedChapter === idx && (
                        <div className="pl-3 pr-1 py-1 space-y-1">
                            {chapter.lessons.map((lesson, lIdx) => {
                                const isCompleted = userProgress.completed[lesson] !== undefined;
                                const isActive = activeLessonName === lesson;
                                return (
                                    <button
                                        key={lIdx}
                                        onClick={() => handleLessonSelect(lesson)}
                                        className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center gap-3 transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-slate-300'}`}></div>
                                        <span className="truncate flex-1">{lesson}</span>
                                        {isCompleted && <CheckCircle2 size={12} className={isActive ? 'text-white/80' : 'text-emerald-500'} />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 justify-between shrink-0 lg:hidden sticky top-0 z-20">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600"><Menu size={24} /></button>
            <span className="font-bold text-slate-800">FMath12</span>
            {!hasApiKey ? (
                 <button onClick={handleActivateAI} className="p-2 text-blue-600"><Sparkles size={20}/></button>
            ) : <div className="w-8"></div>}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth bg-[#f8fafc]">
            {status === AppStatus.IDLE && (
                <div className="max-w-5xl mx-auto p-6 md:p-12">
                    {/* Hero Section */}
                    <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
                        <div className="relative z-10 max-w-2xl">
                            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight">Học Toán 12 Thật Dễ Với AI</h1>
                            <p className="text-lg text-blue-100 mb-8 leading-relaxed font-medium">
                                Hệ thống học tập thông minh dựa trên dữ liệu SGK 2018. Tự động soạn đề, chấm điểm và giải thích chi tiết.
                            </p>
                            {!hasApiKey && (
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
                                    <p className="text-sm font-bold text-blue-200 flex items-center gap-2 mb-4">
                                        <ShieldAlert size={16} /> BẠN ĐANG XEM QUA LINK CHIA SẺ?
                                    </p>
                                    <p className="text-xs text-blue-50 mb-4 opacity-80 leading-relaxed">
                                        Để bảo mật, API Key của chủ sở hữu không được nhúng sẵn. Vui lòng kết nối API Key cá nhân từ <strong>Google AI Studio</strong> để sử dụng Chatbot và Soạn đề.
                                    </p>
                                    <button 
                                        onClick={handleActivateAI}
                                        className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg"
                                    >
                                        <Key size={16} /> Kết nối khóa AI của bạn
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={() => document.getElementById('chapters')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-white text-slate-900 px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2"
                            >
                                Bắt đầu ngay <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4"><Layers size={24} /></div>
                            <h3 className="font-bold text-slate-800">Lý thuyết 2018</h3>
                            <p className="text-slate-500 text-sm mt-1">Nội dung được cô đọng từ SGK mới nhất, hiển thị trực quan.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4"><Zap size={24} /></div>
                            <h3 className="font-bold text-slate-800">Soạn đề tự động</h3>
                            <p className="text-slate-500 text-sm mt-1">AI tự tạo câu hỏi trắc nghiệm, đúng sai và trả lời ngắn.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4"><Star size={24} /></div>
                            <h3 className="font-bold text-slate-800">Trợ lý gia sư</h3>
                            <p className="text-slate-500 text-sm mt-1">Hỏi đáp trực tiếp với Chatbot về mọi bài tập khó.</p>
                        </div>
                    </div>

                    {/* Chapter List */}
                    <div id="chapters" className="space-y-4">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <BookOpen className="text-blue-600" />
                            CHƯƠNG TRÌNH HỌC
                        </h2>
                        {TEXTBOOK_STRUCTURE.map((chapter, idx) => {
                            const isOpen = homeExpandedChapter === idx;
                            return (
                                <div key={idx} className={`bg-white rounded-2xl border transition-all duration-300 ${isOpen ? 'shadow-lg border-blue-100 ring-1 ring-blue-50' : 'border-slate-200'}`}>
                                    <button 
                                        onClick={() => setHomeExpandedChapter(isOpen ? null : idx)}
                                        className="w-full flex items-center justify-between p-5 text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors shrink-0 ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {idx + 1}
                                            </div>
                                            <h3 className={`font-bold text-base md:text-lg ${isOpen ? 'text-blue-900' : 'text-slate-700'}`}>{chapter.title}</h3>
                                        </div>
                                        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isOpen && (
                                        <div className="p-4 pt-0 grid md:grid-cols-2 gap-3">
                                            {chapter.lessons.map((lesson, lIdx) => (
                                                <button
                                                    key={lIdx}
                                                    onClick={() => handleLessonSelect(lesson)}
                                                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-blue-200 hover:shadow-md rounded-xl transition-all text-left group"
                                                >
                                                    <span className="font-semibold text-slate-600 group-hover:text-blue-700 text-sm">{lesson}</span>
                                                    <Play size={12} className="text-slate-300 group-hover:text-blue-500" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {status === AppStatus.LOADING && (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="text-center animate-pulse">
                        <h3 className="text-lg font-bold text-slate-800">Đang tải kiến thức...</h3>
                    </div>
                </div>
            )}

            {status === AppStatus.VIEWING_LESSON && currentLesson && (
                <LessonView content={currentLesson} onLessonComplete={handleLessonComplete} onAIError={onAIError} />
            )}
        </div>
        
        {status === AppStatus.VIEWING_LESSON && currentLesson && <ChatBot topic={currentLesson.topic} onAIError={onAIError} />}
      </main>
    </div>
  );
};

export default App;
