"""
소상공인진흥공단 B553077 storeListInRadius
동탄 반경 3km × 3지점으로 업종별 점포 수 최신 수집
"""
import json, urllib.request, urllib.parse, time, ssl, xml.etree.ElementTree as ET
SSL_CTX = ssl._create_unverified_context()

API_KEY = 'f845caf3bdcb4dfeff6acbb4bb7e4a97e5978786653098a5920fd9c327e55b53'
BASE_URL = 'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius'

# 동탄 3개 중심점 (북부·중앙·남부)
CENTERS = [
    (127.0597, 37.2250),  # 동탄 북부
    (127.0700, 37.2100),  # 동탄 중앙
    (127.0750, 37.1950),  # 동탄 남부
]

# 대분류 코드 → 표시 이름
CATEGORY_MAP = {
    'D': '음식',
    'G': '소매',
    'Q': '의료·건강',
    'P': '교육·학원',
    'O': '뷰티·미용',
    'R': '스포츠·여가',
    'I': '숙박',
    'S': '수리·서비스',
    'L': '부동산',
}

all_stores = {}

for cx, cy in CENTERS:
    page = 1
    while True:
        params = urllib.parse.urlencode({
            'serviceKey': API_KEY,
            'pageNo': page,
            'numOfRows': 1000,
            'cx': cx,
            'cy': cy,
            'radius': 3000,
            '_type': 'json',
        })
        url = f'{BASE_URL}?{params}'
        try:
            with urllib.request.urlopen(url, context=SSL_CTX, timeout=30) as resp:
                raw = resp.read().decode('utf-8')
        except Exception as e:
            print(f'  오류 ({cx},{cy}) p{page}: {e}')
            break

        root = ET.fromstring(raw)
        result_code = root.findtext('.//resultCode', '')
        if result_code != '00':
            print(f'  API 오류: {root.findtext(".//resultMsg")}')
            break

        rows = root.findall('.//item')
        if not rows:
            break

        for item in rows:
            bid = item.findtext('bizesId')
            if bid and bid not in all_stores:
                all_stores[bid] = {
                    'bizesId': bid,
                    'indsLclsCd': item.findtext('indsLclsCd', ''),
                    'indsLclsNm': item.findtext('indsLclsNm', '기타'),
                }

        total = int(root.findtext('.//totalCount', '0'))
        print(f'  중심({cx},{cy}) p{page}: {len(rows)}개 수신 (누계 unique {len(all_stores)})')
        if page * 1000 >= total:
            break
        page += 1
        time.sleep(0.2)

print(f'\n총 unique 점포: {len(all_stores)}개')

# 업종 대분류별 집계
counts = {}
for s in all_stores.values():
    name = s.get('indsLclsNm', '기타')
    counts[name] = counts.get(name, 0) + 1

# 기타 정리 (소수 카테고리 묶기)
result = {k: v for k, v in sorted(counts.items(), key=lambda x: -x[1]) if v >= 10}
result['_source'] = f'소상공인시장진흥공단 B553077 storeListInRadius (2026.03 수집, 동탄 반경 3km×3지점, 중복 제거 후 {len(all_stores):,}개)'
result['_total'] = len(all_stores)

with open('notebooks/store_count_result.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print('\n업종별 점포 수:')
for k, v in list(result.items()):
    if not k.startswith('_'):
        print(f'  {k}: {v}')
