import React from 'react';
import { QuizData, UserAnswers } from '../types';
import MathRenderer from './MathRenderer';
import ExplanationSection from './ExplanationSection';

interface QuizResultsProps {
  quizData: QuizData;
  userAnswers: UserAnswers;
  onRetry: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ quizData, userAnswers, onRetry }) => {
  // Calculate Scores
  let mcCorrect = 0;
  quizData.multipleChoice.forEach(q => {
    if (userAnswers.multipleChoice[q.id] === q.correctAnswer) mcCorrect++;
  });

  let tfCorrect = 0;
  quizData.trueFalseQuestions.forEach(q => {
    if (userAnswers.trueFalse[q.id] === q.isCorrect) tfCorrect++;
  });

  let saCorrect = 0;
  quizData.shortAnswer.forEach(q => {
    const userVal = (userAnswers.shortAnswer[q.id] || '').trim().toLowerCase();
    const correctVal = q.correctAnswer.trim().toLowerCase();
    if (userVal === correctVal || (userVal && correctVal.includes(userVal))) saCorrect++;
  });

  const totalQuestions = quizData.multipleChoice.length + quizData.trueFalseQuestions.length + quizData.shortAnswer.length;
  const totalCorrect = mcCorrect + tfCorrect + saCorrect;
  const score = Math.round((totalCorrect / totalQuestions) * 10 * 10) / 10;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Score Header */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-2">Kết Quả Bài Làm</h2>
        <div className="text-6xl font-black tracking-tight text-yellow-400 mb-2">{score}<span className="text-2xl text-slate-400 font-medium">/10</span></div>
        <p className="text-slate-300">Bạn đã trả lời đúng {totalCorrect} trên {totalQuestions} câu hỏi.</p>
        <button onClick={onRetry} className="mt-6 px-6 py-2 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-colors">
            Làm bài mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-blue-600">Trắc nghiệm</h4>
            <p className="text-2xl font-bold">{mcCorrect}/10</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-emerald-600">Đúng / Sai</h4>
            <p className="text-2xl font-bold">{tfCorrect}/4</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-purple-600">Trả lời ngắn</h4>
            <p className="text-2xl font-bold">{saCorrect}/4</p>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-slate-800 border-b pb-4">Chi tiết lời giải</h3>

        {/* MC Review */}
        <div>
            <h4 className="text-lg font-bold text-blue-800 mb-4">Phần 1: Trắc nghiệm</h4>
            <div className="space-y-6">
                {quizData.multipleChoice.map((q, idx) => {
                    const isCorrect = userAnswers.multipleChoice[q.id] === q.correctAnswer;
                    return (
                        <div key={q.id} className={`p-6 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex gap-2 mb-3">
                                <span className="font-bold text-slate-700">Câu {idx + 1}:</span>
                                <div className="text-slate-900 w-full"><MathRenderer content={q.question} /></div>
                            </div>
                            <div className="text-sm space-y-2 mb-4">
                                <div className={isCorrect ? "text-green-700 font-semibold" : "text-red-600"}>
                                    <span className="mr-1">Bạn chọn:</span>
                                    {userAnswers.multipleChoice[q.id] ? <MathRenderer content={userAnswers.multipleChoice[q.id]} className="inline-block" /> : '(Bỏ trống)'}
                                </div>
                                {!isCorrect && <div className="text-green-700 font-semibold flex items-start gap-1">
                                    <span className="whitespace-nowrap">Đáp án đúng:</span>
                                    <MathRenderer content={q.correctAnswer} className="inline-block" />
                                </div>}
                            </div>
                            <ExplanationSection question={q.question} originalExplanation={q.explanation} />
                        </div>
                    );
                })}
            </div>
        </div>

        {/* TF Review */}
        <div>
            <h4 className="text-lg font-bold text-emerald-800 mb-4">Phần 2: Đúng / Sai</h4>
            <div className="space-y-6">
                {quizData.trueFalseQuestions.map((q, idx) => {
                    const userVal = userAnswers.trueFalse[q.id];
                    const isCorrect = userVal === q.isCorrect;
                    return (
                        <div key={q.id} className={`p-6 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex gap-2 mb-3">
                                <span className="font-bold text-slate-700">Câu {idx + 1}:</span>
                                <div className="text-slate-900 w-full"><MathRenderer content={q.statement} /></div>
                            </div>
                            <div className="text-sm space-y-1 mb-4">
                                <p className={isCorrect ? "text-green-700 font-semibold" : "text-red-600"}>
                                    Bạn chọn: {userVal === null ? '(Bỏ trống)' : (userVal ? 'ĐÚNG' : 'SAI')}
                                </p>
                                {!isCorrect && <p className="text-green-700 font-semibold">Đáp án đúng: {q.isCorrect ? 'ĐÚNG' : 'SAI'}</p>}
                            </div>
                            <ExplanationSection question={q.statement} originalExplanation={q.explanation} />
                        </div>
                    );
                })}
            </div>
        </div>

        {/* SA Review */}
        <div>
            <h4 className="text-lg font-bold text-purple-800 mb-4">Phần 3: Trả lời ngắn</h4>
            <div className="space-y-6">
                {quizData.shortAnswer.map((q, idx) => {
                    const userVal = (userAnswers.shortAnswer[q.id] || '').trim().toLowerCase();
                    const correctVal = q.correctAnswer.trim().toLowerCase();
                    const isCorrect = userVal === correctVal || (userVal && correctVal.includes(userVal));

                    return (
                        <div key={q.id} className={`p-6 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex gap-2 mb-3">
                                <span className="font-bold text-slate-700">Câu {idx + 1}:</span>
                                <div className="text-slate-900 w-full"><MathRenderer content={q.question} /></div>
                            </div>
                            <div className="text-sm space-y-1 mb-4">
                                <p className={isCorrect ? "text-green-700 font-semibold" : "text-red-600"}>
                                    Trả lời: {userAnswers.shortAnswer[q.id] || '(Bỏ trống)'}
                                </p>
                                {!isCorrect && <p className="text-green-700 font-semibold">Đáp án chuẩn: {q.correctAnswer}</p>}
                            </div>
                            <ExplanationSection question={q.question} originalExplanation={q.explanation} />
                        </div>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
};

export default QuizResults;