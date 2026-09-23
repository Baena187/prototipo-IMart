/** Paleta dos gráficos (validada para daltonismo): série primária e secundária. */
export const CHART = {
  primary: '#2563eb',
  secondary: '#0d9488',
  grid: '#eef2f6',
  axis: '#94a3b8',
};

export const axisProps = {
  tick: { fill: CHART.axis, fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const;
