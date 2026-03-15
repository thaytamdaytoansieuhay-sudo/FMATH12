import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithAI } from '../services/geminiService';
import MathRenderer from './MathRenderer';
import { MessageCircle, X, Send, Loader2, Sparkles, Bot } from 'lucide-react';

interface ChatBotProps {
  topic: string;
  onAIError?: (errType: string) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ topic, onAIError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: `Chào bạn! Mình là AI FMath12. Bạn có thắc mắc gì về bài học "${topic}" không?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    setMessages([{ id: 'init', role: 'model', text: `Chào bạn! Mình là AI FMath12. Bạn có thắc mắc gì về bài học "${topic}" không?` }]);
  }, [topic]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await chatWithAI(messages, input, topic);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      if (error.message === 'RESELECT_KEY' && onAIError) {
          onAIError('RESELECT_KEY');
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Lỗi kết nối AI. Vui lòng kiểm tra lại cấu hình khóa.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-blue-500/30 transition-all hover:scale-110 z-50 flex items-center justify-center group"
        >
          <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-200 z-50 animate-fade-in-up overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Bot size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Trợ lý AI</h3>
                    <div className="flex items-center gap-1.5 opacity-80">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                        <span className="text-xs">Đang hoạt động</span>
                    </div>
                </div>
            </div>
            <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200 mt-1">
                        <Bot size={16} />
                    </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-sm shadow-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <MathRenderer content={msg.text} className={msg.role === 'user' ? 'text-white' : 'text-slate-800'} />
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200 mt-1">
                    <Bot size={16} />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhập câu hỏi..."
                className="flex-1 px-4 py-2 bg-transparent border-none focus:outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all transform hover:scale-105"
              >
                <Send size={16} className={input.trim() ? 'ml-0.5' : ''} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
