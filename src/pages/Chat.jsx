import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import LoadingState from '../components/shared/LoadingState';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_QUESTIONS = [
  '¿Cuáles son mis 5 clientes más rentables?',
  '¿Cómo ha evolucionado mi margen bruto este trimestre?',
  '¿Tengo facturas vencidas sin cobrar?',
  '¿Cuál es mi previsión de tesorería para los próximos 30 días?',
  '¿Qué proveedores concentran más del 15% de mis compras?',
  '¿Cuál es el DSO actual y cómo se compara con el trimestre anterior?',
];

export default function Chat() {
  const { user, activeCompany, loading: appLoading, isAdmin, isAdvanced } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const isNormalUser = !isAdmin && !isAdvanced;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const systemPrompt = `Eres un asistente financiero experto para la empresa "${activeCompany?.name || 'Demo'}". 
Responde en español. Sé conciso y usa datos numéricos cuando sea posible. 
Formato: usa markdown para estructurar respuestas.
Si no tienes datos reales, proporciona análisis basados en los datos de ejemplo disponibles.
${isNormalUser ? 'Da respuestas simplificadas y accesibles.' : 'Da respuestas detalladas con análisis profundo.'}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nPregunta del usuario: ${text}`,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsThinking(false);
  }

  if (appLoading) return <LoadingState />;

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-[#33A19A]/10">
          <Sparkles className="w-5 h-5 text-[#33A19A]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Chat Inteligente</h2>
          <p className="text-xs text-[#3E4C59]">Pregunta sobre tus datos financieros</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 min-h-[500px] flex flex-col">
        <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[520px]">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-10 h-10 text-[#B7CAC9] mx-auto mb-3" />
              <p className="text-sm text-[#3E4C59] mb-6">¿En qué puedo ayudarte hoy?</p>
              
              {/* Suggested questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[600px] mx-auto">
                {(isNormalUser ? SUGGESTED_QUESTIONS.slice(0, 4) : SUGGESTED_QUESTIONS).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-left text-xs p-3 rounded-xl border border-[#E8EEEE] hover:border-[#33A19A] hover:bg-[#F0F7F7] transition-colors text-[#3E4C59]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#33A19A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-[#33A19A]" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#1B2731] text-white'
                  : 'bg-[#F8F6F1] text-[#1B2731]'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[#1B2731]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-[#1B2731]" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#33A19A]/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-[#33A19A]" />
              </div>
              <div className="bg-[#F8F6F1] rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#33A19A]" />
                <span className="text-xs text-[#3E4C59]">Analizando datos...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-[#E8EEEE] p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isNormalUser ? 'Selecciona una pregunta sugerida o escribe aquí...' : 'Escribe tu pregunta...'}
              className="flex-1 border-[#B7CAC9] focus:border-[#33A19A]"
              disabled={isThinking}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="bg-[#33A19A] hover:bg-[#2B8A84] text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}