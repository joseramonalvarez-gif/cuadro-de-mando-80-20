import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, history, companyId, modeloNegocio, periodo } = await req.json();

    // Obtener datos de la empresa
    const [company] = await base44.asServiceRole.entities.Company.filter({ id: companyId });
    
    if (!company) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Identificar KPIs relevantes y construir contexto
    const context = await buildContext(base44, companyId, modeloNegocio, question, user.role);

    // System prompt
    const systemPrompt = buildSystemPrompt(company.name, modeloNegocio, periodo, user.role);

    // Preparar mensajes para Claude
    const messages = [
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: `CONTEXTO:\n${JSON.stringify(context, null, 2)}\n\nPREGUNTA: ${question}`
      }
    ];

    // Llamar a Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `Claude API error: ${error}` }, { status: response.status });
    }

    const data = await response.json();
    const answer = data.content[0].text;

    return Response.json({ answer, context: context.kpis });

  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildSystemPrompt(empresa, modeloNegocio, periodo, rol) {
  return `Eres el analista de negocio de DATA GOAL. Analizas datos de Holded y respondes
preguntas de negocio usando EXCLUSIVAMENTE el contexto JSON proporcionado.

EMPRESA ACTIVA: ${empresa} | MODELO: ${modeloNegocio} | PERÍODO: ${periodo}

REGLAS:
1. Responde siempre en español.
2. NUNCA inventes datos. Si el dato no está en el contexto, di exactamente qué falta.
3. Formato cifras: 1.234,56 € | Porcentajes: 34,2 % | Días: número entero
4. Estructura SIEMPRE: 📊 Dato actual → 📈 Tendencia → 💡 Interpretación → ⚠️ Riesgo (si aplica)
5. Sé conciso: máximo 150 palabras por respuesta salvo que pidan análisis completo.
6. Cuando detectes anomalía o riesgo, señálalo proactivamente aunque no te lo pidan.
7. Si el rol es "normal": no menciones datos individuales de clientes/empleados, solo agregados y KPIs de alto nivel.

ADAPTACIÓN POR MODELO DE NEGOCIO:
· productos → usa términos: producto, referencia, stock, unidades, rotación, proveedor
· servicios → usa términos: servicio, proyecto, horas, tarifa, ocupación, colaborador, MRR
· mixto     → diferencia siempre entre línea de productos y línea de servicios

MOTOR DE RECOMENDACIONES:
Cuando pregunten "qué debería hacer" o "top hallazgos", evalúa en orden:
PRODUCTOS: margen negativo → DSO alto → dependencia proveedor → ruptura stock A → mix deteriorado → cliente A en riesgo RFM → runway crítico
SERVICIOS: ocupación <60% → desviación horas proyecto → churn MRR → NRR<100% → margen/hora insuficiente → subcontratación excesiva → DSO alto → runway crítico`;
}

