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

const PLOTLY_CONFIG = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['select2d', 'lasso2d'] };

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
    title: { text: '화성시 등록인구 성장 추이 (2005~2024, 만명)', font: { size: 14 } },
    xaxis: { title: '', showgrid: false },
    yaxis: { title: '인구 (만명)', gridcolor: '#eaeaea' }
  }, PLOTLY_CONFIG);
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
    title: { text: '화성시 연령대별 인구 구조 (2024년, 천명)', font: { size: 14 } },
    barmode: 'overlay',
    bargap: 0.15,
    xaxis: {
      tickformat: 'd',
      tickvals: [-100, -75, -50, -25, 25, 50, 75, 100],
      ticktext: ['100', '75', '50', '25', '25', '50', '75', '100'],
      gridcolor: '#eaeaea', title: '← 남성 (천명)  /  여성 (천명) →'
    },
    yaxis: { automargin: true },
    legend: { orientation: 'h', y: -0.15 },
    margin: { t: 40, r: 20, b: 60, l: 80 }
  }, PLOTLY_CONFIG);
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
    title: { text: '업종별 월평균 매출 (동탄 가로상권 12개, 2025년 2분기, 백만원)', font: { size: 14 } },
    xaxis: { title: '월평균 매출 (백만원)', gridcolor: '#eaeaea' },
    yaxis: { automargin: true },
    margin: { t: 40, r: 20, b: 60, l: 100 }
  }, PLOTLY_CONFIG);
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
    title: { text: '기업 신생·소멸 현황 (화성시, 2016~2023)', font: { size: 14 } },
    barmode: 'group',
    xaxis: { title: '' },
    yaxis: { title: '점포 수 (개)', gridcolor: '#eaeaea' },
    yaxis2: {
      title: '순증감 (개)', overlaying: 'y', side: 'right',
      showgrid: false, zeroline: true, zerolinecolor: '#ccc'
    },
    legend: { orientation: 'h', y: -0.18 }
  }, PLOTLY_CONFIG);
}

/* ── 시간대×요일 생활인구 히트맵 ── */
async function renderPopTimeslot() {
  const res = await fetch('data/sales_trend.json');
  const { pop_by_timeslot, pop_by_wday } = await res.json();

  // 화성시 시간대별 비율 × 동탄 요일별 지수 조합
  const rates = pop_by_timeslot.rates;
  const idx   = pop_by_wday.index;                          // [월,화,수,목,금,토,일]
  const wdayAvg = idx.slice(0, 5).reduce((a, b) => a + b) / 5; // 평일 평균 지수
  const scale = r => Math.round(r * 10) / 10;

  const z = [
    rates.map(r => scale(r * wdayAvg / 100)),   // 평일
    rates.map(r => scale(r * idx[5]    / 100)),  // 토요일
    rates.map(r => scale(r * idx[6]    / 100)),  // 일요일
  ];

  Plotly.newPlot('chart-pop-timeslot', [{
    z,
    x: pop_by_timeslot.labels,
    y: ['평일', '토요일', '일요일'],
    type: 'heatmap',
    colorscale: [[0, '#d6eaf8'], [0.5, '#2e86c1'], [1, '#1a3a5c']],
    hovertemplate: '%{y} %{x}: %{z}%<extra></extra>',
    showscale: true,
    colorbar: { title: '생활인구<br>비율(%)', len: 0.8 }
  }], {
    ...CHART_LAYOUT_BASE,
    title: { text: '시간대·요일별 생활인구 (화성시 시간대 × 동탄 요일 조합, 2025.06)', font: { size: 14 } },
    xaxis: { title: '시간대' },
    yaxis: { automargin: true },
    margin: { t: 40, r: 80, b: 60, l: 70 }
  }, PLOTLY_CONFIG);
}

