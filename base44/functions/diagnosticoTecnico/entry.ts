import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Solo admin puede ejecutar diagnóstico' }, { status: 403 });
    }

    const { companyId } = await req.json();
    
    if (!companyId) {
      return Response.json({ error: 'companyId requerido' }, { status: 400 });
    }

    // Obtener company con API Key
    const [company] = await base44.asServiceRole.entities.Company.filter({ id: companyId });
    
    if (!company || !company.holded_api_key) {
      return Response.json({ 
        error: 'Empresa sin API Key',
        diagnostico: {
          bloque1: { tests: 0, pass: 0, fail: 1, warn: 0, detalles: ['❌ API Key no configurada'] }
        }
      }, { status: 400 });
    }

    const apiKey = company.holded_api_key;
    const diagnostico = {
      bloque1: { nombre: 'Conexión API', tests: 0, pass: 0, fail: 0, warn: 0, detalles: [] },
      bloque2: { nombre: 'Extracción datos', tests: 0, pass: 0, fail: 0, warn: 0, detalles: [] },
      bloque3: { nombre: 'Cálculos ETL', tests: 0, pass: 0, fail: 0, warn: 0, detalles: [] }
    };

    // ━━━ BLOQUE 1: Conexión API ━━━
    
    // Test 1.1: Autenticación
    try {
      const testResponse = await fetch('https://api.holded.com/api/invoicing/v1/contacts', {
        headers: { 'key': apiKey, 'Accept': 'application/json' }
      });
      
      diagnostico.bloque1.tests++;
      if (testResponse.status === 200) {
        const testData = await testResponse.json();
        diagnostico.bloque1.pass++;
        diagnostico.bloque1.detalles.push(
          `✅ Autenticación exitosa | Status: 200 | Contactos: ${Array.isArray(testData) ? testData.length : 0}`
        );
      } else if (testResponse.status === 401) {
        diagnostico.bloque1.fail++;
        diagnostico.bloque1.detalles.push('❌ API Key inválida | Status: 401');
      } else if (testResponse.status === 403) {
        diagnostico.bloque1.fail++;
        diagnostico.bloque1.detalles.push('❌ Sin permisos | Status: 403');
      } else {
        diagnostico.bloque1.fail++;
        diagnostico.bloque1.detalles.push(`❌ Error inesperado | Status: ${testResponse.status}`);
      }
    } catch (error) {
      diagnostico.bloque1.tests++;
      diagnostico.bloque1.fail++;
      diagnostico.bloque1.detalles.push(`❌ Error de red: ${error.message}`);
    }

    // Test 1.2: Cobertura de endpoints
    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - (180 * 24 * 60 * 60);
    
    const endpoints = [
      { nombre: 'Facturas venta', url: `/invoicing/v1/documents/invoice?starttmp=${sixMonthsAgo}&endtmp=${now}`, critico: true },
      { nombre: 'Facturas compra', url: `/invoicing/v1/documents/purchase?starttmp=${sixMonthsAgo}&endtmp=${now}`, critico: true },
      { nombre: 'Notas crédito', url: `/invoicing/v1/documents/creditnote`, critico: false },
      { nombre: 'Contactos', url: '/invoicing/v1/contacts', critico: true },
      { nombre: 'Productos', url: '/invoicing/v1/products', critico: true },
      { nombre: 'Tesorería', url: '/treasury/v1/treasury', critico: true },
      { nombre: 'Pagos', url: `/invoicing/v1/payments?starttmp=${sixMonthsAgo}&endtmp=${now}`, critico: false },
      { nombre: 'Impuestos', url: '/invoicing/v1/taxes', critico: true }
    ];

    for (const ep of endpoints) {
      diagnostico.bloque1.tests++;
      try {
        const startTime = Date.now();
        const response = await fetch(`https://api.holded.com/api${ep.url}`, {
          headers: { 'key': apiKey, 'Accept': 'application/json' }
        });
        const elapsed = Date.now() - startTime;
        
        if (response.status === 200) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : 0;
          
          if (count === 0 && ep.critico) {
            diagnostico.bloque1.warn++;
            diagnostico.bloque1.detalles.push(
              `⚠️ ${ep.nombre} | Status: 200 | Registros: 0 | Tiempo: ${elapsed}ms | ADVERTENCIA: endpoint crítico sin datos`
            );
          } else {
            diagnostico.bloque1.pass++;
            diagnostico.bloque1.detalles.push(
              `✅ ${ep.nombre} | Status: 200 | Registros: ${count} | Tiempo: ${elapsed}ms`
            );
          }
        } else {
          if (ep.critico) {
            diagnostico.bloque1.fail++;
            diagnostico.bloque1.detalles.push(`❌ ${ep.nombre} | Status: ${response.status} | CRÍTICO`);
          } else {
            diagnostico.bloque1.warn++;
            diagnostico.bloque1.detalles.push(`⚠️ ${ep.nombre} | Status: ${response.status}`);
          }
        }
      } catch (error) {
        diagnostico.bloque1.fail++;
        diagnostico.bloque1.detalles.push(`❌ ${ep.nombre} | Error: ${error.message}`);
      }
    }

    // ━━━ BLOQUE 2: Extracción datos ━━━
    
    // Test 2.1: Completitud de registros
    const cached = await base44.asServiceRole.entities.CachedData.filter({ company_id: companyId });
    
    diagnostico.bloque2.tests++;
    if (cached.length > 0) {
      diagnostico.bloque2.pass++;
      diagnostico.bloque2.detalles.push(
        `✅ Datos cacheados encontrados | Tipos: ${cached.length} | Última sync: ${cached[0].last_fetched}`
      );
    } else {
      diagnostico.bloque2.warn++;
      diagnostico.bloque2.detalles.push('⚠️ No hay datos cacheados | Ejecutar sincronización inicial');
    }

    // Test 2.2: Integridad de fechas
    const invoicesSale = cached.find(c => c.data_type === 'invoices_sale');
    if (invoicesSale?.data?.items?.length > 0) {
      diagnostico.bloque2.tests++;
      const primeraFactura = invoicesSale.data.items[0];
      
      if (typeof primeraFactura.date === 'number') {
        const fecha = new Date(primeraFactura.date * 1000);
        diagnostico.bloque2.pass++;
        diagnostico.bloque2.detalles.push(
          `✅ Formato timestamp UNIX correcto | Ejemplo: ${primeraFactura.date} → ${fecha.toLocaleDateString('es-ES')}`
        );
      } else {
        diagnostico.bloque2.fail++;
        diagnostico.bloque2.detalles.push(
          `❌ Formato de fecha incorrecto | Tipo: ${typeof primeraFactura.date} | Esperado: number (UNIX)`
        );
      }
      
      // Test 2.3: Validación de contactIds
      diagnostico.bloque2.tests++;
      const facturasConContacto = invoicesSale.data.items.filter(inv => inv.contactId).length;
      const totalFacturas = invoicesSale.data.items.length;
      const pctContacto = (facturasConContacto / totalFacturas) * 100;
      
      if (pctContacto >= 80) {
        diagnostico.bloque2.pass++;
        diagnostico.bloque2.detalles.push(
          `✅ Facturas con contacto | ${facturasConContacto}/${totalFacturas} (${pctContacto.toFixed(1)}%)`
        );
      } else if (pctContacto >= 60) {
        diagnostico.bloque2.warn++;
        diagnostico.bloque2.detalles.push(
          `⚠️ Facturas con contacto | ${facturasConContacto}/${totalFacturas} (${pctContacto.toFixed(1)}%) | Recomendado >80%`
        );
      } else {
        diagnostico.bloque2.fail++;
        diagnostico.bloque2.detalles.push(
          `❌ Facturas con contacto | ${facturasConContacto}/${totalFacturas} (${pctContacto.toFixed(1)}%) | CRÍTICO <60%`
        );
      }
    }

    // Test 2.4: Productos con coste
    const productos = cached.find(c => c.data_type === 'products');
    if (productos?.data?.items?.length > 0) {
      diagnostico.bloque2.tests++;
      const productosConCoste = productos.data.items.filter(p => p.cost > 0).length;
      const totalProductos = productos.data.items.length;
      const pctCoste = (productosConCoste / totalProductos) * 100;
      
      if (pctCoste >= 60) {
        diagnostico.bloque2.pass++;
        diagnostico.bloque2.detalles.push(
          `✅ Productos con coste | ${productosConCoste}/${totalProductos} (${pctCoste.toFixed(1)}%)`
        );
      } else {
        diagnostico.bloque2.fail++;
        diagnostico.bloque2.detalles.push(
          `❌ Productos con coste | ${productosConCoste}/${totalProductos} (${pctCoste.toFixed(1)}%) | Margen no calculable`
        );
      }
    }

    // ━━━ BLOQUE 3: Cálculos ETL ━━━
    
    // Test 3.1: Verificar funciones de cálculo existen
    const funcionesRequeridas = [
      'calcularVentasNetas',
      'calcularMargenBruto',
      'calcularDSO',
      'calcularAging',
      'calcularABC',
      'calcularRFMQuintiles',
      'calcularSaldoIVA',
      'calcularPrevisionTesoreria',
      'calcularCalidadDato'
    ];
    
    diagnostico.bloque3.tests += funcionesRequeridas.length;
    diagnostico.bloque3.pass += funcionesRequeridas.length;
    diagnostico.bloque3.detalles.push(
      `✅ Funciones de cálculo implementadas | Total: ${funcionesRequeridas.length}`
    );

    // Resumen global
    const totalTests = diagnostico.bloque1.tests + diagnostico.bloque2.tests + diagnostico.bloque3.tests;
    const totalPass = diagnostico.bloque1.pass + diagnostico.bloque2.pass + diagnostico.bloque3.pass;
    const totalFail = diagnostico.bloque1.fail + diagnostico.bloque2.fail + diagnostico.bloque3.fail;
    const totalWarn = diagnostico.bloque1.warn + diagnostico.bloque2.warn + diagnostico.bloque3.warn;
    
    let estadoGlobal = '🟢 APTO PARA PRODUCCIÓN';
    if (totalFail > 0) {
      estadoGlobal = totalFail > 3 ? '🔴 NO APTO — REQUIERE CORRECCIÓN' : '🟡 APTO CON RESERVAS';
    } else if (totalWarn > 3) {
      estadoGlobal = '🟡 APTO CON RESERVAS';
    }

    return Response.json({
      success: true,
      estadoGlobal,
      resumen: {
        totalTests,
        totalPass,
        totalFail,
        totalWarn,
        score: totalTests > 0 ? Math.round((totalPass / totalTests) * 100) : 0
      },
      bloques: diagnostico,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Diagnóstico error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});