import React, { useState } from 'react';
import { generateHint } from '../services/groqService';
import MathRenderer from './MathRenderer';
import { Lightbulb, Loader2, AlertCircle } from 'lucide-react';

interface HintButtonProps {
  question: string;
  topic: string;
}

const HintButton: React.FC<HintButtonProps> = ({ question, topic }) => {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetHint = async () => {
    if (hint) return;
    setLoading(true);
    setError('');
    try {
      const result = await generateHint(question, topic);
      setHint(result);
    } catch (e) {
      console.error(e);
      setError("Không thể tải gợi ý. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {!hint && !loading && !error && (
        <button
          onClick={handleGetHint}
          className="flex items-center gap-2 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          <Lightbulb size={16} />
          <span>Gợi ý từ AI</span>
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Loader2 size={16} className="animate-spin text-amber-500" />
          <span>AI đang suy nghĩ gợi ý...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={handleGetHint} className="ml-2 underline hover:text-red-800">Thử lại</button>
        </div>
      )}

      {hint && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 relative animate-fade-in">
          <div className="absolute -top-3 left-4 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
            <Lightbulb size={10} className="fill-amber-500 text-amber-500" /> GỢI Ý
          </div>
          <div className="text-slate-800 text-sm mt-2">
            <MathRenderer content={hint} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HintButton;