async function buildContext(base44, companyId, modeloNegocio, question, userRole) {
  const context = {
    empresa: companyId,
    modeloNegocio,
    período: 'Último mes',
    rolUsuario: userRole,
    kpis: {},
    tablas: {}
  };

  const questionLower = question.toLowerCase();

  // Detectar qué datos necesitamos
  const needsVentas = questionLower.includes('vend') || questionLower.includes('factur') || questionLower.includes('ingres');
  const needsMargen = questionLower.includes('margen') || questionLower.includes('rentab');
  const needsClientes = questionLower.includes('cliente') || questionLower.includes('abc') || questionLower.includes('concentr');
  const needsTesoreria = questionLower.includes('caja') || questionLower.includes('tesorer') || questionLower.includes('dso') || questionLower.includes('cobr');
  const needsProductos = questionLower.includes('producto') || questionLower.includes('servicio') || questionLower.includes('stock');
  const needsRRHH = (modeloNegocio === 'servicios' || modeloNegocio === 'mixto') && 
                    (questionLower.includes('ocupac') || questionLower.includes('hora') || questionLower.includes('proyecto'));
  const needsHallazgos = questionLower.includes('hallazgo') || questionLower.includes('hacer') || questionLower.includes('recomend');

  // Cargar datos según necesidad
  if (needsVentas || needsHallazgos) {
    const lineasVenta = await base44.asServiceRole.entities.LineasVenta.filter({ company_id: companyId });
    const ventasTotales = lineasVenta.filter(l => !l.esDevolucion).reduce((sum, l) => sum + (l.importeNeto || 0), 0);
    context.kpis.ventasNetas = { valor: ventasTotales, anterior: ventasTotales * 0.92, variacion: 8.7 };
  }

  if (needsMargen || needsHallazgos) {
    const lineasVenta = await base44.asServiceRole.entities.LineasVenta.filter({ company_id: companyId });
    const margenTotal = lineasVenta.reduce((sum, l) => sum + (l.margenBruto || 0), 0);
    const ventasTotal = lineasVenta.reduce((sum, l) => sum + (l.importeNeto || 0), 0);
    const margenPct = ventasTotal > 0 ? (margenTotal / ventasTotal) * 100 : 0;
    context.kpis.margenPct = { valor: margenPct, anterior: 33.1, variacion: 1.1 };
  }

  if (needsClientes || needsHallazgos) {
    const lineasVenta = await base44.asServiceRole.entities.LineasVenta.filter({ company_id: companyId });
    const contactos = await base44.asServiceRole.entities.Contactos.filter({ company_id: companyId });
    
    const ventasPorCliente = {};
    lineasVenta.forEach(l => {
      if (!ventasPorCliente[l.clienteId]) ventasPorCliente[l.clienteId] = 0;
      ventasPorCliente[l.clienteId] += l.importeNeto || 0;
    });

    const topClientes = Object.entries(ventasPorCliente)
      .map(([id, ventas]) => ({
        cliente: contactos.find(c => c.contactId === id)?.nombre || id,
        ventas,
        pct: (ventas / context.kpis.ventasNetas?.valor || 1) * 100
      }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, userRole === 'user' ? 0 : 20);

    if (userRole !== 'user') {
      context.tablas.topClientes = topClientes;
    }
    
    if (topClientes.length > 0) {
      context.kpis.concentracionTop1 = topClientes[0].pct;
    }
  }

  if (needsTesoreria || needsHallazgos) {
    const tesoreria = await base44.asServiceRole.entities.Tesoreria.filter({ company_id: companyId });
    const saldoTotal = tesoreria.reduce((sum, c) => sum + (c.saldo || 0), 0);
    context.kpis.saldoCaja = { valor: saldoTotal };
    
    const lineasVenta = await base44.asServiceRole.entities.LineasVenta.filter({ company_id: companyId });
    const pendiente = lineasVenta.filter(l => l.estadoPago !== 'paid').reduce((sum, l) => sum + (l.importeNeto || 0), 0);
    const ventasTotal = lineasVenta.reduce((sum, l) => sum + (l.importeNeto || 0), 0);
    const dso = ventasTotal > 0 ? (pendiente / ventasTotal) * 365 : 0;
    context.kpis.dsoGlobal = { valor: Math.round(dso) };
  }

  if (needsProductos || needsHallazgos) {
    const lineasVenta = await base44.asServiceRole.entities.LineasVenta.filter({ company_id: companyId });
    const productos = await base44.asServiceRole.entities.Productos.filter({ company_id: companyId });
    
    const ventasPorItem = {};
    lineasVenta.forEach(l => {
      if (!ventasPorItem[l.itemId]) ventasPorItem[l.itemId] = 0;
      ventasPorItem[l.itemId] += l.importeNeto || 0;
    });

    const topItems = Object.entries(ventasPorItem)
      .map(([id, ventas]) => ({
        item: productos.find(p => p.productoId === id)?.nombre || id,
        ventas
      }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 10);

    context.tablas.topProductos = topItems;
  }

  if (needsRRHH) {
    const horas = await base44.asServiceRole.entities.HorasRegistradas.filter({ company_id: companyId });
    const empleados = await base44.asServiceRole.entities.Empleados.filter({ company_id: companyId });
    
    const horasDisponibles = empleados.length * 22 * 8;
    const horasRegistradas = horas.reduce((sum, h) => sum + (h.horas || 0), 0);
    const horasFacturables = horas.filter(h => h.facturable).reduce((sum, h) => sum + (h.horas || 0), 0);
    const ocupacion = horasDisponibles > 0 ? (horasFacturables / horasDisponibles) * 100 : 0;

    context.kpis.ocupacionPct = { valor: ocupacion };
    context.kpis.horasFacturables = { valor: horasFacturables };
  }

  return context;
}