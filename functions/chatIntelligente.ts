import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, companyId } = await req.json();

    if (!question || !companyId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determinar permisos del usuario
    const isAdmin = user.role === 'admin';
    const isAdvanced = user.role === 'advanced' || isAdmin;
    const isNormal = !isAdmin && !isAdvanced;

    // Cargar datos según permisos
    const contextData = await buildContextData(base44, companyId, user, isAdmin, isAdvanced);

    // Sistema prompt adaptado al rol
    const systemPrompt = `Eres un asistente financiero experto que analiza datos de empresa.

REGLAS IMPORTANTES:
- Responde SIEMPRE en español
- Sé conciso y orientado a negocio
- Usa formato español para cifras: 1.234,56 € (con punto de miles y coma decimal)
- NO inventes datos: usa SOLO los datos del contexto proporcionado
- Si no tienes información suficiente, avísalo claramente
- ${isNormal ? 'Da respuestas simplificadas SIN datos sensibles como nombres completos o importes exactos de clientes individuales.' : ''}
- ${isAdmin ? 'Puedes dar análisis detallados con todos los datos disponibles.' : ''}

CONTEXTO DE DATOS DISPONIBLES:
${JSON.stringify(contextData, null, 2)}

Formatea tu respuesta usando markdown para mejor legibilidad.`;

    // Llamar a Claude API
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: 'user', content: question }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return Response.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const answer = data.content[0].text;

    return Response.json({ answer });

  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function buildContextData(base44, companyId, user, isAdmin, isAdvanced) {
  const context = {};

  try {
    // KPIs básicos (todos los roles)
    const company = await base44.asServiceRole.entities.Company.get(companyId);
    context.empresa = {
      nombre: company.name,
      modo_demo: company.is_demo || false,
    };

    // Datos de ventas (anonimizados para usuario normal)
    const invoicesSale = await getCachedData(base44, companyId, 'invoices_sale');
    if (invoicesSale.length > 0) {
      const totalVentas = invoicesSale.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const ventasMes = invoicesSale.filter(inv => {
        const date = new Date(inv.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).reduce((sum, inv) => sum + (inv.total || 0), 0);

      context.ventas = {
        total_periodo: totalVentas,
        mes_actual: ventasMes,
        num_facturas: invoicesSale.length,
      };

      if (isAdmin || isAdvanced) {
        // Top clientes con importes (solo admin/avanzado)
        const clientesMap = {};
        invoicesSale.forEach(inv => {
          const cid = inv.contactId || 'unknown';
          if (!clientesMap[cid]) clientesMap[cid] = { id: cid, total: 0, count: 0 };
          clientesMap[cid].total += inv.total || 0;
          clientesMap[cid].count += 1;
        });
        const topClientes = Object.values(clientesMap)
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map(c => ({ id: `Cliente ${c.id.substring(0, 6)}`, ventas: c.total, facturas: c.count }));
        context.ventas.top_clientes = topClientes;
      } else {
        // Usuario normal: solo número de clientes activos
        context.ventas.clientes_activos = new Set(invoicesSale.map(i => i.contactId)).size;
      }
    }

    // Datos de compras
    const invoicesPurchase = await getCachedData(base44, companyId, 'invoices_purchase');
    if (invoicesPurchase.length > 0) {
      const totalCompras = invoicesPurchase.reduce((sum, inv) => sum + (inv.total || 0), 0);
      context.compras = {
        total_periodo: totalCompras,
        num_facturas: invoicesPurchase.length,
      };

      if (isAdmin || isAdvanced) {
        const proveedoresMap = {};
        invoicesPurchase.forEach(inv => {
          const pid = inv.contactId || 'unknown';
          if (!proveedoresMap[pid]) proveedoresMap[pid] = { total: 0 };
          proveedoresMap[pid].total += inv.total || 0;
        });
        const topProveedores = Object.entries(proveedoresMap)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 3)
          .map(([id, data]) => ({ id: `Proveedor ${id.substring(0, 6)}`, compras: data.total }));
        context.compras.top_proveedores = topProveedores;
      }
    }

    // Tesorería
    const treasuries = await getCachedData(base44, companyId, 'treasuries');
    if (treasuries.length > 0) {
      const saldoTotal = treasuries.reduce((sum, t) => sum + (t.balance || 0), 0);
      context.tesoreria = {
        saldo_total: saldoTotal,
        num_cuentas: treasuries.length,
      };
    }

    // Facturas pendientes (DSO)
    if (invoicesSale.length > 0) {
      const pendientes = invoicesSale.filter(inv => inv.status === 'pending' || inv.status === 'unpaid');
      const pendientes90 = pendientes.filter(inv => {
        const date = new Date(inv.date);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        return diff > 90;
      });
      
      context.cobros = {
        facturas_pendientes: pendientes.length,
        importe_pendiente: pendientes.reduce((sum, inv) => sum + (inv.total || 0), 0),
        facturas_90d: pendientes90.length,
        importe_90d: pendientes90.reduce((sum, inv) => sum + (inv.total || 0), 0),
      };
    }

    // Alertas activas (solo admin/avanzado)
    if (isAdmin || isAdvanced) {
      const alerts = await base44.asServiceRole.entities.Alert.filter({
        company_id: companyId,
        status: 'triggered',
      });
      if (alerts.length > 0) {
        context.alertas_activas = alerts.map(a => ({
          kpi: a.kpi_label,
          severidad: a.severity,
        }));
      }
    }

  } catch (error) {
    console.error('Error building context:', error);
  }

  return context;
}

async function getCachedData(base44, companyId, dataType) {
  try {
    const cached = await base44.asServiceRole.entities.CachedData.filter({
      company_id: companyId,
      data_type: dataType,
    });
    return cached.length > 0 && cached[0].data?.items ? cached[0].data.items : [];
  } catch (error) {
    console.error(`Error loading ${dataType}:`, error);
    return [];
  }
}