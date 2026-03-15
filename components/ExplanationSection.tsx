import React, { useState } from 'react';
import MathRenderer from './MathRenderer';
import { generateAlternativeExplanation } from '../services/geminiService';
import { Lightbulb, RotateCcw, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface ExplanationSectionProps {
  question: string;
  originalExplanation: string;
}

const ExplanationSection: React.FC<ExplanationSectionProps> = ({ question, originalExplanation }) => {
  const [extraContent, setExtraContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoadMore = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateAlternativeExplanation(question, originalExplanation);
      setExtraContent(result);
    } catch (e) {
      console.error(e);
      setError("Không thể tải thêm nội dung. Vui lòng kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-4">
       {/* Header */}
       <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2 text-slate-700">
            <Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-sm uppercase tracking-wide">Lời giải chi tiết</span>
       </div>
       
       <div className="p-6 text-slate-800">
          <MathRenderer content={originalExplanation} />
       </div>
       
       {!extraContent && !loading && (
         <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
                onClick={handleLoadMore}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 px-4 py-2 rounded-xl transition-all shadow-sm group"
            >
                <Sparkles className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                <span>AI Giải thích thêm / Cách giải khác</span>
            </button>
         </div>
       )}

       {loading && (
         <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3 text-slate-500 text-sm animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="font-medium">AI đang suy nghĩ phương pháp tối ưu...</span>
         </div>
       )}

       {error && (
         <div className="px-6 py-3 bg-red-50 border-t border-red-100 text-red-600 text-sm flex items-center gap-2 justify-end">
            <AlertCircle className="w-4 h-4" />
            {error}
         </div>
       )}

       {extraContent && (
         <div className="border-t border-indigo-100 bg-indigo-50/50">
            <div className="px-6 py-3 flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider bg-indigo-100/50 border-b border-indigo-100">
                <Sparkles className="w-4 h-4" />
                Góc nhìn mở rộng từ AI
            </div>
            <div className="p-6 text-slate-800">
                <MathRenderer content={extraContent} />
                <div className="mt-4 pt-4 border-t border-indigo-200/50 flex justify-end">
                    <button 
                        onClick={() => setExtraContent(null)}
                        className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" /> Thu gọn
                    </button>
                </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default ExplanationSection;
