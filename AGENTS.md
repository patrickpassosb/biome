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
2. Attempt web search for official docs (see Section 6)
3. If both fail: stop and request user guidance

**Verification After Context7:**

* Cross-check returned docs against implementation
* Cite the specific Context7 source in code comments
* Note any API version constraints discovered

---

## 2) Mandatory Tasks (Based on `ai_task_template_skeleton.md`)

For any work beyond trivial Q&A, Agent MUST operate from a task file created **from** `.agent/tasks/ai_task_template_skeleton.md`.

Rules:

* **Never modify `ai_task_template_skeleton.md`.** Only copy it to create a task.
* **Reuse an existing task** if it already covers the request.
* If a task exists but needs small changes, **edit the existing task** instead of creating a new one.
* Create a new task only when no existing task fits.

### Task Enumeration Rules

* All tasks MUST be explicitly numbered:

  * Task 1, Task 2, Task 3, …
* When creating a new task:

  * Determine the **highest existing task number**
  * Create the next task sequentially (e.g., after Task 3 → create Task 4)
* Task numbers must never be reused or skipped.
* The task title must include its number (e.g., `Task 4 – Backend Analytics Pipeline`).

This ensures linear project history and prevents task collisions.

---

## 3) Task-First Flow (Minimal)

When doing work:

1. Choose an existing relevant task, or create one from the template copy.
2. Define/confirm success criteria inside the task.
3. Use Context7 for any code/config/docs needs.
4. Implement + validate against success criteria.
5. Note second-order impacts only if meaningful.

---

## 4) Fix Root Causes

Prefer durable fixes over symptom-masking:

* Don’t silence errors or add hacks.
* Diagnose and address the underlying cause.

---

## 5) Task Reuse & Modification Policy

* If an existing task fully or partially covers the current request, Agent MUST reuse it.
* If the task is mostly correct but incomplete or outdated, Agent MUST update the existing task.
* Create a new task ONLY when:

  * The goal is materially different, or
  * Success criteria no longer overlap, or
  * The scope would cause confusion if merged.

Agent must prefer task modification over task duplication to conserve tokens and maintain continuity.

---

## 6) External Context & Web Retrieval

If information is required that is **not available via Context7**, the Agent MAY retrieve external context using:

### Firecrawl MCP Server (Preferred)

* Use **Firecrawl MCP** to scrape official documentation, specs, or authoritative sources.
* Limit scraping strictly to information required for the task.
* Prefer primary sources (official docs, repos, standards).

### Rules for External Retrieval

* Clearly state when Firecrawl is being used.
* Summarize retrieved information succinctly.
* Do NOT paste large raw scraped content.
* Treat scraped data as contextual input, not ground truth.
* If scraped sources conflict, request user clarification before proceeding.

---

## 7) Mandatory Clarification & Question-Asking

If **any part** of the user’s request, instructions, constraints, intent, or expected output is **unclear, ambiguous, underspecified, or open to multiple interpretations**, the Agent **MUST stop and ask clarifying questions before proceeding**.

Rules:

* The Agent MUST ask clarification questions **even if the doubt is small**.
* The Agent MUST NOT assume intent, defaults, preferences, or constraints.
* The Agent MUST NOT “fill gaps” based on prior experience or guesswork.
* If multiple reasonable interpretations exist, the Agent MUST list them and ask which one to follow.
* If the Agent is unsure whether clarification is needed, it MUST ask anyway.

This applies to:

* Prompts that are partially specified
* Requests with missing constraints
* Conflicting instructions
* Unclear success criteria
* Ambiguous terminology or scope

Proceeding without clarification when uncertainty exists is considered a **rule violation**.

---

### Core Principle

Unplanned work is a bug. Documentation-less assumptions are debt. Context-free code is a liability.

---

If you need any contexto go to the `/context` folder or ask me.

---
