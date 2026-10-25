# mumukg 🍱

개인용 모바일 우선 음식/맛집 결정 웹앱. **Next.js 웹으로 먼저 개발하고, 추후 Expo WebView 앱으로 확장**할 계획.

## 현재 기술 스택
- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- pnpm 12.15.0, lucide-react
- zustand / zod 패키지 설치됨 (실제 도입은 필요한 시점에)
- 현재 별도 백엔드, 로그인, Supabase 연동 없음. 데이터는 브라우저 localStorage.
- 지도는 카카오맵 JavaScript SDK 연결 코드만 있음. API 키 미설정 및 실기기 검증 전.

## 실행 및 검사
```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```
로컬: http://localhost:3000

**주의:** 개발 머신에서 NODE_ENV가 development로 고정된 이슈가 있었음. `scripts/build.mjs`가 프로덕션 빌드 시 NODE_ENV=production을 명시. package.json의 build 스크립트를 유지할 것. pnpm 설치 과정에서 unrs-resolver 빌드 스크립트 승인 관련 경고/오류가 발생한 적 있음. 의존성 설치 재현 시 확인 필요.

## 하단 탭 및 구현 현황
| 경로 | 탭 | 구현 현황 |
| --- | --- | --- |
| /map | 지도 | SDK 키 입력 시 지도/마커 렌더링 코드, 위치 클릭 또는 좌표 입력 및 식당 저장 (지도 실동작 미검증) |
| / | 동네밥 | 메인 랜딩/지도·메뉴 이동 링크. 주변 식당 탐색 미구현 |
| /decide | 랜덤메뉴 | 랜덤 추첨, 기본 토너먼트, 좋아하는 메뉴 추리기, 후보 추가/제외 |
| /delivery | 배달음식 | 분류 필터, 랜덤 메뉴, 즐겨찾기, 메뉴 직접 추가/삭제, 최근 선택 기록 |
| /restaurants | 맛집 목록 | 직접 등록·수정·삭제, 검색, 방문/미방문 표시 및 필터 |
| /saved | 구 경로 | /restaurants로 리다이렉트 |

## 저장 데이터
- 식당: `src/lib/restaurants.ts` / `mumukg.restaurants.v1` / Restaurant 타입: `src/lib/types.ts`.
- 배달 메뉴·즐겨찾기·최근 기록: `mumukg.delivery.v1`.
- 랜덤메뉴의 사용자 후보는 현재 페이지 메모리에만 유지됨. 새로고침 시 초기화.
- 서로 다른 브라우저, PWA, WebView 간 localStorage는 자동 공유되지 않음.
- 브라우저 저장 공간을 지우면 데이터가 없어지므로 중요한 기록 백업/동기화 기능 필요.

## 폴더
- `src/app`: 5개 탭의 페이지 및 레이아웃
- `src/components/tab-nav.tsx`: 하단 5개 탭
- `src/components/shell.tsx`: 공통 헤더, 모바일 컨테이너, Safe Area
- `src/lib/restaurants.ts`: localStorage 읽기/쓰기
- `scripts/build.mjs`: 프로덕션 NODE_ENV 보정

## 개발 원칙
1. 작은 모바일 화면, 한 손 조작, 터치 크기(대략 44px 이상), 16px 폼 글꼴 우선.
2. iOS Safe Area 및 WebView 대응 고려.
3. 지도 API 키와 비밀 키는 코드에 하드코딩 금지. NEXT_PUBLIC_로 시작하는 키는 공개된 값이므로 공급자 콘솔의 허용 도메인·쿼터 설정 필요.
4. 확장 기능보다 실제 사용 흐름과 상태 유지/오류 처리 우선.
5. 변경 후 lint/typecheck/build 재검증.

## 알려진 한계 및 체크할 점
- 모바일 브라우저 및 iOS/Android WebView E2E 테스트 미실시.
- 지도 SDK, 실제 마커 클릭/저장, 식당 검색은 키 설정 후 통합 테스트 필요.
- 현재 맛집 직접 등록은 위도/경도 입력이 필요해서 UX가 불편함.
- 지도 페이지 저장 실패 대응 및 동기화/저장소 스키마 검증 개선 필요.
- 랜덤메뉴 토너먼트는 후보 개수가 홀수일 때 부전승 처리 검토 필요.
- 룰렛 애니메이션 모드는 아직 미구현.
- 배달 메뉴 등록/삭제와 추천 기록은 현재 브라우저 기준.
- `pnpm install`에서 승인되지 않은 의존성 설치 스크립트 경고 이력 확인.
- Git 초기화 및 원격 저장소 연결은 현재 확인되지 않음.

## 다음 작업 우선순위
1. **모바일 실제 조작 검증**: 320~390px 폭, 하단 탭, 입력폼, 검색, 추천, 페이지 이동.
2. **현재 기능 엣지 케이스**: 토너먼트 홀수 후보 처리, 랜덤 후보 저장, 상태 변경 검증.
3. **카카오 지도 연동**: API 키 설정, 도메인 등록, 식당 이름 검색 → 결과 선택 → 마커 → 저장.
4. **동네밥 기능**: 등록된/주변 식당에서 추천, 필터, 최근 방문 중복 회피.
5. **데이터 백업 또는 Supabase 동기화**: 개인용 계정 또는 파일 내보내기/가져오기.
6. **PWA/WebView 검증**: iOS Safe Area, 뒤로가기, 외부 링크, 오프라인/실행 복원.

## 다음 대화에서
'@musi 연결해서 mumukg README와 작업 기록 확인하고 모바일 기능 이어서 개발하자'라고 요청하면 됨.
