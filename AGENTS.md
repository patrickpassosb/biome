## Agent Operating Rules

### Purpose

Non-optional rules to ensure: documented assumptions, structured planning, and correct library usage.

---

## 1) Mandatory Context7

Agent MUST use Context7 MCP for:
* Code generation
* Setup/config steps
* Library/framework/API/SDK usage
* Dependency decisions
* CLI commands for tools/frameworks
* Any "how to use X" documentation

Rules:
* Never rely on memory for library/API behavior.
* Resolve library ID + fetch docs via Context7 before implementation.

**Fallback Strategy (If Context7 Unavailable):**
1. Notify user: "Context7 unavailable, using [fallback method]"
2. Attempt web search for official docs (see Section 7)
3. If both fail: stop and request user guidance

---

## 2) Build, Lint, Test Commands

### Backend (Python - FastAPI)
```bash
cd backend
uv run pytest                           # Run all tests
uv run pytest tests/test_main.py        # Run single test file
uv run pytest tests/test_main.py::test_root_endpoint  # Single test
uv run pytest --cov=. --cov-report=term-missing  # Coverage (80% min)
uv run ruff check                       # Lint
uv run ruff check --fix                 # Auto-fix
uv run ruff format                       # Format
./dev.sh                                 # Dev server
```

### Frontend (Next.js - TypeScript)
```bash
cd frontend
npm test                                 # Run unit tests
npm test WorkoutLogger.test.tsx         # Run single test file
npx vitest run --testNamePattern "logs workout"  # By pattern
npm run test:coverage                    # Coverage report
npm run test:e2e                         # E2E tests (Playwright)
npm run lint                             # Lint
npm run build                            # Build
npm run dev                              # Dev server
```

---

## 3) Code Style Guidelines

### Python (Backend)
* **Imports**: Group standard library, third-party, local. Use `from x import y`, avoid `*` imports.
* **Formatting**: Use `ruff format` (PEP 8). No manual formatting.
* **Types**: Use Pydantic models for API request/response. Use `typing` module (`List`, `Optional`, `Literal`, `Dict`, `Any`).
* **Naming**: `snake_case` for functions/variables, `PascalCase` for classes. Router functions: `get_overview_metrics()`, `create_weekly_plan()`.
* **Error Handling**: Raise `HTTPException` for API errors. Use specific exceptions in business logic. Never bare `except:`.
* **Docstrings**: Google-style with description, args, returns, raises.
* **Constants**: `UPPER_SNAKE_CASE` for module-level constants.
* **Comments**: No inline comments unless explaining complex logic. Use Context7 citations.

### TypeScript (Frontend)
* **Imports**: Use `import type { ... }` for type-only imports. Group third-party, then `@/` path alias.
* **Formatting**: ESLint with `eslint-config-next`. No manual formatting.
* **Types**: Strict TypeScript. Define interfaces in `types.ts` or inline for props. Avoid `any` - use `unknown` or specific types.
* **Naming**: `camelCase` for functions/variables, `PascalCase` for components/interfaces. Handlers: `handleXxx()`, `onXxx()`.
* **Error Handling**: Always check `response.ok` in fetch. Throw descriptive `Error` objects. Use try/catch for async.
* **Components**: Functional components with hooks. Interfaces: `ComponentNameProps`.
* **Comments**: No JSDoc unless public API. Use Context7 citations.
* **Async**: Use `async/await` over `.then()`. Prefer `useAsyncData` pattern.

### General
* **File Size**: Keep under 500 lines. Extract to modules when exceeded.
* **Commit Messages**: Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`.
* **No Emojis**: Never use emojis in code/comments unless requested.

---

## 4) Mandatory Tasks (Based on `ai_task_template_skeleton.md`)

For any work beyond trivial Q&A, Agent MUST operate from a task file created **from** `.agent/tasks/ai_task_template_skeleton.md`.

Rules:
* **Never modify `ai_task_template_skeleton.md`.** Only copy it to create a task.
* **Reuse an existing task** if it already covers the request.
* If a task exists but needs small changes, **edit the existing task** instead of creating a new task.
* Create a new task only when no existing task fits.

### Task Enumeration Rules
* All tasks MUST be explicitly numbered: Task 1, Task 2, Task 3, …
* When creating a new task: Determine the **highest existing task number** and create the next sequentially (e.g., after Task 3 → create Task 4)
* Task numbers must never be reused or skipped.
* Task title must include its number (e.g., `Task 4 – Backend Analytics Pipeline`).

---

## 5) Task-First Flow (Minimal)

When doing work:
1. Choose an existing relevant task, or create one from the template copy.
2. Define/confirm success criteria inside the task.
3. Use Context7 for any code/config/docs needs.
4. Implement + validate against success criteria.
5. Note second-order impacts only if meaningful.

---

## 6) Fix Root Causes

Prefer durable fixes over symptom-masking:
* Don't silence errors or add hacks.
* Diagnose and address the underlying cause.

---

## 7) External Context & Web Retrieval

If information is required that is **not available via Context7**, Agent MAY retrieve external context using Firecrawl MCP to scrape official documentation. Limit scraping to information required for the task. Clearly state when Firecrawl is being used and summarize retrieved data succinctly.

---

## 8) Mandatory Clarification & Question-Asking

If **any part** of the user's request is **unclear, ambiguous, underspecified, or open to multiple interpretations**, Agent **MUST stop and ask clarifying questions**. Never assume intent, defaults, preferences, or constraints. If unsure whether clarification is needed, ask anyway.

---

### Core Principle

Unplanned work is a bug. Documentation-less assumptions are debt. Context-free code is a liability.

---

If you need any context, go to the `/context` folder or ask me.
