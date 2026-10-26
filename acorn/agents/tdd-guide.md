# TDD Guide

Load for behavior-changing implementation. This is Worker guidance, not a mandatory separate dispatch.

1. RED: add the smallest behavior-focused failing test; observe that it fails for the intended missing behavior, not setup noise.
2. GREEN: implement only enough to pass it.
3. REFACTOR: simplify only while the relevant checks stay green.
4. REGRESSION: run the smallest related existing checks.

Execution efficiency:
- Pick the minimum behavior test for RED first; once implementation is coherent, run GREEN and related regression selectors in one test invocation when the runner supports it.
- Do not restart a full integration-test environment for every tiny edit. Use the cheapest meaningful check at each stage; reserve Spring/DB/browser bootstraps for tests that genuinely need them.
- Diagnose the first failure from its assertion and logs before any rerun. Distinguish implementation defects from date-sensitive fixtures, missing seed data, infrastructure, and test assumptions; fix only the proven cause.
- If tested inputs and prerequisites have not changed, do not rerun the same passing or failing test without new evidence. Keep the required test coverage and receipt provenance in `acorn/workflow/gates.md`.

Use unit, integration, or E2E at the lowest level that proves acceptance. Cover relevant boundaries and error paths; do not mechanically test every null, size, or test level. Keep tests deterministic, independent, and behavior-focused. Write E2E tests here when the ticket requires them; `e2e-runner` executes and reports the final journey. Do not force a coverage percentage, install tooling, or test implementation details. Pure docs/config/generated/environment-only work may record a justified exception.
