"""
KOSIS DT_1B04005N: 화성시 + 동탄 9개 행정동 인구 최신 수집
→ data/population.json 업데이트
  - yearly_growth: 화성시 연간 (기존 2005~2024 유지 + 2025~업데이트)
  - dongtan_monthly: 동탄 9개 행정동 합산 월별 최신
  - age_groups: 화성시 + 동탄 5세별 성별 (최신월)
"""
import http.client, json, urllib.parse, ssl
from collections import defaultdict

KOSIS_KEY = 'ODRjZTMwOWViY2JjYzgzZmUzYWMxY2NkNGZjMWJmNmY='
ctx = ssl._create_unverified_context()

DONGTAN_CODES = [
    '4159058500','4159058600','4159058700','4159058800',
    '4159059000','4159060000','4159061000','4159062000','4159063000',
]

def kosis_get(objL1, objL2, itmId, newEstPrdCnt=36):
    params = urllib.parse.urlencode({
        'method': 'getList', 'apiKey': KOSIS_KEY,
        'itmId': itmId,
        'objL1': objL1, 'objL2': objL2,
        'objL3': '', 'objL4': '', 'objL5': '', 'objL6': '', 'objL7': '', 'objL8': '',
        'format': 'json', 'jsonVD': 'Y',
        'prdSe': 'M', 'newEstPrdCnt': str(newEstPrdCnt),
        'orgId': '101', 'tblId': 'DT_1B04005N',
    })
    conn = http.client.HTTPSConnection('kosis.kr', timeout=30, context=ctx)
    conn.request('GET', f'/openapi/Param/statisticsParameterData.do?{params}')
    r = conn.getresponse()
    data = json.loads(r.read().decode('utf-8'))
    return data if isinstance(data, list) else []

# ── 1. 화성시 월별 총인구 (최근 36개월)
print('1. 화성시 총인구 수집...')
hwa_data = kosis_get('41590+', '0', 'T2+', newEstPrdCnt=36)
hwa_monthly = {}
for d in hwa_data:
    if d.get('ITM_ID') == 'T2':
        hwa_monthly[d['PRD_DE']] = int(d['DT'])
print(f'   {len(hwa_monthly)}개 월, 최신: {max(hwa_monthly)} = {hwa_monthly[max(hwa_monthly)]:,}명')

# ── 2. 동탄 9개 행정동 월별 총인구 (최근 36개월)
print('2. 동탄 행정동 총인구 수집...')
dt_data = kosis_get('+'.join(DONGTAN_CODES)+'+', '0', 'T2+', newEstPrdCnt=36)
dt_monthly = defaultdict(int)
for d in dt_data:
    if d.get('ITM_ID') == 'T2' and d.get('DT'):
        dt_monthly[d['PRD_DE']] += int(d['DT'])
dt_monthly = dict(dt_monthly)
print(f'   {len(dt_monthly)}개 월, 최신: {max(dt_monthly)} = {dt_monthly[max(dt_monthly)]:,}명')

# ── 3. 화성시 성별·5세별 연령 구조 (최신월)
print('3. 화성시 연령별 수집...')
# C2: 연령 5세 구간 코드 (5, 10, 15 ... 85 이상은 합산)
AGE_CODES = ['5','10','15','20','25','30','35','40','45','50','55','60','65','70','75','80','85','90','95','100','105']
objL2_age = '+'.join(['0'] + AGE_CODES) + '+'
hwa_age_data = kosis_get('41590+', objL2_age, 'T2+T3+T4+', newEstPrdCnt=1)
latest_ym = max(d['PRD_DE'] for d in hwa_age_data) if hwa_age_data else ''
print(f'   최신 기준: {latest_ym}')

# 5세별 → 10세 대분류 집계
AGE_GROUP_MAP = {
    '0':   '0~14세',  # 0대 미만 합산용
    '5':   '0~14세',
    '10':  '0~14세',
    '15':  '15~29세',
    '20':  '15~29세',
    '25':  '15~29세',
    '30':  '30~49세',
    '35':  '30~49세',
    '40':  '30~49세',
    '45':  '30~49세',
    '50':  '50~64세',
    '55':  '50~64세',
    '60':  '50~64세',
    '65':  '65세+',
    '70':  '65세+',
    '75':  '65세+',
    '80':  '65세+',
    '85':  '65세+',
    '90':  '65세+',
    '95':  '65세+',
    '100': '65세+',
    '105': '65세+',
}
GROUP_ORDER = ['0~14세', '15~29세', '30~49세', '50~64세', '65세+']