/* ── 요일별 생활인구 지수 ── */
async function renderPopWday() {
  const res = await fetch('data/sales_trend.json');
  const { pop_by_wday } = await res.json();

  const colors = pop_by_wday.labels.map(d =>
    d === '토' || d === '일' ? '#e74c3c' : '#27ae60'
  );

  Plotly.newPlot('chart-pop-wday', [{
    x: pop_by_wday.labels,
    y: pop_by_wday.index,
    type: 'bar',
    marker: { color: colors },
    hovertemplate: '%{x}: 지수 %{y}<extra></extra>'
  }], {
    ...CHART_LAYOUT_BASE,
    title: { text: `동탄 요일별 생활인구 지수 (${pop_by_wday.scope || '동탄 9개 행정동'}, 2025.06, 100=평균)`, font: { size: 14 } },
    xaxis: { title: '' },
    yaxis: { title: '지수 (100=평균)', gridcolor: '#eaeaea', range: [70, 120] },
    margin: { t: 40, r: 20, b: 50, l: 70 },
    shapes: [{
      type: 'line', xref: 'paper', x0: 0, x1: 1,
      y0: 100, y1: 100,
      line: { color: '#aaaaaa', width: 1.5, dash: 'dot' }
    }]
  }, PLOTLY_CONFIG);
}

/* ── 성별·연령별 생활인구 구성 ── */
async function renderPopSexAge() {
  const res = await fetch('data/sales_trend.json');
  const { pop_by_sex } = await res.json();

  Plotly.newPlot('chart-pop-sex-age', [
    {
      name: '남성',
      x: pop_by_sex.age_labels,
      y: pop_by_sex.age_male,
      type: 'bar',
      marker: { color: '#2e86c1' },
      hovertemplate: '%{x} 남성: %{y}%<extra></extra>'
    },
    {
      name: '여성',
      x: pop_by_sex.age_labels,
      y: pop_by_sex.age_female,
      type: 'bar',
      marker: { color: '#e74c3c' },
      hovertemplate: '%{x} 여성: %{y}%<extra></extra>'
    }
  ], {
    ...CHART_LAYOUT_BASE,
    title: { text: '성별·연령별 생활인구 구성 (화성시, 2025.06, 전체 대비 %)', font: { size: 14 } },
    barmode: 'group',
    xaxis: { title: '' },
    yaxis: { title: '비율 (%)', gridcolor: '#eaeaea' },
    legend: { orientation: 'h', y: -0.18 },
    margin: { t: 40, r: 20, b: 60, l: 60 }
  }, PLOTLY_CONFIG);
}

/* ── 업종별 점포 수 ── */
async function renderStoreCount() {
  const res = await fetch('data/sales_trend.json');
  const { industry_store_count } = await res.json();

  const entries = Object.entries(industry_store_count)
    .filter(([k]) => !k.startsWith('_'))
    .sort((a, b) => b[1] - a[1]);

  Plotly.newPlot('chart-store-count', [{
    x: entries.map(([, v]) => v),
    y: entries.map(([k]) => k),
    type: 'bar', orientation: 'h',
    marker: { color: entries.map((_, i) => `hsl(${210 - i * 18}, 65%, ${52 + i * 3}%)`) },
    hovertemplate: '%{y}: %{x}개<extra></extra>'
  }], {
    ...CHART_LAYOUT_BASE,
    title: { text: '업종별 점포 수 (동탄 반경 3km, 2024년)', font: { size: 14 } },
    xaxis: { title: '점포 수 (개)', gridcolor: '#eaeaea' },
    yaxis: { automargin: true },
    margin: { t: 40, r: 20, b: 60, l: 90 }
  }, PLOTLY_CONFIG);
}

/* ── 전체 초기화 ── */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Plotly === 'undefined') return;
  renderPopGrowth();
  renderAgePyramid();
  renderIndustrySales();
  renderStoreTrend();
  renderPopTimeslot();
  renderPopWday();
  renderPopSexAge();
  renderStoreCount();
});
