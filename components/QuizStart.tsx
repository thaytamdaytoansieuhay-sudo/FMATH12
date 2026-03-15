import React, { useState } from 'react';
import { AppStatus, QuizConfig } from '../types';

interface QuizStartProps {
  onStart: (topic: string, config: QuizConfig) => void;
  status: AppStatus;
}

const QuizStart: React.FC<QuizStartProps> = ({ onStart, status }) => {
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');
  const [openChapterIndex, setOpenChapterIndex] = useState<number | null>(0);
  
  // Quiz Configuration State
  const [config, setConfig] = useState<QuizConfig>({
    mcCount: 10,
    tfCount: 4,
    saCount: 4
  });

  // Dữ liệu mục lục SGK Toán 12 - Kết nối tri thức
  const textbookData = [
    {
      chapter: "Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số",
      lessons: [
        "Bài 1: Tính đơn điệu và cực trị của hàm số",
        "Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số",
        "Bài 3: Đường tiệm cận của đồ thị hàm số",
        "Bài 4: Khảo sát sự biến thiên và vẽ đồ thị của hàm số",
        "Bài 5: Ứng dụng đạo hàm để giải quyết một số vấn đề thực tiễn"
      ]
    },
    {
      chapter: "Chương II: Vectơ và hệ trục tọa độ trong không gian",
      lessons: [
        "Bài 6: Vectơ trong không gian",
        "Bài 7: Hệ trục tọa độ trong không gian",
        "Bài 8: Biểu thức tọa độ của các phép toán vectơ"
      ]
    },
    {
      chapter: "Chương III: Các số đặc trưng đo mức độ phân tán (Mẫu ghép nhóm)",
      lessons: [
        "Bài 9: Khoảng biến thiên và khoảng tứ phân vị",
        "Bài 10: Phương sai và độ lệch chuẩn"
      ]
    },
    {
      chapter: "Chương IV: Nguyên hàm và Tích phân",
      lessons: [
        "Bài 11: Nguyên hàm",
        "Bài 12: Tích phân",
        "Bài 13: Ứng dụng hình học của tích phân"
      ]
    },
    {
      chapter: "Chương V: Phương pháp tọa độ trong không gian",
      lessons: [
        "Bài 14: Phương trình mặt phẳng",
        "Bài 15: Phương trình đường thẳng trong không gian",
        "Bài 16: Công thức tính góc trong không gian",
        "Bài 17: Phương trình mặt cầu"
      ]
    },
    {
      chapter: "Chương VI: Xác suất có điều kiện",
      lessons: [
        "Bài 18: Xác suất có điều kiện",
        "Bài 19: Công thức xác suất toàn phần và công thức Bayes"
      ]
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề toán học.');
      return;
    }
    setError('');
    onStart(topic, config);
  };

  const handleSelectLesson = (lesson: string) => {
    setTopic(lesson);
    // User still needs to click Start to confirm config
  };

  const toggleChapter = (index: number) => {
    setOpenChapterIndex(openChapterIndex === index ? null : index);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Topic Selection */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 h-fit">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Luyện Thi Toán THPT</h1>
          <p className="text-slate-500 text-sm">Chương trình GDPT 2018 - Kết nối tri thức</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
              Chủ đề bài thi
            </label>
            <div className="relative">
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={status === AppStatus.GENERATING}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-slate-50 disabled:text-slate-400 font-medium"
                placeholder="Chọn bài học bên dưới hoặc nhập chủ đề..."
              />
              {status === AppStatus.GENERATING && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div>
             <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-3">
               Mục lục SGK Toán 12
             </p>
             <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 max-h-[400px] overflow-y-auto custom-scrollbar">
               {textbookData.map((section, idx) => (
                 <div key={idx} className="border-b border-slate-200 last:border-0">
                   <button
                     type="button"
                     onClick={() => toggleChapter(idx)}
                     className="w-full flex justify-between items-center px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left focus:outline-none sticky top-0 z-10"
                   >
                     <span className="font-semibold text-slate-700 text-sm">
                       {section.chapter}
                     </span>
                     <svg
                       className={`w-5 h-5 text-slate-400 transform transition-transform duration-200 ${
                         openChapterIndex === idx ? 'rotate-180' : ''
                       }`}
                       fill="none"
                       stroke="currentColor"
                       viewBox="0 0 24 24"
                     >
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                     </svg>
                   </button>
                   
                   {openChapterIndex === idx && (
                     <div className="bg-slate-50 px-4 py-2 space-y-1 border-t border-slate-100">
                       {section.lessons.map((lesson, lIdx) => (
                         <button
                           key={lIdx}
                           type="button"
                           onClick={() => handleSelectLesson(lesson)}
                           disabled={status === AppStatus.GENERATING}
                           className={`w-full text-left px-3 py-2 rounded text-sm transition-all flex items-center gap-2 ${
                               topic === lesson 
                               ? 'bg-blue-100 text-blue-700 font-medium' 
                               : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-blue-600'
                           }`}
                         >
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${topic === lesson ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                            {lesson}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </div>
        </form>
      </div>

      {/* Right Column: Configuration */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 h-fit">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Cấu hình đề thi
        </h2>
        
        <div className="space-y-6">
            {/* Setting: MC */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-blue-800">Trắc nghiệm (4 chọn 1)</label>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{config.mcCount} câu</span>
                </div>
                <input 
                    type="range" min="1" max="20" step="1"
                    value={config.mcCount}
                    onChange={(e) => setConfig({...config, mcCount: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-slate-500 mt-1 italic">
                    ⚠️ Mức độ: <strong>Chỉ Nhận Biết</strong> (Cơ bản)
                </p>
            </div>

            {/* Setting: TF */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-emerald-800">Đúng / Sai</label>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">{config.tfCount} câu</span>
                </div>
                <input 
                    type="range" min="1" max="10" step="1"
                    value={config.tfCount}
                    onChange={(e) => setConfig({...config, tfCount: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                 <p className="text-xs text-slate-500 mt-1 italic">
                    ✅ Mức độ: <strong>Đầy đủ</strong> (Nhận biết, Thông hiểu, Vận dụng)
                </p>
            </div>

            {/* Setting: SA */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-purple-800">Trả lời ngắn</label>
                    <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">{config.saCount} câu</span>
                </div>
                <input 
                    type="range" min="1" max="10" step="1"
                    value={config.saCount}
                    onChange={(e) => setConfig({...config, saCount: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                 <p className="text-xs text-slate-500 mt-1 italic">
                    ✅ Mức độ: <strong>Đầy đủ</strong> (Nhận biết, Thông hiểu, Vận dụng)
                </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
                 <button
                    onClick={handleSubmit}
                    disabled={status === AppStatus.GENERATING}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                    {status === AppStatus.GENERATING ? 'Đang xử lý...' : 'Bắt đầu làm bài'}
                </button>
            </div>
        </div>

        {status === AppStatus.GENERATING && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs animate-fade-in">
                <strong>AI đang làm việc:</strong> Hệ thống đang soạn {config.mcCount + config.tfCount + config.saCount} câu hỏi theo cấu hình bạn chọn.
            </div>
        )}
      </div>
    </div>
  );
};

export default QuizStart;
