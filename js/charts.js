/* =====================================================
   Plotly.js 차트 모듈
   - 인구 성장 추이 (line)
   - 연령 피라미드 (bar)
   - 업종별 매출 (bar)
   - 점포 개폐업 추이 (bar)
   - 유동인구 히트맵 (heatmap)
   ===================================================== */

const CHART_LAYOUT_BASE = {
  font: { family: "'Noto Sans KR', sans-serif", size: 12 },
  margin: { t: 30, r: 20, b: 50, l: 60 },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  colorway: ['#2e86c1', '#e74c3c', '#27ae60', '#f39c12', '#8e44ad']
};

const CONFIG = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['select2d', 'lasso2d'] };

/* ── 인구 성장 추이 ── */
async function renderPopGrowth() {
  const res = await fetch('data/population.json');
  const data = await res.json();
  const years = data.yearly_growth.map(d => d.year);
  const pops  = data.yearly_growth.map(d => Math.round(d.population / 10000 * 10) / 10);

  Plotly.newPlot('chart-pop-growth', [{
    x: years, y: pops,
    type: 'scatter', mode: 'lines+markers',
    line: { color: '#2e86c1', width: 3 },
    marker: { size: 7, color: '#2e86c1' },
    fill: 'tozeroy', fillcolor: 'rgba(46,134,193,0.1)',
    hovertemplate: '%{x}년: %{y}만명<extra></extra>'
  }], {
    ...CHART_LAYOUT_BASE,
    title: { text: '동탄 인구 성장 추이 (만명)', font: { size: 14 } },
    xaxis: { title: '', showgrid: false },
    yaxis: { title: '인구 (만명)', gridcolor: '#eaeaea' }
  }, CONFIG);
}

/* ── 연령대별 인구 피라미드 ── */
async function renderAgePyramid() {
  const res = await fetch('data/population.json');
  const { age_groups } = await res.json();

  const groups = age_groups.map(d => d.group);
  const males  = age_groups.map(d => -Math.round(d.male / 1000));   // 음수 = 왼쪽
  const females = age_groups.map(d => Math.round(d.female / 1000));

  Plotly.newPlot('chart-age-pyramid', [
    {
      name: '남성', x: males, y: groups, type: 'bar', orientation: 'h',
      marker: { color: '#2e86c1' },
      hovertemplate: '%{y}: %{customdata}천명<extra>남성</extra>',
      customdata: males.map(v => Math.abs(v))
    },
    {
      name: '여성', x: females, y: groups, type: 'bar', orientation: 'h',
      marker: { color: '#e74c3c' },
      hovertemplate: '%{y}: %{x}천명<extra>여성</extra>'
    }
  ], {
    ...CHART_LAYOUT_BASE,
    title: { text: '연령대별 인구 구조 (천명)', font: { size: 14 } },
    barmode: 'overlay',
    bargap: 0.15,
    xaxis: {
      tickformat: 'd',
      tickvals: [-35, -25, -15, -5, 5, 15, 25, 35],
      ticktext: ['35', '25', '15', '5', '5', '15', '25', '35'],
      gridcolor: '#eaeaea', title: '← 남성  /  여성 →'
    },
    yaxis: { automargin: true },
    legend: { orientation: 'h', y: -0.15 },
    margin: { t: 40, r: 20, b: 60, l: 80 }
  }, CONFIG);
}

/* ── 업종별 추정 월 매출 ── */
async function renderIndustrySales() {
  const res = await fetch('data/sales_trend.json');
  const { industry_sales } = await res.json();

  const sorted = [...industry_sales].sort((a, b) => b.monthly_avg_mil - a.monthly_avg_mil);

  Plotly.newPlot('chart-industry-sales', [{
    x: sorted.map(d => d.monthly_avg_mil),
    y: sorted.map(d => d.industry),
    type: 'bar', orientation: 'h',
    marker: { color: sorted.map((_, i) => `hsl(${210 - i * 15}, 70%, ${55 + i * 2}%)`) },
    hovertemplate: '%{y}: %{x}백만원/월<extra></extra>'
  }], {
    ...CHART_LAYOUT_BASE,
    title: { text: '업종별 추정 월평균 매출 (백만원)', font: { size: 14 } },
    xaxis: { title: '월평균 매출 (백만원)', gridcolor: '#eaeaea' },
    yaxis: { automargin: true },
    margin: { t: 40, r: 20, b: 60, l: 100 }
  }, CONFIG);
}

/* ── 점포 개폐업 추이 ── */
async function renderStoreTrend() {
  const res = await fetch('data/sales_trend.json');
  const { store_trend } = await res.json();

  const years = store_trend.map(d => d.year);

  Plotly.newPlot('chart-store-trend', [
    {
      name: '개업', x: years, y: store_trend.map(d => d.opened),
      type: 'bar', marker: { color: '#27ae60' },
      hovertemplate: '%{x}년 개업: %{y}개<extra></extra>'
    },
    {
      name: '폐업', x: years, y: store_trend.map(d => d.closed),
      type: 'bar', marker: { color: '#e74c3c' },
      hovertemplate: '%{x}년 폐업: %{y}개<extra></extra>'
    },
    {
      name: '순증감', x: years, y: store_trend.map(d => d.net),
      type: 'scatter', mode: 'lines+markers',
      line: { color: '#f39c12', width: 2.5 },
      marker: { size: 8, color: '#f39c12' },
      yaxis: 'y2',
      hovertemplate: '%{x}년 순증감: %{y}개<extra></extra>'
    }
  ], {
    ...CHART_LAYOUT_BASE,
    title: { text: '점포 개폐업 현황', font: { size: 14 } },
    barmode: 'group',
    xaxis: { title: '' },
    yaxis: { title: '점포 수 (개)', gridcolor: '#eaeaea' },
    yaxis2: {
      title: '순증감 (개)', overlaying: 'y', side: 'right',
      showgrid: false, zeroline: true, zerolinecolor: '#ccc'
    },
    legend: { orientation: 'h', y: -0.18 }
  }, CONFIG);
}

/* ── 유동인구 시간대 히트맵 ── */
async function renderFootfallHeatmap() {
  const res = await fetch('data/sales_trend.json');
  const { hourly_footfall } = await res.json();

  const z = [hourly_footfall.weekday, hourly_footfall.saturday, hourly_footfall.sunday];
  const y = ['평일', '토요일', '일요일'];

  Plotly.newPlot('chart-footfall', [{
    z, x: hourly_footfall.hours, y,
    type: 'heatmap',
    colorscale: [[0,'#d6eaf8'], [0.5,'#2e86c1'], [1,'#1a3a5c']],
    hovertemplate: '%{y} %{x}: 지수 %{z}<extra></extra>',
    showscale: true,
    colorbar: { title: '유동인구<br>지수', len: 0.8 }
  }], {
    ...CHART_LAYOUT_BASE,
    title: { text: '시간대·요일별 유동인구 지수 (100=평균)', font: { size: 14 } },
    xaxis: { title: '시간대' },
    yaxis: { automargin: true },
    margin: { t: 40, r: 80, b: 60, l: 70 }
  }, CONFIG);
}

/* ── 전체 초기화 ── */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Plotly === 'undefined') return;
  renderPopGrowth();
  renderAgePyramid();
  renderIndustrySales();
  renderStoreTrend();
  renderFootfallHeatmap();
});
