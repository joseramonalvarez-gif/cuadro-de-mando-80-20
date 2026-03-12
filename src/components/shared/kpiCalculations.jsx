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

/**
 * Calcula saldo de IVA (repercutido - soportado)
 */
export function calcularSaldoIVA(lineasVenta, lineasCompra, impuestos) {
  let ivaRepercutido = 0;
  let ivaSoportado = 0;
  
  // IVA de ventas (repercutido)
  lineasVenta.forEach(linea => {
    const impuesto = impuestos.find(tax => tax.id === linea.impuestoId);
    if (impuesto && impuesto.value) {
      const subtotalEUR = convertirAEUR(linea.importeNeto || 0, linea.moneda, linea.tipoCambio);
      const cuotaIVA = subtotalEUR * (impuesto.value / 100);
      ivaRepercutido += cuotaIVA;
    }
  });
  
  // IVA de compras (soportado)
  lineasCompra.forEach(linea => {
    const impuesto = impuestos.find(tax => tax.id === linea.impuestoId);
    if (impuesto && impuesto.value) {
      const subtotalEUR = convertirAEUR(linea.importeNeto || 0, linea.moneda, linea.tipoCambio);
      const cuotaIVA = subtotalEUR * (impuesto.value / 100);
      ivaSoportado += cuotaIVA;
    }
  });
  
  return {
    ivaRepercutido,
    ivaSoportado,
    saldoIVA: ivaRepercutido - ivaSoportado
  };
}

/**
 * Calcula previsión de tesorería real basada en facturas pendientes
 */
export function calcularPrevisionTesoreria(facturas, saldoActual, diasPrevision = 30) {
  const hoy = new Date();
  const proyeccion = [];
  
  // Agrupar por semana
  for (let dia = 0; dia <= diasPrevision; dia += 7) {
    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(fechaInicio.getDate() + dia);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 7);
    
    const facturasRango = facturas.filter(f => {
      const status = f.estadoPago || f.status;
      if (status === 'paid') return false;
      
      const vto = f.fechaVencimiento 
        ? new Date(f.fechaVencimiento * 1000) 
        : (f.dueDate ? new Date(f.dueDate * 1000) : null);
      
      return vto && vto >= fechaInicio && vto < fechaFin;
    });
    
    const entradas = facturasRango
      .filter(f => f.tipo === 'invoice')
      .reduce((sum, f) => sum + convertirAEUR(f.importeNeto || f.total || 0, f.moneda || f.currency, f.tipoCambio || f.currencyChange), 0);
    
    const salidas = facturasRango
      .filter(f => f.tipo === 'purchase')
      .reduce((sum, f) => sum + convertirAEUR(f.importeNeto || f.total || 0, f.moneda || f.currency, f.tipoCambio || f.currencyChange), 0);
    
    saldoActual = saldoActual + entradas - salidas;
    
    proyeccion.push({
      fecha: `${fechaInicio.getDate()}/${fechaInicio.getMonth() + 1}`,
      entradas,
      salidas,
      saldo: saldoActual
    });
  }
  
  return proyeccion;
}

/**
 * Calcula score de calidad de dato
 */
export function calcularCalidadDato(facturas, lineasVenta, productos) {
  const totalFacturas = facturas.length;
  const facturasConContacto = facturas.filter(f => f.contactId || f.clienteId).length;
  
  const totalLineas = lineasVenta.length;
  const lineasConProducto = lineasVenta.filter(l => l.itemId || l.productoId).length;
  
  const totalProductos = productos.length;
  const productosConCoste = productos.filter(p => p.coste > 0 || p.cost > 0).length;
  
  const scoreContacto = totalFacturas > 0 ? (facturasConContacto / totalFacturas) * 100 : 100;
  const scoreProducto = totalLineas > 0 ? (lineasConProducto / totalLineas) * 100 : 100;
  const scoreCoste = totalProductos > 0 ? (productosConCoste / totalProductos) * 100 : 0;
  
  const scoreGlobal = (scoreContacto + scoreProducto + scoreCoste) / 3;
  
  return {
    scoreGlobal,
    scoreContacto,
    scoreProducto,
    scoreCoste,
    semaforo: scoreGlobal >= 85 ? 'verde' : scoreGlobal >= 70 ? 'amarillo' : 'rojo',
    detalles: {
      facturasConContacto,
      totalFacturas,
      lineasConProducto,
      totalLineas,
      productosConCoste,
      totalProductos
    }
  };
}

