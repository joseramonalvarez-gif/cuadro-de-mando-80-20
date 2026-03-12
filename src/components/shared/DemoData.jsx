// Demo data generator for when no API key is configured
export function generateDemoData() {
  const months = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
  const fullMonths = ['Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo'];
  
  return {
    kpis: {
      ventas_netas: { value: 487320.50, prev: 423100, trend: 15.2, status: 'green' },
      margen_bruto: { value: 42.3, prev: 39.8, trend: 6.3, status: 'green' },
      ebitda: { value: 18.7, prev: 15.2, trend: 23.0, status: 'green' },
      punto_equilibrio: { value: 312000, prev: 305000, trend: 2.3, status: 'yellow' },
      opex_ventas: { value: 23.6, prev: 24.8, trend: -4.8, status: 'green' },
      caja_actual: { value: 156780.40, prev: 142300, trend: 10.2, status: 'green' },
      cash_in: { value: 234500, prev: 198000, trend: 18.4, status: 'green' },
      cash_out: { value: 189200, prev: 176500, trend: 7.2, status: 'yellow' },
      prevision_30d: { value: 168300, prev: 155000, trend: 8.6, status: 'green' },
      dso: { value: 47, prev: 52, trend: -9.6, status: 'yellow' },
      morosidad_90: { value: 23450, prev: 18900, trend: 24.1, status: 'red' },
      dpo: { value: 38, prev: 35, trend: 8.6, status: 'green' },
      margen_top10: { value: 45.2, prev: 43.1, trend: 4.9, status: 'green' },
      concentracion_top1: { value: 18.5, prev: 22.1, trend: -16.3, status: 'green' },
      concentracion_top5: { value: 52.3, prev: 55.8, trend: -6.3, status: 'yellow' },
      concentracion_top10: { value: 73.1, prev: 76.2, trend: -4.1, status: 'green' },
      compras_top1: { value: 15.2, prev: 17.8, trend: -14.6, status: 'green' },
      compras_top5: { value: 48.7, prev: 51.2, trend: -4.9, status: 'green' },
      saldo_iva: { value: -12340, prev: -8900, trend: 38.7, status: 'yellow' },
    },
    ventasVsCompras: months.map((m, i) => ({
      month: m,
      ventas: [72000, 81000, 95000, 78000, 84000, 92000][i],
      compras: [45000, 52000, 61000, 48000, 53000, 58000][i],
    })),
    concentracionClientes: [
      { name: 'Top 1', value: 18.5, fill: '#33A19A' },
      { name: 'Top 2-5', value: 33.8, fill: '#5BB8B2' },
      { name: 'Top 6-10', value: 20.8, fill: '#B7CAC9' },
      { name: 'Resto', value: 26.9, fill: '#E8EEEE' },
    ],
    previsionTesoreria: [
      { dia: '1', entradas: 12000, salidas: 8000, saldo: 156780 },
      { dia: '5', entradas: 8500, salidas: 15000, saldo: 150280 },
      { dia: '10', entradas: 22000, salidas: 12000, saldo: 160280 },
      { dia: '15', entradas: 15000, salidas: 18000, saldo: 157280 },
      { dia: '20', entradas: 28000, salidas: 9000, saldo: 176280 },
      { dia: '25', entradas: 11000, salidas: 14000, saldo: 173280 },
      { dia: '30', entradas: 19000, salidas: 24000, saldo: 168280 },
    ],
    topClientes: [
      { name: 'Grupo Empresarial ABC', value: 89500 },
      { name: 'Tecnología Ibérica SL', value: 67200 },
      { name: 'Inversiones Mediterráneo', value: 54800 },
      { name: 'Consulting Partners SA', value: 43100 },
      { name: 'Digital Solutions Spain', value: 38700 },
    ],
    topProveedores: [
      { name: 'Suministros Globales SL', value: 52300 },
      { name: 'Tech Components EU', value: 41800 },
      { name: 'Servicios Profesionales SA', value: 35200 },
      { name: 'Logística Express', value: 28900 },
      { name: 'Material Office Pro', value: 21500 },
    ],
  };
}

export function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + ' %';
}

export function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-ES').format(value);
}