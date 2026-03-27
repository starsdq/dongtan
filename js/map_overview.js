/* =====================================================
   1장 & 2장: 동탄 지역 개요 + 인구 지도
   - 동탄1·2신도시 경계 폴리곤
   - 삼성 사업장 마커
   ===================================================== */

async function initMapOverview() {
  const res = await fetch('data/population.json');
  const data = await res.json();

  const map = new naver.maps.Map('map-overview', {
    center: new naver.maps.LatLng(37.207, 127.077),
    zoom: 12,
    mapTypeId: naver.maps.MapTypeId.NORMAL
  });

  // 동탄1 경계 (근사 폴리곤)
  const dongtan1Coords = [
    [37.1980, 127.0520], [37.2120, 127.0520],
    [37.2180, 127.0650], [37.2160, 127.0780],
    [37.2050, 127.0800], [37.1970, 127.0750],
    [37.1920, 127.0620], [37.1940, 127.0530]
  ].map(([lat, lng]) => new naver.maps.LatLng(lat, lng));

  new naver.maps.Polygon({
    map,
    paths: dongtan1Coords,
    strokeColor: '#2e86c1',
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: '#aed6f1',
    fillOpacity: 0.25
  });

  // 동탄1 라벨
  new naver.maps.Marker({
    map,
    position: new naver.maps.LatLng(37.2050, 127.0650),
    icon: {
      content: '<div style="background:#1a3a5c;color:#fff;padding:5px 10px;border-radius:4px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25)">동탄1<br><span style="font-weight:400;font-size:11px">약 12.4만명</span></div>',
      anchor: new naver.maps.Point(30, 20)
    }
  });

  // 동탄2 경계 (근사 폴리곤)
  const dongtan2Coords = [
    [37.1920, 127.0780], [37.2050, 127.0800],
    [37.2160, 127.0780], [37.2250, 127.0900],
    [37.2280, 127.1050], [37.2200, 127.1200],
    [37.2050, 127.1280], [37.1880, 127.1200],
    [37.1780, 127.1050], [37.1760, 127.0900],
    [37.1820, 127.0800]
  ].map(([lat, lng]) => new naver.maps.LatLng(lat, lng));

  new naver.maps.Polygon({
    map,
    paths: dongtan2Coords,
    strokeColor: '#e74c3c',
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: '#f1948a',
    fillOpacity: 0.18
  });

  // 동탄2 라벨
  new naver.maps.Marker({
    map,
    position: new naver.maps.LatLng(37.2020, 127.1040),
    icon: {
      content: '<div style="background:#922b21;color:#fff;padding:5px 10px;border-radius:4px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25)">동탄2<br><span style="font-weight:400;font-size:11px">약 29.9만명</span></div>',
      anchor: new naver.maps.Point(30, 20)
    }
  });

  // 삼성 사업장 마커
  data.samsung_workplaces.forEach(wp => {
    const marker = new naver.maps.Marker({
      map,
      position: new naver.maps.LatLng(wp.lat, wp.lng),
      icon: {
        content: `<div style="background:#f39c12;color:#fff;padding:4px 9px;border-radius:20px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3)">삼성</div>`,
        anchor: new naver.maps.Point(20, 12)
      }
    });

    const infoWindow = new naver.maps.InfoWindow({
      content: `<div style="padding:10px 14px;font-size:13px;min-width:200px">
        <b>${wp.name}</b><br>
        <span style="color:#7f8c8d">직원 약 ${wp.employees_approx.toLocaleString()}명</span><br>
        <span style="color:#7f8c8d;font-size:11px">${wp.note}</span>
      </div>`
    });

    naver.maps.Event.addListener(marker, 'click', () => {
      infoWindow.open(map, marker);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof naver !== 'undefined') initMapOverview();
});
