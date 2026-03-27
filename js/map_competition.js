/* =====================================================
   4장: 경쟁 상권 지도
   - 백화점·쇼핑몰·아울렛·가구 카테고리별 마커
   - 클릭 시 시설 정보 팝업
   - 상가 밀도 히트맵 레이어 (토글)
   ===================================================== */

async function initMapCompetition() {
  const [competitorsRes, storesRes] = await Promise.all([
    fetch('data/competitors.json'),
    fetch('data/stores.json')
  ]);
  const data = await competitorsRes.json();
  const storeData = await storesRes.json();

  const map = new naver.maps.Map('map-competition', {
    center: new naver.maps.LatLng(37.24, 127.07),
    zoom: 10,
    mapTypeId: naver.maps.MapTypeId.NORMAL
  });

  // 마커 SVG (핀 모양)
  function makePinSvg(color) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.94 14 22 14 22s14-12.06 14-22C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>`;
  }

  const openInfoWindows = [];

  data.facilities.forEach(f => {
    const catStyle = data.categories[f.category] || { label: '', color: '#7f8c8d' };
    const svgContent = makePinSvg(catStyle.color);

    const marker = new naver.maps.Marker({
      map,
      position: new naver.maps.LatLng(f.lat, f.lng),
      icon: {
        content: `<div style="cursor:pointer">${svgContent}</div>`,
        size: new naver.maps.Size(28, 36),
        anchor: new naver.maps.Point(14, 36)
      },
      title: f.name
    });

    const areaText = f.area_m2 ? `연면적 ${f.area_m2.toLocaleString()}㎡` : '';
    const openedText = f.opened ? `개점 ${f.opened}` : '';
    const badgeColor = f.opened === '예정' ? '#f39c12' : catStyle.color;

    const infoWindow = new naver.maps.InfoWindow({
      content: `<div style="padding:12px 16px;font-size:13px;min-width:200px;max-width:260px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="background:${badgeColor};color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">${catStyle.label}</span>
          ${f.opened === '예정' ? '<span style="background:#fef9e7;color:#f39c12;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">예정</span>' : ''}
        </div>
        <b style="font-size:14px">${f.name}</b><br>
        <div style="color:#7f8c8d;font-size:12px;margin-top:4px">
          ${areaText}${areaText && openedText ? ' &middot; ' : ''}${openedText}
        </div>
        ${f.note ? `<div style="color:#555;font-size:12px;margin-top:5px;border-top:1px solid #eee;padding-top:5px">${f.note}</div>` : ''}
      </div>`,
      borderWidth: 0,
      disableAnchor: false,
      backgroundColor: '#fff',
      borderColor: '#dce3ea',
      anchorSize: new naver.maps.Size(10, 10)
    });

    naver.maps.Event.addListener(marker, 'click', () => {
      openInfoWindows.forEach(iw => iw.close());
      openInfoWindows.length = 0;
      infoWindow.open(map, marker);
      openInfoWindows.push(infoWindow);
    });
  });

  // 범례 렌더링
  const legendDiv = document.getElementById('competition-legend');
  if (legendDiv) {
    Object.entries(data.categories).forEach(([key, cat]) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-dot" style="background:${cat.color}"></span>${cat.label}`;
      legendDiv.appendChild(item);
    });
  }

  // ── 상가 밀도 히트맵 ──
  if (!naver.maps.visualization) return;

  const heatmapPoints = storeData.stores.map(s =>
    new naver.maps.LatLng(s.lat, s.lon)
  );

  const heatMapLayer = new naver.maps.visualization.HeatMap({
    map: null,  // 초기에는 숨김
    data: heatmapPoints,
    radius: 20,
    opacity: 0.65,
    colorMap: naver.maps.visualization.SpectrumStyle.FIRE
  });

  let heatMapShown = false;
  const toggleBtn = document.getElementById('btn-heatmap');
  if (toggleBtn) {
    toggleBtn.disabled = false;
    toggleBtn.addEventListener('click', () => {
      heatMapShown = !heatMapShown;
      heatMapLayer.setMap(heatMapShown ? map : null);
      toggleBtn.textContent = heatMapShown ? '히트맵 숨기기' : '상가 밀도 히트맵';
      toggleBtn.classList.toggle('active', heatMapShown);
    });
  }
}

// 초기화는 index.html의 네이버 API onload 콜백에서 호출됨
