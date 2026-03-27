# 동탄 상권분석 보고서 — 프로젝트 설정

## API 키 위치

| 서비스 | 키 위치 |
|--------|---------|
| 네이버 지도 | `js/config.js` → `CONFIG.NAVER_CLIENT_ID` (gitignore 제외, 도메인 제한으로 보호) |
| data.go.kr (B553077 등) | Python 스크립트 내 변수 또는 `.env` (gitignore 포함) |
| 경기데이터드림 | Python 스크립트 내 변수 또는 `.env` |
| KOSIS | PublicDataReader 설정 또는 `.env` |

## 데이터 파일 구조

```
data/
  population.json    # KOSIS 화성시 인구통계 (yearly_growth, age_groups)
  sales_trend.json   # 경기데이터드림 매출 + B553077 점포 수 + 추정 유동인구
  stores.json        # B553077 상가 POI (name, lon, lat, industry) — 20,664개
  competitors.json   # 경쟁 시설 수동 입력 (백화점·쇼핑몰)
  transport.json     # 교통 인프라 수동 입력
notebooks/
  *.json             # 중간 결과물 (gitignore, 재실행으로 재생성 가능)
```

## 배포

- GitHub Pages: `https://starsdq.github.io/dongtan`
- 브랜치: `main` root 폴더
- 네이버 지도 허용 도메인: `starsdq.github.io`, `localhost:8000`
