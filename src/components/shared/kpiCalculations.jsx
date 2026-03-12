// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILIDADES CENTRALIZADAS PARA CÁLCULO DE KPIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Convierte cualquier importe a EUR usando el tipo de cambio
 */
export function convertirAEUR(importe, moneda, tipoCambio) {
  if (!moneda || moneda === 'EUR') return importe;
  if (!tipoCambio || tipoCambio === 0) return importe;
  return importe / tipoCambio;
}

/**
 * Filtra datos por rango de fechas (acepta timestamps UNIX)
 */
export function filtrarPorFechas(datos, dateRange, campoFecha = 'fecha') {
  if (!dateRange || !dateRange.start || !dateRange.end) return datos;
  
  return datos.filter(item => {
    const fecha = new Date(item[campoFecha] * 1000);
    return fecha >= dateRange.start && fecha <= dateRange.end;
  });
}

/**
 * Calcula margen bruto correcto (línea por línea)
 */
export function calcularMargenBruto(lineasVenta, productos) {
  let margenTotal = 0;
  let ventasConCoste = 0;
  let lineasSinCoste = 0;
  
  lineasVenta.forEach(linea => {
    const producto = productos.find(p => p.productoId === linea.itemId);
    const importeLineaEUR = convertirAEUR(
      linea.importeNeto || 0,
      linea.moneda,
      linea.tipoCambio
    );
    
    if (producto && producto.coste > 0) {
      const costeLinea = producto.coste * (linea.unidades || 0);
      const margenLinea = importeLineaEUR - costeLinea;
      margenTotal += margenLinea;
      ventasConCoste += importeLineaEUR;
    } else {
      lineasSinCoste++;
    }
  });
  
  const ventasTotal = lineasVenta.reduce((sum, l) => 
    sum + convertirAEUR(l.importeNeto || 0, l.moneda, l.tipoCambio), 0
  );
  
  const margenPct = ventasConCoste > 0 ? (margenTotal / ventasConCoste) * 100 : 0;
  const cobertura = ventasTotal > 0 ? (ventasConCoste / ventasTotal) * 100 : 0;
  
  return {
    margenBruto: margenTotal,
    margenPct,
    ventasConCoste,
    ventasTotal,
    cobertura,
    lineasSinCoste
  };
}

/**
 * Calcula DSO (Days Sales Outstanding)
 */
export function calcularDSO(facturas, ventasNetas, diasPeriodo = 365) {
  const pendiente = facturas
    .filter(f => f.estadoPago !== 'paid' && !f.esDevolucion)
    .reduce((sum, f) => {
      return sum + convertirAEUR(f.importeNeto || 0, f.moneda, f.tipoCambio);
    }, 0);
  
  return ventasNetas > 0 ? Math.round((pendiente / ventasNetas) * diasPeriodo) : 0;
}

/**
 * Calcula aging de facturas por buckets
 */
export function calcularAging(facturas) {
  const hoy = new Date();
  const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '+90': 0 };
  
  facturas
    .filter(f => f.estadoPago !== 'paid' && !f.esDevolucion)
    .forEach(f => {
      const vencimiento = new Date(f.fechaVencimiento * 1000);
      const diasVencida = Math.floor((hoy - vencimiento) / (1000 * 60 * 60 * 24));
      
      if (diasVencida < 0) return;
      
      const importeEUR = convertirAEUR(f.importeNeto || 0, f.moneda, f.tipoCambio);
      
      if (diasVencida <= 30) buckets['0-30'] += importeEUR;
      else if (diasVencida <= 60) buckets['31-60'] += importeEUR;
      else if (diasVencida <= 90) buckets['61-90'] += importeEUR;
      else buckets['+90'] += importeEUR;
    });
  
  return buckets;
}

/**
 * Calcula clasificación ABC de clientes
 */
export function calcularABC(ventasPorCliente) {
  const sorted = Object.entries(ventasPorCliente)
    .map(([id, ventas]) => ({ clienteId: id, ventas }))
    .sort((a, b) => b.ventas - a.ventas);
  
  const total = sorted.reduce((s, c) => s + c.ventas, 0);
  let acumulado = 0;
  
  return sorted.map(cliente => {
    acumulado += cliente.ventas;
    const pctAcumulado = (acumulado / total) * 100;
    
    let clase = 'C';
    if (pctAcumulado <= 80) clase = 'A';
    else if (pctAcumulado <= 95) clase = 'B';
    
    return { 
      ...cliente, 
      clase, 
      pctAcumulado,
      pctSobreTotal: (cliente.ventas / total) * 100
    };
  });
}

/**
 * Agrupa ventas por cliente
 */
export function agruparVentasPorCliente(lineasVenta, contactos) {
  const ventasPorCliente = {};
  
  lineasVenta.forEach(linea => {
    if (!linea.clienteId) return;
    
    const importeEUR = convertirAEUR(
      linea.importeNeto || 0,
      linea.moneda,
      linea.tipoCambio
    );
    
    if (!ventasPorCliente[linea.clienteId]) {
      ventasPorCliente[linea.clienteId] = 0;
    }
    ventasPorCliente[linea.clienteId] += importeEUR;
  });
  
  return ventasPorCliente;
}

/**
 * Calcula ventas netas (restando devoluciones)
 */
export function calcularVentasNetas(lineasVenta, creditNotes = []) {
  const ventasBrutas = lineasVenta
    .filter(l => !l.esDevolucion)
    .reduce((sum, l) => {
      return sum + convertirAEUR(l.importeNeto || 0, l.moneda, l.tipoCambio);
    }, 0);
  
  const devoluciones = creditNotes.reduce((sum, cn) => {
    return sum + convertirAEUR(cn.total || 0, cn.moneda, cn.tipoCambio);
  }, 0);
  
  return ventasBrutas - devoluciones;
}