/**
 * Calcula RFM con quintiles estadísticos
 */
export function calcularRFMQuintiles(facturas, contactos) {
  const hoy = new Date();
  const clienteData = {};
  
  // 1. Calcular R, F, M por cliente
  facturas.forEach(inv => {
    const cid = inv.contactId || inv.clienteId;
    if (!cid) return;
    
    const fecha = new Date(inv.fecha * 1000 || inv.date * 1000);
    const importe = convertirAEUR(inv.importeNeto || inv.total || 0, inv.moneda, inv.tipoCambio);
    
    if (!clienteData[cid]) {
      clienteData[cid] = { ultimaFecha: fecha, frecuencia: 0, totalGastado: 0 };
    }
    
    if (fecha > clienteData[cid].ultimaFecha) {
      clienteData[cid].ultimaFecha = fecha;
    }
    clienteData[cid].frecuencia++;
    clienteData[cid].totalGastado += importe;
  });
  
  // 2. Calcular días desde última compra
  const clientesArray = Object.entries(clienteData).map(([id, data]) => {
    const diasDesdeUltima = Math.floor((hoy - data.ultimaFecha) / (1000 * 60 * 60 * 24));
    return {
      clienteId: id,
      recency: diasDesdeUltima,
      frequency: data.frecuencia,
      monetary: data.totalGastado
    };
  });
  
  // 3. Calcular quintiles (percentiles 20, 40, 60, 80)
  const calcularQuintiles = (valores) => {
    const sorted = [...valores].sort((a, b) => a - b);
    return {
      q1: sorted[Math.floor(sorted.length * 0.2)],
      q2: sorted[Math.floor(sorted.length * 0.4)],
      q3: sorted[Math.floor(sorted.length * 0.6)],
      q4: sorted[Math.floor(sorted.length * 0.8)]
    };
  };
  
  const quintilesR = calcularQuintiles(clientesArray.map(c => c.recency));
  const quintilesF = calcularQuintiles(clientesArray.map(c => c.frequency));
  const quintilesM = calcularQuintiles(clientesArray.map(c => c.monetary));
  
  // 4. Asignar scores
  return clientesArray.map(cliente => {
    // Recency: menor es mejor (invertir)
    let scoreR = 5;
    if (cliente.recency > quintilesR.q4) scoreR = 1;
    else if (cliente.recency > quintilesR.q3) scoreR = 2;
    else if (cliente.recency > quintilesR.q2) scoreR = 3;
    else if (cliente.recency > quintilesR.q1) scoreR = 4;
    
    // Frequency: mayor es mejor
    let scoreF = 1;
    if (cliente.frequency > quintilesF.q4) scoreF = 5;
    else if (cliente.frequency > quintilesF.q3) scoreF = 4;
    else if (cliente.frequency > quintilesF.q2) scoreF = 3;
    else if (cliente.frequency > quintilesF.q1) scoreF = 2;
    
    // Monetary: mayor es mejor
    let scoreM = 1;
    if (cliente.monetary > quintilesM.q4) scoreM = 5;
    else if (cliente.monetary > quintilesM.q3) scoreM = 4;
    else if (cliente.monetary > quintilesM.q2) scoreM = 3;
    else if (cliente.monetary > quintilesM.q1) scoreM = 2;
    
    // Segmentación
    let segmento = 'en_riesgo';
    if (scoreR >= 4 && scoreF >= 4) segmento = 'champion';
    else if (scoreR >= 3 && scoreF >= 3) segmento = 'loyal';
    else if (scoreR <= 2 && scoreF >= 3) segmento = 'at_risk';
    else if (scoreR <= 2) segmento = 'lost';
    else if (scoreF === 1) segmento = 'new';
    else segmento = 'promising';
    
    const contacto = contactos.find(c => c.contactId === cliente.clienteId || c.id === cliente.clienteId);
    
    return {
      ...cliente,
      nombre: contacto?.nombre || contacto?.name || 'Desconocido',
      scoreR,
      scoreF,
      scoreM,
      rfm_segment: segmento,
      ultima_compra: cliente.recency,
      frecuencia: cliente.frequency,
      valor_total: cliente.monetary,
      ltv: cliente.monetary * (365 / Math.max(cliente.recency, 30)) * 2
    };
  });
}