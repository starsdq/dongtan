"""
경기데이터드림 생활인구 데이터 → sales_trend.json 업데이트
- 시간대별·성연령별: 화성시 시군구 단위만 제공 → 화성시 전체
- 요일별: 행정동 단위 → 동탄 9개 행정동(동탄1~9동)으로 필터
"""
import json

# 동탄 행정동 코드 (동탄1동~동탄9동, 2026년 동탄구)
DONGTAN_DONG_CODES = {
    4159058500: '동탄1동',
    4159058600: '동탄2동',
    4159058700: '동탄3동',
    4159058800: '동탄4동',
    4159059000: '동탄5동',
    4159060000: '동탄6동',
    4159061000: '동탄7동',
    4159062000: '동탄8동',
    4159063000: '동탄9동',
}

# ── 1. 시간대별 생활인구 (화성시 시군구 단위) ──
with open('notebooks/timem_hwaseong.json', 'r', encoding='utf-8') as f:
    timem = json.load(f)

latest_ym = max(r['STD_YM'] for r in timem)
tz_order  = ['TZ01','TZ02','TZ03','TZ04','TZ05','TZ06','TZ07','TZ08','TZ09','TZ10']
tz_labels = ['0~3시','3~6시','6~9시','9~11시','11~13시','13~16시','16~18시','18~20시','20~22시','22~24시']

latest_rows = {r['TMZON_CD']: r for r in timem if r['STD_YM'] == latest_ym}
timeslot_rates = [round(latest_rows[tz]['DYNMC_POPLTN_CNT_RATE'], 1) for tz in tz_order]

# ── 2. 요일별 생활인구 (동탄 9개 행정동 필터) ──
with open('notebooks/dongm_hwaseong_latest.json', 'r', encoding='utf-8') as f:
    dongm = json.load(f)

latest_dong_ym = max(r['STD_YM'] for r in dongm)
wday_order  = ['MON','TUE','WED','THU','FRI','SAT','SUN']
wday_labels = ['월','화','수','목','금','토','일']

# 동탄 행정동만 필터
dongtan_rows = [r for r in dongm
                if r.get('ADMDONG_CD') in DONGTAN_DONG_CODES
                and r['STD_YM'] == latest_dong_ym]

# 동탄 데이터가 있는지 확인
dongtan_codes_found = set(r['ADMDONG_CD'] for r in dongtan_rows)
print(f'동탄 행정동 데이터 확인:')
print(f'  기대 코드: {set(DONGTAN_DONG_CODES.keys())}')
print(f'  실제 존재: {dongtan_codes_found}')

if dongtan_codes_found:
    # 동탄 데이터 집계
    wday_totals = {w: 0 for w in wday_order}
    for r in dongtan_rows:
        if r['WDAY_CD'] in wday_order:
            wday_totals[r['WDAY_CD']] += r['DYNMC_POPLTN_CNT']
    label_prefix = '동탄 9개 행정동'
else:
    # 동탄 코드 없으면 화성시 전체 fallback
    print('  ⚠ 동탄 코드 없음 → 화성시 전체 사용')
    wday_totals = {w: 0 for w in wday_order}
    for r in dongm:
        if r['STD_YM'] == latest_dong_ym and r['WDAY_CD'] in wday_order:
            wday_totals[r['WDAY_CD']] += r['DYNMC_POPLTN_CNT']
    label_prefix = '화성시 전체'

wday_raw = [round(wday_totals[w]) for w in wday_order]
avg = sum(wday_raw) / len(wday_raw)
wday_index = [round(v / avg * 100, 1) for v in wday_raw]

print(f'\n요일별 지수 ({label_prefix}):')
for lbl, idx in zip(wday_labels, wday_index):
    print(f'  {lbl}: {idx}')

# ── 3. 성별·연령별 생활인구 (화성시 시군구 단위) ──
with open('notebooks/sxagem_hwaseong.json', 'r', encoding='utf-8') as f:
    sx = json.load(f)

latest_sx_ym = max(r['STD_YM'] for r in sx)
sx_latest = {r['SEX_AGE_CD']: r for r in sx if r['STD_YM'] == latest_sx_ym}

age_codes  = ['10','20','30','40','50','60O']
age_labels = ['10대','20대','30대','40대','50대','60대+']

raw_male   = [sx_latest.get(f'M{c}', {}).get('DYNMC_POPLTN_CNT', 0) for c in age_codes]
raw_female = [sx_latest.get(f'F{c}', {}).get('DYNMC_POPLTN_CNT', 0) for c in age_codes]

total_age = sum(raw_male) + sum(raw_female)
age_male   = [round(v / total_age * 100, 1) for v in raw_male]
age_female = [round(v / total_age * 100, 1) for v in raw_female]
male_rate   = round(sx_latest['M']['DYNMC_POPLTN_CNT_RATE'], 1)
female_rate = round(sx_latest['F']['DYNMC_POPLTN_CNT_RATE'], 1)

# ── sales_trend.json 업데이트 ──
with open('data/sales_trend.json', 'r', encoding='utf-8') as f:
    sales = json.load(f)

sales['pop_by_timeslot'] = {
    '_source': f'경기 생활인구 시군구별·시간대별 현황, 화성시, {str(latest_ym)[:4]}.{str(latest_ym)[4:]}',
    '_note': 'TZ01(0~3시)~TZ10(22~24시) 구간별 월 생활인구 비율, 경기데이터드림 TB25BPTPOPSIGTIMEM',
    'labels': tz_labels,
    'rates': timeslot_rates
}

wday_source = (
    f'경기 생활인구 동별·요일별 현황, 동탄1~9동 합산, {str(latest_dong_ym)[:4]}.{str(latest_dong_ym)[4:]}'
    if dongtan_codes_found else
    f'경기 생활인구 동별·요일별 현황, 화성시 합산, {str(latest_dong_ym)[:4]}.{str(latest_dong_ym)[4:]}'
)

sales['pop_by_wday'] = {
    '_source': wday_source,
    '_note': f'요일별 생활인구 합산 (100=평균), {label_prefix}, 경기데이터드림 TB25BPTPOPDAYDONGM',
    'labels': wday_labels,
    'values': wday_raw,
    'index': wday_index,
    'scope': label_prefix
}

sales['pop_by_sex'] = {
    '_source': f'경기 생활인구 시군구별·성별·연령별 현황, 화성시, {str(latest_sx_ym)[:4]}.{str(latest_sx_ym)[4:]}',
    '_note': '연령별 비율 = 연령 세부 합 기준 정규화, 경기데이터드림 TB25BPTPOPSIGSXAGEM',
    'male_rate': male_rate,
    'female_rate': female_rate,
    'age_labels': age_labels,
    'age_male': age_male,
    'age_female': age_female
}

with open('data/sales_trend.json', 'w', encoding='utf-8') as f:
    json.dump(sales, f, ensure_ascii=False, indent=2)

print('\nDone')
