"""
KOSIS DT_6BD1132: 화성시 기업 신생·소멸 최신 데이터 수집
http.client 사용 (SSL 우회)
"""
import http.client, json, urllib.parse

KOSIS_KEY = 'ODRjZTMwOWViY2JjYzgzZmUzYWMxY2NkNGZjMWJmNmY='

params = urllib.parse.urlencode({
    'method': 'getList',
    'apiKey': KOSIS_KEY,
    'itmId': 'T02+T03+',
    'objL1': '31240+',
    'objL2': '0',
    'objL3': '', 'objL4': '', 'objL5': '', 'objL6': '', 'objL7': '', 'objL8': '',
    'format': 'json',
    'jsonVD': 'Y',
    'prdSe': 'Y',
    'startPrdDe': '2016',
    'endPrdDe': '2024',
    'orgId': '101',
    'tblId': 'DT_6BD1132',
})

ctx = __import__('ssl')._create_unverified_context()
conn = http.client.HTTPSConnection('kosis.kr', timeout=30, context=ctx)
conn.request('GET', f'/openapi/Param/statisticsParameterData.do?{params}')
r = conn.getresponse()
raw = r.read().decode('utf-8')

with open('notebooks/biz_trend_raw.json', 'w', encoding='utf-8') as f:
    f.write(raw)

data = json.loads(raw)

by_year = {}
for row in data:
    year = int(row['PRD_DE'])
    itm  = row['ITM_ID']
    val  = int(row['DT']) if row.get('DT') else 0
    by_year.setdefault(year, {})[itm] = val

store_trend = []
for year in sorted(by_year):
    opened = by_year[year].get('T02', 0)
    closed = by_year[year].get('T03', 0)
    if closed == 0:
        continue
    store_trend.append({'year': year, 'opened': opened, 'closed': closed, 'net': opened - closed})

with open('notebooks/biz_trend_result.json', 'w', encoding='utf-8') as f:
    json.dump(store_trend, f, ensure_ascii=False, indent=2)

print(f'수집 연도: {[r["year"] for r in store_trend]}')
print(f'최신: {store_trend[-1] if store_trend else None}')
