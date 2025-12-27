import React, { useState, useEffect, useRef } from 'react';
import { getMoleculeExplanation, chatWithMolecule } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AIChatPanelProps {
  pdbId: string;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ pdbId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pdbId) {
      setLoadingSummary(true);
      getMoleculeExplanation(pdbId).then(text => {
        setSummary(text);
        setLoadingSummary(false);
      });
      setMessages([]); // Reset chat on new molecule
    }
  }, [pdbId]);

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [messages]);

  const handleSend = async () => {
      if (!input.trim() || chatLoading) return;
      
      const userMsg: ChatMessage = { role: 'user', text: input };
      setMessages(prev => [...prev, userMsg]);
      setInput("");
      setChatLoading(true);

      const responseText = await chatWithMolecule(messages, userMsg.text, pdbId);
      
      const botMsg: ChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
      setChatLoading(false);
  };

  return (
    <div className={`absolute top-0 right-0 h-full bg-slate-900/90 backdrop-blur-md transition-all duration-300 border-l border-slate-700 ${isOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
      <div className="h-full flex flex-col relative w-80">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <i className="fa-solid fa-times"></i>
        </button>

        <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-cyan-400 mb-2">PDB: {pdbId}</h2>
            <div className="text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                {loadingSummary ? (
                    <div className="animate-pulse">Analyzing structure...</div>
                ) : (
                    summary
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {chatLoading && <div className="text-xs text-slate-500 text-center">AI is thinking...</div>}
        </div>

        <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about residues..."
                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <button 
                    onClick={handleSend}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded transition-colors"
                >
                    <i className="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
      </div>
      
      {/* Toggle Button (Visible when closed) */}
      {!isOpen && (
         <button 
            onClick={() => setIsOpen(true)}
            className="fixed top-24 right-0 transform translate-x-full -ml-10 bg-cyan-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-cyan-500 transition-all z-50"
         >
             <i className="fa-solid fa-robot"></i>
         </button>
      )}
    </div>
  );
};

export default AIChatPanel;
