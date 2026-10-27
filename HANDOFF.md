# mumukg 세션 인수인계 (2026-10-27 KST)

## Project / Ticket / Session
- Project: `C:\workspace\mumukg`
- Ticket: 없음 (`acorn/state.json`의 `activeTicket`은 `null`)
- Branch / HEAD: `main` / `195070b`
- Worktree: `git status --short` 105개 항목 (staged 104, unstaged 1, untracked 1). 다수의 기존 staged 변경과 `.agents/skills/logo-design-skill/` 미추적 폴더가 있음. 리셋/복원/정리 금지.

## Current / Completed
- 공통 버튼은 Animate UI 기반 공유 Button, 하단 탐색은 Animate UI TabsHighlight 패턴 사용. 모바일 탭 전환 모션과 여백 조정.
- 페이지 확대 제한, 입력 자동 확대 방지 반영.
- 지도 상세 주소에서 도로명/지번 전환: 두 주소가 있으면 주소 문장을 눌러 전환. 복사/전화/카카오맵 액션은 주소 우측에 모음.
- 상세 카테고리 아이콘/이름을 주소 카드 위, 테두리 바깥 가운데에 배치. Animate UI Zoom으로 Drawer 진입 시 작게 시작해 스프링으로 확대.
- 상세 카테고리 영역 배경 제거, 카테고리 이름 대괄호 제거. Drawer 상단 여백 소폭 확대.
- 지도 액션은 복사 📋, 전화 📞, 카카오맵 📍 이모지 사용. 카카오맵 링크는 상세/등록 정보에 있음.
- Animate UI Toast 추가. 하단 고정, 3개 기본 제한, 같은 위치에서 누적 스택. Olive 테두리/글자와 Beige 배경, 닫기 버튼 및 진행바 없음. Toast 기본 5초, 포인터 hover/focus 중 일시정지는 라이브러리 기본 동작.
- Toast의 누락 peer dependency 오류 해결을 위해 사용자 승인 후 `@base-ui/react` 추가 (`^1.9.0`), lockfile 갱신.
- 더 이상 참조하지 않는 Lordicon 시험 SVG를 제거했고, 현재 UI는 이모지를 사용. AppLayout의 고립된 Lordicon 출처 푸터도 제거. `docs/development.md`의 향후 Lordicon 무료/출처 규칙은 유지.

## Changed / Worktree
- 이번 UI 범위: `src/app/map/page.tsx`, `src/components/ui/toast.tsx`, `src/components/app-layout.tsx`, `package.json`, `pnpm-lock.yaml`.
- 기존 변경 다수 포함. `docs/development.md` 등 이미 staged인 변경은 임의 수정/복원하지 않음.
- `handoff.md`는 `.gitignore` 대상이며 본 인수인계는 로컬 기록.

## Evidence / Verification
- `codex mcp list`: `shadcn` MCP enabled로 표시됨(인증 열은 Unsupported). 현재 세션의 `mcp__shadcn` 도구 호출은 성공.
- 소스 검토와 대상 파일 `git diff --check` 통과.
- 사용자 지침에 따라 테스트, 타입 검사, 린트, 브라우저/모바일 확인은 실행하지 않음. 렌더링/모바일 실기기는 미검증.
- 로컬에 `node_modules/.bin/acorn-kit` 없음. 이 프로젝트에는 active ticket 없음. 상태 파일의 pending gates는 ticketless 작업의 완료 판정에 사용하지 않음.

## Decisions / Blockers
- `docs/development.md` 기준 적용. Animate UI 전체 변환 금지, 필요한 요소만 사용.
- 새 Lordicon 아이콘은 무료/출처 표기 기준을 계속 따름. 현재 화면에서 시험 아이콘은 제거하고 이모지 사용.
- 기존 staged 작업 및 로고 산출물 등은 보존. 커밋/배포하지 않음.

## Resume: exact first steps
1. 이 handoff와 `git status --short`, `codex mcp list` 재확인.
2. 기존 staged/untracked 변경을 보존.
3. 사용자가 원할 때에만 테스트/타입 검사/린트 및 지도 상세 Drawer 브라우저/모바일 QA.
