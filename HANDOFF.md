# 개발 작업 요약

현재 내용은 프로젝트 루트 `handoff.md`와 `README.md`를 참조하세요. Acorn 세션 재개는 소문자 `handoff.md`를 사용합니다.

# mumukg 작업 인수인계 (2026-10-27 KST)

## 현재 상태
- 브랜치: main, HEAD: c4c7376 (정리 당시). Acorn 활성 티켓 없음.
- Acorn 진입점: AGENTS.md. 구현 제약: docs/development.md. 프로젝트 설명: README.md.
- Git 미커밋 변경 있음. 문서 정리 후 사용자가 직접 선택하여 커밋할 예정. 커밋/푸시 자동 실행 금지.

## 이번 세션 완료
- 기본 6색 팔레트 확정: 브랜드 Olive #4D5B3C / Sage #D9D8B8 / Cream #EFE6D4, 상태 오류 #B4534B / 경고 #A47536 / 성공 #527A60.
- UI 제약 확정: 가로 스크롤 금지, 모바일 우선 및 태블릿/데스크톱 전체 너비 활용. 공통 토큰 정리 작업은 추후 실시.
- .env.local 생성 및 Kakao Maps JavaScript 키 입력 흐름 마련. 키 값은 기록하거나 커밋하지 않음.
- pnpm 패키지 설치 복구. 지도 길게 누르기 → 주변 업소 목록의 세로 스크롤 스타일 개선 (실기기 검증 전).
- 지도 addRestaurantMarker 참조 순서 ESLint 오류 수정.
- 외부 브라우저 확장 프로그램의 html 속성 삽입으로 나타난 hydration 경고 억제를 위해 루트 html에 suppressHydrationWarning 적용.
- 먹스토리 UI 리뉴얼: 전체 너비 편집형 화면, 반응형 1/2/3열 카드, 검색·아이콘 구름·기록 버튼·Drawer 스타일 개선. 기존 저장/검색/등록·수정·삭제 로직 유지.
- README 및 본 인수인계 문서 현행화.

## 검사 증거
- 먹스토리 수정 직후: pnpm typecheck PASS, pnpm exec eslint src/app/story/page.tsx src/components/story-rank-cloud.tsx src/components/shell.tsx PASS, pnpm build PASS.
- 지도 수정 직후: pnpm exec eslint src/app/map/page.tsx PASS, pnpm typecheck PASS.
- 실제 모바일 터치 스크롤, Hydration 브라우저 재현, 반응형 시각 테스트는 미검증. 문서만 정리한 이번 단계에서는 빌드 재실행하지 않음.

## 다음 작업 / 결정 대기
1. /story 실기기 또는 브라우저에서 카드·랭킹·입력 Drawer와 화면 너비 점검. 기능 변경 없이 필요시 디자인 보정.
2. /map 주변 업소 목록 터치 스크롤, 카카오 API 도메인/검색·저장 흐름 실사용 검증.
3. 다른 화면의 좁은 컨테이너와 하단 탭을 반응형 규칙에 맞춰 단계적으로 개선.
4. 친구 3~4명의 공유 맛집 데이터 및 랜덤메뉴 '집에서/나가서' 흐름은 기획 논의 상태이며 구현하지 않음.
5. 그룹 공유 DB/인증, 기록 카테고리 추가 등 데이터 구조 변경은 확정 후 별도 작업.

## 다음 세션 진입
1. AGENTS.md 확인 후 이 handoff.md 읽기.
2. git status, Acorn BOARD/state 확인하여 기록과 현재 상태 대조.
3. README.md 및 docs/development.md를 필요한 범위에서 확인.
4. 사용자가 지정하는 해당 화면만 변경하고 최소 검증 실행.