hwa_age = {g: {'male': 0, 'female': 0} for g in GROUP_ORDER}
for d in hwa_age_data:
    if d['PRD_DE'] != latest_ym or d.get('C2') == '0':
        continue
    grp = AGE_GROUP_MAP.get(d.get('C2', ''))
    if not grp:
        continue
    val = int(d['DT']) if d.get('DT') else 0
    if d['ITM_ID'] == 'T3':
        hwa_age[grp]['male'] += val
    elif d['ITM_ID'] == 'T4':
        hwa_age[grp]['female'] += val

# ── 4. 동탄 성별·5세별 연령 구조 (최신월)
print('4. 동탄 연령별 수집...')
dt_age_data = kosis_get('+'.join(DONGTAN_CODES)+'+', objL2_age, 'T2+T3+T4+', newEstPrdCnt=3)
dt_latest_ym = max(d['PRD_DE'] for d in dt_age_data) if dt_age_data else ''
print(f'   최신 기준: {dt_latest_ym}')

dt_age = {g: {'male': 0, 'female': 0} for g in GROUP_ORDER}
for d in dt_age_data:
    if d['PRD_DE'] != dt_latest_ym or d.get('C2') == '0':
        continue
    grp = AGE_GROUP_MAP.get(d.get('C2', ''))
    if not grp:
        continue
    val = int(d['DT']) if d.get('DT') else 0
    if d['ITM_ID'] == 'T3':
        dt_age[grp]['male'] += val
    elif d['ITM_ID'] == 'T4':
        dt_age[grp]['female'] += val

# ── 5. population.json 업데이트
print('5. population.json 업데이트...')
with open('data/population.json', 'r', encoding='utf-8') as f:
    pop = json.load(f)

# yearly_growth: 기존 연도 유지 + 새 연도(12월 기준) 추가/갱신
existing_years = {r['year']: r['population'] for r in pop['yearly_growth']}
for ym, cnt in hwa_monthly.items():
    if ym.endswith('12'):
        yr = int(ym[:4])
        existing_years[yr] = cnt
    elif ym == max(hwa_monthly) and not ym.endswith('12'):
        # 최신이 12월 아니면 해당 연도 잠정치로 추가
        yr = int(ym[:4])
        mon = ym[4:]
        existing_years[yr] = cnt  # 최신 월 기준

pop['yearly_growth'] = [{'year': y, 'population': v} for y, v in sorted(existing_years.items())]

# age_groups: 화성시 (기존 형식 유지)
pop['age_groups'] = [
    {
        'group': grp,
        'male': hwa_age[grp]['male'],
        'female': hwa_age[grp]['female'],
    }
    for grp in GROUP_ORDER
]
pop['_age_source'] = f'KOSIS DT_1B04005N 화성시(41590) 성별·5세별 주민등록인구, {latest_ym[:4]}.{latest_ym[4:]} 기준'

# dongtan_monthly: 동탄 9개 행정동 합산 월별
pop['dongtan_monthly'] = {
    '_source': f'KOSIS DT_1B04005N 동탄1~9동(9개 행정동) 합산, 기준={max(dt_monthly)}',
    '_scope': '동탄1~9동 합산 (동탄구 전체)',
    'data': [{'ym': ym, 'population': cnt} for ym, cnt in sorted(dt_monthly.items())]
}

# dongtan_age_groups: 동탄 연령 구조
pop['dongtan_age_groups'] = {
    '_source': f'KOSIS DT_1B04005N 동탄1~9동 성별·5세별, {dt_latest_ym[:4]}.{dt_latest_ym[4:]} 기준',
    'groups': [
        {
            'group': grp,
            'male': dt_age[grp]['male'],
            'female': dt_age[grp]['female'],
        }
        for grp in GROUP_ORDER
    ]
}

pop['_source'] = f'KOSIS DT_1B04005N 시군구별(읍면동) 주민등록인구, 화성시(41590), {max(hwa_monthly)} 최신'

with open('data/population.json', 'w', encoding='utf-8') as f:
    json.dump(pop, f, ensure_ascii=False, indent=2)

print('\nDone')
print(f'화성시 yearly_growth: {pop["yearly_growth"][0]["year"]}~{pop["yearly_growth"][-1]["year"]}')
print(f'화성시 age_groups: {len(pop["age_groups"])}개 그룹, 기준 {latest_ym}')
print(f'동탄 monthly: {len(dt_monthly)}개 월')
print(f'동탄 age_groups: {len(pop["dongtan_age_groups"]["groups"])}개 그룹, 기준 {dt_latest_ym}')
