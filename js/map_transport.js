/* =====================================================
   3장: 교통 접근성 지도
   - GTX-A·SRT·1호선 역 마커
   - 동탄역 기준 반경 원 (30분·60분)
   ===================================================== */

async function initMapTransport() {
  const res = await fetch('data/transport.json');
  const data = await res.json();

  const map = new naver.maps.Map('map-transport', {
    center: new naver.maps.LatLng(37.2002, 127.0758),
    zoom: 10,
    mapTypeId: naver.maps.MapTypeId.NORMAL
  });

  // 반경 원 (30분·60분)
  data.radius_circles.forEach(circle => {
    new naver.maps.Circle({
      map,
      center: new naver.maps.LatLng(37.2002, 127.0758),
      radius: circle.radius_km * 1000,
      strokeColor: circle.color,
      strokeOpacity: 0.6,
      strokeWeight: 1.5,
      fillColor: circle.color,
      fillOpacity: circle.opacity
    });
  });

  // 역 마커
  const typeStyles = {
    gtx_srt: { bg: '#e74c3c', label: 'GTX·SRT' },
    subway:  { bg: '#27ae60', label: '지하철' }
  };

  data.stations.forEach(station => {
    const style = typeStyles[station.type] || { bg: '#7f8c8d', label: '' };

    const marker = new naver.maps.Marker({
      map,
      position: new naver.maps.LatLng(station.lat, station.lng),
      icon: {
        content: `<div style="background:${style.bg};color:#fff;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap">${station.name}</div>`,
        anchor: new naver.maps.Point(60, 14)
      }
    });

    const linesHtml = station.lines.map(l => `<span style="background:#1a3a5c;color:#fff;padding:1px 6px;border-radius:3px;font-size:11px;margin-right:3px">${l}</span>`).join('');

    const infoWindow = new naver.maps.InfoWindow({
      content: `<div style="padding:10px 14px;font-size:13px;min-width:220px">
        <b>${station.name}</b><br>
        <div style="margin:5px 0">${linesHtml}</div>
        <span style="color:#7f8c8d;font-size:11px">${station.note}</span>
      </div>`
    });

    naver.maps.Event.addListener(marker, 'click', () => {
      infoWindow.open(map, marker);
    });
  });

  // 반경 범례 라벨 (지도 위)
  const legendDiv = document.getElementById('transport-legend');
  if (legendDiv) {
    data.radius_circles.forEach(c => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-dot" style="background:${c.color}; opacity:0.7"></span>${c.label}`;
      legendDiv.appendChild(item);
    });
  }
}

// 초기화는 index.html의 네이버 API onload 콜백에서 호출됨
