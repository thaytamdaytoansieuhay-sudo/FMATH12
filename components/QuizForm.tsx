import React from 'react';
import { QuizData, UserAnswers } from '../types';
import MathRenderer from './MathRenderer';

interface QuizFormProps {
  quizData: QuizData;
  userAnswers: UserAnswers;
  setUserAnswers: React.Dispatch<React.SetStateAction<UserAnswers>>;
  onSubmit: () => void;
}

const QuizForm: React.FC<QuizFormProps> = ({ quizData, userAnswers, setUserAnswers, onSubmit }) => {

  const handleMCChange = (qId: number, option: string) => {
    setUserAnswers(prev => ({
      ...prev,
      multipleChoice: { ...prev.multipleChoice, [qId]: option }
    }));
  };

  const handleTFChange = (qId: string, value: boolean) => {
    setUserAnswers(prev => ({
      ...prev,
      trueFalse: { ...prev.trueFalse, [qId]: value }
    }));
  };

  const handleSAChange = (qId: number, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      shortAnswer: { ...prev.shortAnswer, [qId]: value }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600">
        <h2 className="text-xl font-bold text-slate-800">Chủ đề: {quizData.topic}</h2>
        <p className="text-slate-500 mt-1">Hoàn thành các câu hỏi bên dưới và nhấn Nộp bài.</p>
      </div>

      {/* Part 1: Multiple Choice */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">Phần 1</span>
          <h3 className="text-lg font-bold text-slate-800">Trắc nghiệm (10 câu)</h3>
        </div>
        <div className="space-y-6">
          {quizData.multipleChoice.map((q, index) => (
            <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 font-bold rounded-full text-sm mt-1">
                  {index + 1}
                </span>
                <div className="flex-grow">
                  <MathRenderer content={q.question} className="text-lg font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                {q.options.map((opt, i) => {
                    const isSelected = userAnswers.multipleChoice[q.id] === opt;
                    return (
                        <div
                            key={i}
                            role="button"
                            onClick={() => handleMCChange(q.id, opt)}
                            className={`text-left px-4 py-3 rounded-lg border transition-all cursor-pointer flex items-start gap-2 ${
                                isSelected
                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-900'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                            <span className="font-semibold mt-0.5 whitespace-nowrap">{String.fromCharCode(65 + i)}.</span> 
                            <MathRenderer content={opt} />
                        </div>
                    );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Part 2: True/False */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full">Phần 2</span>
            <h3 className="text-lg font-bold text-slate-800">Đúng / Sai (4 câu)</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
            {quizData.trueFalseQuestions.map((q, index) => {
                const answer = userAnswers.trueFalse[q.id];
                return (
                    <div key={q.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex gap-3 w-full">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold rounded-full text-sm mt-1">
                                {index + 1}
                            </span>
                            <div className="flex-grow">
                                <MathRenderer content={q.statement} className="font-medium" />
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 ml-11 md:ml-0 self-end md:self-center">
                            <button
                                onClick={() => handleTFChange(q.id, true)}
                                className={`px-5 py-2 rounded-lg font-semibold border transition-colors ${
                                    answer === true
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                                }`}
                            >
                                ĐÚNG
                            </button>
                            <button
                                onClick={() => handleTFChange(q.id, false)}
                                className={`px-5 py-2 rounded-lg font-semibold border transition-colors ${
                                    answer === false
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                                }`}
                            >
                                SAI
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
      </section>

      {/* Part 3: Short Answer */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <span className="bg-purple-100 text-purple-800 text-sm font-bold px-3 py-1 rounded-full">Phần 3</span>
            <h3 className="text-lg font-bold text-slate-800">Trả lời ngắn (4 câu)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizData.shortAnswer.map((q, index) => (
                <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="flex gap-3 mb-4">
                         <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600 font-bold rounded-full text-sm mt-1">
                            {index + 1}
                        </span>
                        <div className="flex-grow">
                             <MathRenderer content={q.question} className="font-medium" />
                        </div>
                    </div>
                    <div className="mt-auto ml-11">
                        <input
                            type="text"
                            value={userAnswers.shortAnswer[q.id] || ''}
                            onChange={(e) => handleSAChange(q.id, e.target.value)}
                            placeholder="Nhập đáp án..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                </div>
            ))}
        </div>
      </section>

      <div className="flex justify-center pt-8">
        <button
          onClick={onSubmit}
          className="bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold py-4 px-12 rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
        >
          Nộp Bài & Xem Kết Quả
        </button>
      </div>
    </div>
  );
};

export default QuizForm;
