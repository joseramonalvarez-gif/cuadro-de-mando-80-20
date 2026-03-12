import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, RefreshCw, Sparkles } from 'lucide-react';
import LoadingState from '../components/shared/LoadingState';
import DemoBanner from '../components/shared/DemoBanner';

export default function Chat() {
  const { activeCompany, user, loading: contextLoading } = useApp();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  const modeloNegocio = activeCompany?.modelo_negocio || 'mixto';
  const userRole = user?.role || 'user';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedQuestions = getSuggestedQuestions(modeloNegocio, userRole);

  async function handleSendMessage(customQuestion) {
    const questionText = customQuestion || question;
    if (!questionText.trim()) return;

    const userMessage = { role: 'user', content: questionText };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        const demoAnswer = generateDemoAnswer(questionText, modeloNegocio);
        setMessages(prev => [...prev, { role: 'assistant', content: demoAnswer }]);
        setLoading(false);
      }, 1500);
      return;
    }

    try {
      const history = messages.filter(m => m.role !== 'system');
      
      const response = await base44.functions.invoke('chatIntelligente', {
        question: questionText,
        history,
        companyId: activeCompany.id,
        modeloNegocio,
        periodo: 'Último mes'
      });

      const assistantMessage = { role: 'assistant', content: response.data.answer };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: '❌ Error al procesar tu pregunta. Por favor, intenta de nuevo.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  }

  function handleNewConversation() {
    setMessages([]);
    setQuestion('');
  }

  function getSuggestedQuestions(modelo, role) {
    const base = [
      '¿Cuánto hemos facturado este mes?',
      '¿Cuál es nuestro margen?',
      '¿Hay facturas vencidas?'
    ];

    if (role === 'admin' || role === 'avanzado') {
      if (modelo === 'productos' || modelo === 'mixto') {
        return [
          ...base,
          'Análisis ABC de clientes',
          'Top 5 hallazgos para actuar esta semana',
          '¿Qué productos tienen margen negativo?'
        ];
      } else if (modelo === 'servicios') {
        return [
          ...base,
          '¿Cuál es nuestra ocupación?',
          '¿Qué proyectos están desviados en horas?',
          'Top 5 hallazgos para actuar esta semana'
        ];
      }
    }

    if (modelo === 'servicios' || modelo === 'mixto') {
      return [...base, '¿Cuál es nuestra ocupación?'];
    }

    return [...base, '¿Hay stock sin existencias?'];
  }

  function generateDemoAnswer(question, modelo) {
    const qLower = question.toLowerCase();

    if (qLower.includes('vend') || qLower.includes('factur')) {
      return `📊 **Ventas del período:** 284.750 €

📈 **Tendencia:** +8,2% vs mismo período año anterior (263.200 €)

💡 **Interpretación:** Crecimiento saludable. La tendencia es positiva y sostenida.

${modelo === 'servicios' ? '✅ **Nota:** El 65% corresponde a contratos recurrentes (MRR)' : '✅ **Nota:** El 70% corresponde a clientes clase A'}`;
    }

    if (qLower.includes('margen')) {
      return `📊 **Margen bruto:** 34,2%

📈 **Tendencia:** +1,1 pp vs período anterior (33,1%)

💡 **Interpretación:** Margen saludable y en mejora. Por encima del objetivo mínimo (25%).

⚠️ **Riesgo detectado:** 3 ${modelo === 'servicios' ? 'proyectos' : 'productos'} con margen negativo que erosionan el agregado.`;
    }

    if (qLower.includes('ocupac')) {
      return `📊 **Ocupación del equipo:** 76,7%

📈 **Tendencia:** Estable (+2 pp vs mes anterior)

💡 **Interpretación:** Ocupación óptima (🟢 >75%). El equipo está bien aprovechado sin riesgo de burnout.

✅ **Nota:** 1.620 horas facturables de 2.112 disponibles.`;
    }

    if (qLower.includes('hallazgo') || qLower.includes('hacer')) {
      return `🎯 **Top 5 Hallazgos para Actuar:**

1. ⚠️ **DSO en 52 días** (objetivo: <45d) → Acelerar cobros
2. 🔴 **Morosidad crítica:** 12.500 € con +90d vencido
3. 💡 **Cliente "ACME Corp":** Clase A en ventas pero margen negativo
4. 📉 **${modelo === 'servicios' ? 'Proyecto "Web Corp" desviado +31% en horas' : 'Producto "Standard" sin rotación en 45 días'}'
5. 🟡 **Dependencia:** Proveedor "Global SL" representa 28,5% de compras

💼 **Acción inmediata:** Revisar condiciones con ACME Corp y ejecutar gestión de cobros +90d.`;
    }

    return `📊 He analizado tu pregunta sobre "${question}".

💡 **Interpretación:** Basándome en los datos actuales de tu empresa, los indicadores están dentro de rangos normales.

❓ Para darte una respuesta más específica, prueba con preguntas como:
· "¿Cuánto hemos facturado este mes?"
· "¿Cuál es nuestro margen?"
· "Top 5 hallazgos para actuar esta semana"`;
  }

  if (contextLoading) {
    return <LoadingState message="Cargando chat inteligente..." />;
  }

  return (
    <div className="space-y-4">
      {isDemo && <DemoBanner />}

      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#33A19A] to-[#3E8CDD] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
                Chat Inteligente
              </h2>
              <p className="text-sm text-[#3E4C59]">
                Pregunta sobre tus datos en lenguaje natural
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewConversation}
            className="text-[#3E4C59]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Nueva conversación
          </Button>
        </div>

        {/* Preguntas sugeridas */}
        {messages.length === 0 && (
          <div className="mb-6">
            <p className="text-sm text-[#3E4C59] mb-3">Preguntas sugeridas:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="px-3 py-2 text-sm bg-[#F0F5F5] hover:bg-[#E6F7F6] text-[#3E4C59] rounded-lg transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensajes */}
        <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#33A19A] text-white'
                    : 'bg-[#F0F5F5] text-[#1B2731]'
                }`}
              >
                <div className="text-sm whitespace-pre-line">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#F0F5F5] rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#33A19A] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#33A19A] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#33A19A] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-[#3E4C59] ml-2">Analizando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            placeholder="Escribe tu pregunta..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={loading || !question.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-4 p-3 bg-[#FFFAF3] rounded-lg border border-[#E6A817]/20">
          <p className="text-xs text-[#3E4C59]">
            💡 <strong>Tip:</strong> El chat analiza solo los datos de tu empresa actual ({activeCompany?.name}). 
            Puedes preguntar sobre ventas, márgenes, clientes, tesorería, productos
            {(modeloNegocio === 'servicios' || modeloNegocio === 'mixto') && ', ocupación, proyectos'} y más.
          </p>
        </div>
      </div>
    </div>
  );
}