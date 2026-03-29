
import React, { useState, useEffect } from 'react';
import { LessonContent, Exercise, PracticeConfig } from '../types';
import MathRenderer from './MathRenderer';
import ExplanationSection from './ExplanationSection';
import HintButton from './HintButton';
import { generatePracticeExercises, generateAIFeedback } from '../services/groqService';
import { BookOpen, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Sparkles, Zap, Loader2, Key, Info, Sigma, Globe, LayoutGrid, RotateCcw, Bot, BarChart3 } from 'lucide-react';

interface LessonViewProps {
  content: LessonContent;
  onLessonComplete: (score: number) => void;
  onAIError?: (errType: string) => void;
}

const LessonView: React.FC<LessonViewProps> = ({ content, onLessonComplete, onAIError }) => {
  const [exercises, setExercises] = useState<Exercise[]>(content.exercises || []);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreSummary, setScoreSummary] = useState<{score: number, totalQuestions: number, feedback: string, stats: any} | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAiFeedbackLoading, setIsAiFeedbackLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [theoryStep, setTheoryStep] = useState(0); 
  const [theoryCompleted, setTheoryCompleted] = useState(false);

  const [isGeneratingExercises, setIsGeneratingExercises] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  
  const [practiceConfig, setPracticeConfig] = useState<PracticeConfig>({
    mcPure: 3,
    mcReal: 2,
    tfPure: 1,
    tfReal: 1,
    saPure: 1,
    saReal: 1
  });

  const theorySections = content.theorySections && content.theorySections.length > 0 
    ? content.theorySections 
    : [{ title: "Kiến thức tổng hợp", content: content.theory }];

  useEffect(() => {
    resetPracticeState();
  }, [content.topic]);

  const resetPracticeState = () => {
    setExercises([]);
    setUserAnswers({});
    setIsSubmitted(false);
    setScoreSummary(null);
    setAiFeedback(null);
    setProgress(0);
    setTheoryStep(0);
    setTheoryCompleted(false);
    setGenerationError(null);
    setNeedsApiKey(false);
  };

  const handleReturnToConfig = () => {
    setExercises([]);
    setUserAnswers({});
    setIsSubmitted(false);
    setScoreSummary(null);
    setAiFeedback(null);
    setProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (exercises.length === 0) {
        setProgress(0);
        return;
    }
    const answeredCount = Object.keys(userAnswers).length;
    setProgress(Math.round((answeredCount / exercises.length) * 100));
  }, [userAnswers, exercises.length]);

  const handleNextTheoryStep = () => {
      if (theoryStep < theorySections.length - 1) {
          setTheoryStep(prev => prev + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          setTheoryCompleted(true);
          setTimeout(() => {
              document.getElementById('practice-config')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  };

  const handlePrevTheoryStep = () => {
      if (theoryStep > 0) {
          setTheoryStep(prev => prev - 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const handleOpenKeyDialog = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setNeedsApiKey(false);
  };

  const handleGenerateExercises = async () => {
    setIsGeneratingExercises(true);
    setGenerationError(null);
    setNeedsApiKey(false);
    try {
        const newExercises = await generatePracticeExercises(content.topic, practiceConfig, content.theory);
        setExercises(newExercises);
        setTimeout(() => {
            document.getElementById('practice-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } catch (error: any) {
        console.error("Lỗi khi tạo bài tập:", error);
        if (error.message === 'API_KEY_MISSING' || error.message === 'RESELECT_KEY') {
            setNeedsApiKey(true);
            if (onAIError) onAIError('RESELECT_KEY');
        } else {
            setGenerationError("Không thể tạo bài tập. Vui lòng thử lại sau.");
        }
    } finally {
        setIsGeneratingExercises(false);
    }
  };

  const handleMCSelect = (index: number, optionChar: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [index]: optionChar }));
  };

  const handleTFSelect = (index: number, itemId: string, val: boolean) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
        ...prev,
        [index]: { ...(prev[index] || {}), [itemId]: val }
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;
    let totalPoints = 0;
    let maxPoints = 0;
    const analysisData: any[] = [];
    
    const statsBreakdown = {
      mc: { total: 0, correct: 0 },
      tf: { total: 0, correct: 0 },
      sa: { total: 0, correct: 0 },
      pure: { total: 0, correct: 0 },
      real: { total: 0, correct: 0 }
    };

    exercises.forEach((ex, index) => {
        let isCorrect = false;
        const userAnswer = userAnswers[index];
        
        const cat = ex.category === 'pure' ? 'pure' : 'real';
        statsBreakdown[cat].total += 1;

        if (ex.type === 'multiple_choice') {
            statsBreakdown.mc.total += 1;
            maxPoints += 1;
            isCorrect = userAnswer === ex.mcAnswer;
            if (isCorrect) {
              totalPoints += 1;
              statsBreakdown.mc.correct += 1;
              statsBreakdown[cat].correct += 1;
            }
        } else if (ex.type === 'true_false') {
            statsBreakdown.tf.total += 1;
            let correctParts = 0;
            ex.tfItems?.forEach(item => {
                maxPoints += 0.25;
                if (userAnswer?.[item.id] === item.isCorrect) {
                    totalPoints += 0.25;
                    correctParts++;
                }
            });
            isCorrect = correctParts === ex.tfItems?.length;
            if (isCorrect) {
              statsBreakdown.tf.correct += 1;
              statsBreakdown[cat].correct += 1;
            }
        } else if (ex.type === 'short_answer') {
            statsBreakdown.sa.total += 1;
            maxPoints += 1;
            const uVal = (userAnswer || '').toString().trim().replace(/\s/g, '').toLowerCase();
            const cVal = (ex.saAnswer || '').toString().trim().toLowerCase();
            isCorrect = uVal === cVal;
            if (isCorrect) {
              totalPoints += 1;
              statsBreakdown.sa.correct += 1;
              statsBreakdown[cat].correct += 1;
            }
        }

        analysisData.push({
            question: ex.question.substring(0, 80) + "...",
            type: ex.type,
            isCorrect
        });
    });

    const scaledScore = maxPoints > 0 ? (totalPoints / maxPoints) * 10 : 0;
    const finalScore = Math.round(scaledScore * 10) / 10;
    
    setScoreSummary({
        score: finalScore,
        totalQuestions: exercises.length,
        feedback: scaledScore >= 8 ? "Kết quả rất xuất sắc!" : (scaledScore >= 5 ? "Làm khá tốt rồi!" : "Cần rèn luyện thêm nhé!"),
        stats: statsBreakdown
    });
    
    setIsSubmitted(true);
    onLessonComplete(finalScore);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setIsAiFeedbackLoading(true);
    try {
        const feedback = await generateAIFeedback(content.topic, finalScore, analysisData);
        setAiFeedback(feedback);
    } catch (e) {
        setAiFeedback("AI Feedback tạm thời không khả dụng.");
    } finally {
        setIsAiFeedbackLoading(false);
    }
  };

  const renderExerciseInteraction = (ex: Exercise, index: number) => {
    switch (ex.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {ex.options?.map((opt, optIdx) => {
                const char = String.fromCharCode(65 + optIdx);
                const isSelected = userAnswers[index] === char;
                const isCorrect = ex.mcAnswer === char;
                let containerClass = "relative w-full rounded-xl border-2 transition-all p-4 cursor-pointer flex gap-3 ";
                
                if (isSubmitted) {
                    if (isCorrect) containerClass += "bg-emerald-50 border-emerald-500 text-emerald-900";
                    else if (isSelected) containerClass += "bg-red-50 border-red-500 text-red-900 opacity-80";
                    else containerClass += "bg-white border-slate-100 opacity-50";
                } else {
                    if (isSelected) containerClass += "bg-blue-50 border-blue-600 shadow-sm";
                    else containerClass += "bg-white border-slate-200 hover:border-blue-400";
                }
                
                return (
                    <div key={optIdx} className={containerClass} onClick={() => handleMCSelect(index, char)}>   
                        <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{char}</div>
                        <div className="flex-1 font-serif text-base leading-relaxed"><MathRenderer content={opt} className="text-inherit" /></div>
                    </div>
                );
            })}
          </div>
        );
      case 'true_false':
        return (
          <div className="space-y-4">
             {ex.tfItems?.map((item) => {
                 const userChoice = userAnswers[index]?.[item.id];
                 return (
                     <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                         <div className="flex flex-col gap-2">
                             <div className="flex gap-2">
                                 <span className="font-bold text-slate-400 bg-slate-100 w-5 h-5 rounded flex items-center justify-center text-[10px] uppercase shrink-0">{item.id}</span>
                                 <div className="flex-1 text-slate-900 text-sm leading-relaxed"><MathRenderer content={item.statement} /></div>
                             </div>
                             <div className="flex gap-2 justify-end pt-1">
                                 {[true, false].map((val) => {
                                     const label = val ? 'ĐÚNG' : 'SAI';
                                     const selected = userChoice === val;
                                     const isCorrectValue = item.isCorrect === val;
                                     let btnClass = "px-4 py-1.5 rounded-lg font-bold text-[10px] border transition-all ";
                                     
                                     if (isSubmitted) {
                                         if (selected) {
                                             btnClass += isCorrectValue ? "bg-emerald-600 text-white border-emerald-600" : "bg-red-600 text-white border-red-600";
                                         } else {
                                             btnClass += isCorrectValue ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white text-slate-300 border-slate-100";
                                         }
                                     } else {
                                         if (selected) btnClass += "bg-blue-600 text-white border-blue-600";
                                         else btnClass += "bg-white text-slate-500 border-slate-200 hover:border-slate-400";
                                     }
                                     
                                     return <button key={label} onClick={() => handleTFSelect(index, item.id, val)} disabled={isSubmitted} className={btnClass}>{label}</button>
                                 })}
                             </div>
                         </div>
                     </div>
                 );
             })}
          </div>
        );
      case 'short_answer':
        const userVal = (userAnswers[index] || "");
        const correctVal = ex.saAnswer || "";
        const isCorrectSA = isSubmitted && userVal.trim().replace(/\s/g, '').toLowerCase() === correctVal.replace(/\s/g, '').toLowerCase();
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-6 w-full">
                <div className="w-full max-w-xs">
                    <input
                        type="text"
                        value={userVal}
                        onChange={(e) => {
                            if (isSubmitted) return;
                            setUserAnswers(prev => ({ ...prev, [index]: e.target.value }));
                        }}
                        disabled={isSubmitted}
                        className={`w-full px-4 py-3 text-center text-xl font-mono font-bold border-2 rounded-xl focus:outline-none transition-all ${
                            isSubmitted 
                            ? (isCorrectSA ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-red-500 bg-red-50 text-red-800')
                            : 'border-slate-300 bg-white text-slate-800 focus:ring-4 focus:ring-blue-100'
                        }`}
                        placeholder="Nhập đáp án..."
                    />
                </div>
                {isSubmitted && !isCorrectSA && (
                    <div className="text-emerald-700 font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-sm text-center w-full max-w-xs">
                        Đáp án đúng: {correctVal}
                    </div>
                )}
            </div>
        );
      default: return null;
    }
  };

  return (
    <div className="relative pb-32 pt-8">
      <div className="max-w-7xl mx-auto px-4">
        {!theoryCompleted && (
            <section className="max-w-4xl mx-auto mb-16 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-yellow-500" fill="currentColor" /> Kiến thức trọng tâm
                    </h2>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{theoryStep + 1} / {theorySections.length}</span>
                </div>
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[500px] flex flex-col relative">
                     <div className="absolute top-0 left-0 w-2 h-full bg-slate-100 border-r border-slate-200"></div>
                     <div className="p-8 pb-4 pl-10 bg-slate-50/50">
                        <h3 className="text-3xl font-extrabold text-slate-900 leading-tight">{theorySections[theoryStep].title}</h3>
                     </div>
                     <div className="pl-10 pr-8 pb-8 flex-1 text-lg text-slate-700 leading-relaxed overflow-y-auto max-h-[60vh] custom-scrollbar">
                         <MathRenderer content={theorySections[theoryStep].content} />
                     </div>
                     <div className="p-6 pl-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                         <div>
                            {theoryStep > 0 && (
                                <button onClick={handlePrevTheoryStep} className="bg-white hover:bg-slate-100 text-slate-700 text-lg font-bold py-3 px-6 rounded-xl border border-slate-200 shadow-sm transition-all flex items-center gap-3">
                                    <ArrowLeft size={20} /> Quay lại
                                </button>
                            )}
                         </div>
                         <button onClick={handleNextTheoryStep} className="bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-3">
                             {theoryStep < theorySections.length - 1 ? 'Tiếp tục' : 'Luyện tập ngay'}
                             <ArrowRight size={20} />
                         </button>
                     </div>
                </div>
            </section>
        )}

        {theoryCompleted && (
            <>
                {exercises.length === 0 ? (
                    <section id="practice-config" className="animate-fade-in-up max-w-6xl mx-auto py-12">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">THIẾT KẾ ĐỀ THI AI</h2>
                            <p className="text-slate-500 font-medium">Tùy chỉnh số lượng câu hỏi theo dạng thức thuần túy và thực tế</p>
                        </div>
                        
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative">
                            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                                <div className="p-10 space-y-10 bg-blue-50/20">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                            <Sigma size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 uppercase">Toán Thuần Túy</h3>
                                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Lý thuyết & Tính toán</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-slate-700">Trắc nghiệm</span>
                                                <span className="bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-lg font-black text-xs shadow-sm">{(practiceConfig as any).mcPure} câu</span>
                                            </div>
                                            <input type="range" min="0" max="15" value={practiceConfig.mcPure} onChange={(e) => setPracticeConfig({...practiceConfig, mcPure: parseInt(e.target.value)})} className="w-full accent-blue-600 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">Đúng / Sai</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase italic">Cấu trúc đề GDPT 2018</span>
                                                </div>
                                                <span className="bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-lg font-black text-xs shadow-sm">{(practiceConfig as any).tfPure} câu</span>
                                            </div>
                                            <input type="range" min="0" max="5" value={practiceConfig.tfPure} onChange={(e) => setPracticeConfig({...practiceConfig, tfPure: parseInt(e.target.value)})} className="w-full accent-blue-600 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">Trả lời ngắn</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase italic">Thông hiểu - Vận dụng cao</span>
                                                </div>
                                                <span className="bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-lg font-black text-xs shadow-sm">{(practiceConfig as any).saPure} câu</span>
                                            </div>
                                            <input type="range" min="0" max="5" value={practiceConfig.saPure} onChange={(e) => setPracticeConfig({...practiceConfig, saPure: parseInt(e.target.value)})} className="w-full accent-blue-600 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 space-y-10 bg-white">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                                            <Globe size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 uppercase">Toán Thực Tế</h3>
                                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Ứng dụng đời sống</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-slate-700">Trắc nghiệm</span>
                                                <span className="bg-slate-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-black text-xs shadow-sm">{(practiceConfig as any).mcReal} câu</span>
                                            </div>
                                            <input type="range" min="0" max="10" value={practiceConfig.mcReal} onChange={(e) => setPracticeConfig({...practiceConfig, mcReal: parseInt(e.target.value)})} className="w-full accent-emerald-600 h-2 bg-emerald-50 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">Đúng / Sai</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase italic">Ứng dụng thực tiễn</span>
                                                </div>
                                                <span className="bg-slate-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-black text-xs shadow-sm">{(practiceConfig as any).tfReal} câu</span>
                                            </div>
                                            <input type="range" min="0" max="5" value={practiceConfig.tfReal} onChange={(e) => setPracticeConfig({...practiceConfig, tfReal: parseInt(e.target.value)})} className="w-full accent-emerald-600 h-2 bg-emerald-50 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">Trả lời ngắn</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase italic">Giải quyết vấn đề</span>
                                                </div>
                                                <span className="bg-slate-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-black text-xs shadow-sm">{(practiceConfig as any).saReal} câu</span>
                                            </div>
                                            <input type="range" min="0" max="5" value={practiceConfig.saReal} onChange={(e) => setPracticeConfig({...practiceConfig, saReal: parseInt(e.target.value)})} className="w-full accent-emerald-600 h-2 bg-emerald-50 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-900 border-t border-slate-800 flex flex-col items-center">
                                {needsApiKey ? (
                                    <div className="text-center space-y-4 max-w-sm">
                                        <p className="text-slate-300 font-bold">Kích hoạt AI để soạn đề thi theo yêu cầu của bạn</p>
                                        <button onClick={handleOpenKeyDialog} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl">Kết nối khóa AI ngay</button>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-xl text-center space-y-6">
                                        {generationError && <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-sm font-bold flex items-center justify-center gap-2 animate-shake"><Info size={16}/> {generationError}</div>}
                                        
                                        <button 
                                            onClick={handleGenerateExercises} 
                                            disabled={isGeneratingExercises || ((Object.values(practiceConfig) as number[]).reduce((a, b) => a + b, 0) === 0)} 
                                            className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-blue-50 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-30 disabled:transform-none"
                                        >
                                            {isGeneratingExercises ? <Loader2 className="animate-spin" /> : <Zap size={24} fill="currentColor" className="text-yellow-500" />}
                                            {isGeneratingExercises ? 'AI ĐANG SOẠN ĐỀ TOÁN...' : 'XÁC NHẬN & SOẠN ĐỀ'}
                                        </button>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Hệ thống đang chuẩn bị {(Object.values(practiceConfig) as number[]).reduce((a, b) => a + b, 0)} câu hỏi</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                ) : (
                    <section id="practice-section" className="animate-fade-in space-y-12 py-8">
                        {/* Status Header */}
                        <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-3xl shadow-xl border border-slate-200 gap-6">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><LayoutGrid size={24} /></div>
                                 <div>
                                     <h3 className="font-black text-slate-900 leading-tight uppercase tracking-tight">{content.topic}</h3>
                                     <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100"><Sigma size={10} /> {practiceConfig.mcPure + practiceConfig.tfPure + practiceConfig.saPure} THUẦN TÚY</span>
                                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"><Globe size={10} /> {practiceConfig.mcReal + practiceConfig.tfReal + practiceConfig.saReal} THỰC TẾ</span>
                                     </div>
                                 </div>
                             </div>
                             <div className="flex flex-col items-end gap-1 shrink-0">
                                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{progress}% ĐÃ XỬ LÝ</div>
                                 <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                     <div className="h-full bg-slate-900 transition-all duration-500" style={{width: `${progress}%`}}></div>
                                 </div>
                             </div>
                        </div>

                        {/* Result Summary */}
                        {isSubmitted && scoreSummary && (
                            <div className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-800 animate-fade-in-up relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -mr-40 -mt-40"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <h2 className="text-2xl font-black mb-6 tracking-tight uppercase">TỔNG KẾT KẾT QUẢ</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
                                        {/* Score Display */}
                                        <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                                            <div className="text-8xl font-black text-yellow-400 drop-shadow-xl">{scoreSummary.score}</div>
                                            <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-2">THANG ĐIỂM 10</div>
                                            <p className="text-xl text-blue-100 font-medium mt-4">{scoreSummary.feedback}</p>
                                        </div>

                                        {/* Statistics Table */}
                                        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 overflow-hidden">
                                            <div className="flex items-center gap-2 mb-4">
                                                <BarChart3 size={18} className="text-blue-400" />
                                                <h4 className="font-bold text-sm uppercase tracking-widest text-blue-200">Chi tiết thống kê</h4>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead>
                                                        <tr className="text-slate-400 border-b border-white/10">
                                                            <th className="py-2 font-white uppercase">Dạng bài</th>
                                                            <th className="py-2 font-white uppercase text-center">Số câu</th>
                                                            <th className="py-2 font-white uppercase text-center">Đúng</th>
                                                            <th className="py-2 font-white uppercase text-right">Tỉ lệ</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        <tr>
                                                            <td className="py-3 font-bold text-white">Trắc nghiệm</td>
                                                            <td className="py-3 text-center text-white">{scoreSummary.stats.mc.total}</td>
                                                            <td className="py-3 text-center text-emerald-400 font-bold">{scoreSummary.stats.mc.correct}</td>
                                                            <td className="py-3 text-right text-white">{scoreSummary.stats.mc.total > 0 ? Math.round((scoreSummary.stats.mc.correct / scoreSummary.stats.mc.total) * 100) : 0}%</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 font-bold text-white">Đúng / Sai</td>
                                                            <td className="py-3 text-center text-white">{scoreSummary.stats.tf.total}</td>
                                                            <td className="py-3 text-center text-emerald-400 font-bold">{scoreSummary.stats.tf.correct}</td>
                                                            <td className="py-3 text-right text-white">{scoreSummary.stats.tf.total > 0 ? Math.round((scoreSummary.stats.tf.correct / scoreSummary.stats.tf.total) * 100) : 0}%</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 font-bold text-white">Trả lời ngắn</td>
                                                            <td className="py-3 text-center text-white">{scoreSummary.stats.sa.total}</td>
                                                            <td className="py-3 text-center text-emerald-400 font-bold">{scoreSummary.stats.sa.correct}</td>
                                                            <td className="py-3 text-right text-white">{scoreSummary.stats.sa.total > 0 ? Math.round((scoreSummary.stats.sa.correct / scoreSummary.stats.sa.total) * 100) : 0}%</td>
                                                        </tr>
                                                        <tr className="bg-white/5">
                                                            <td className="py-3 px-2 font-black text-blue-300 uppercase">TỔNG CỘNG</td>
                                                            <td className="py-3 text-center text-white">{scoreSummary.totalQuestions}</td>
                                                            <td className="py-3 text-center text-yellow-400 text-white">{scoreSummary.stats.mc.correct + scoreSummary.stats.tf.correct + scoreSummary.stats.sa.correct}</td>
                                                            <td className="py-3 text-right text-white">{scoreSummary.totalQuestions > 0 ? Math.round(((scoreSummary.stats.mc.correct + scoreSummary.stats.tf.correct + scoreSummary.stats.sa.correct) / scoreSummary.totalQuestions) * 100) : 0}%</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* AI Mentor Advice Section */}
                                    <div className="w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 mb-10 text-left">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                                                <Bot size={20} />
                                            </div>
                                            <h4 className="font-bold text-blue-200 uppercase tracking-widest text-sm">Nhận xét từ Gia sư AI</h4>
                                        </div>
                                        
                                        {isAiFeedbackLoading ? (
                                            <div className="flex items-center justify-center py-8 gap-3 text-white italic">
                                                <Loader2 className="animate-spin" size={20} />
                                                Đang phân tích bài làm...
                                            </div>
                                        ) : (
                                            <div className="text-white prose prose-invert max-w-none">
                                                <MathRenderer 
                                                  content={aiFeedback || "Đang chuẩn bị nhận xét..."} 
                                                  className="!text-white prose-headings:!text-white prose-strong:!text-white prose-p:!text-white prose-li:!text-white font-medium" 
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={handleReturnToConfig} className="px-12 py-4 bg-white text-slate-900 rounded-full font-black uppercase tracking-widest text-sm hover:scale-110 transition-all shadow-xl flex items-center gap-2 mx-auto">
                                        <RotateCcw size={18} /> LÀM BÀI MỚI
                                    </button>
                                </div>
                            </div>
                        )}

                        {exercises.map((ex, index) => (
                            <div key={index} className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-2xl group">
                                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-black text-slate-800 shadow-sm text-sm group-hover:border-slate-900 transition-colors">{index + 1}</div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 ${
                                            ex.category === 'pure' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {ex.category === 'pure' ? <><Sigma size={10}/> TOÁN THUẦN TÚY</> : <><Globe size={10}/> TOÁN THỰC TẾ</>}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {ex.type === 'multiple_choice' ? 'Phần I: Chọn 1 đáp án' : ex.type === 'true_false' ? 'Phần II: Đúng / Sai' : 'Phần III: Trả lời ngắn'}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    <div className="p-8 border-b lg:border-b-0 lg:border-r border-slate-100 bg-white min-h-[220px] flex flex-col">
                                        <h5 className="text-[10px] font-black text-slate-300 mb-5 uppercase tracking-[0.2em]">Yêu cầu bài toán:</h5>
                                        <div className="text-xl font-medium text-slate-900 leading-relaxed font-serif flex-1">
                                            <MathRenderer content={ex.question} />
                                        </div>
                                        {!isSubmitted && (
                                            <div className="mt-6 pt-4 border-t border-slate-100">
                                                <HintButton question={ex.question} topic={content.topic} />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-8 bg-slate-50/40">
                                        <h5 className="text-[10px] font-black text-slate-300 mb-5 uppercase tracking-[0.2em]">Lựa chọn / Kết quả:</h5>
                                        {renderExerciseInteraction(ex, index)}
                                    </div>
                                </div>

                                {isSubmitted && (
                                    <div className="p-8 bg-white border-t border-slate-100 animate-fade-in">
                                        <ExplanationSection question={ex.question} originalExplanation={ex.solution} />
                                    </div>
                                )}
                            </div>
                        ))}

                        {!isSubmitted && (
                            <div className="flex justify-center pt-8 pb-12">
                                <button onClick={handleSubmit} className="bg-slate-900 hover:bg-black text-white px-20 py-5 rounded-full font-black text-xl shadow-2xl hover:scale-105 transition-all flex items-center gap-5 transform active:scale-95 group">
                                    <CheckCircle size={32} className="text-emerald-400 group-hover:rotate-12 transition-transform" /> 
                                    <span>NỘP BÀI & XEM GIẢI</span>
                                </button>
                            </div>
                        )}
                    </section>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default LessonView;
