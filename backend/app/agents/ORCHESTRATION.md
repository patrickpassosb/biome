# Agent Orchestration Flow

The Biome Multi-Agent System uses a **Coordinator Pattern** implemented via the Google ADK `LlmAgent`.

## Agents

1.  **Coordinator Agent (Head Coach Manager):**
    -   **Role:** Orchestrates the workflow.
    -   **Sub-agents:** Analyst, Coach, Memory Curator.
    -   **Responsibility:** Manages the sequential flow of data between agents.

2.  **Analyst Agent:**
    -   **Role:** Data Analysis.
    -   **Tools:** `get_gym_metrics`.
    -   **Output:** `CoachFindings` (structured JSON).
    -   **Task:** Analyze user metrics (volume, RPE, etc.) and identify findings.

3.  **Coach Agent:**
    -   **Role:** Planning.
    -   **Tools:** `get_user_profile`, `get_past_plan`.
    -   **Input:** Analyst Findings.
    -   **Output:** `WeeklyPlan` (structured JSON).
    -   **Task:** Create a weekly plan based on findings and user profile, citing specific metrics.

4.  **Memory Curator Agent:**
    -   **Role:** Archival.
    -   **Tools:** `save_memory_record`.
    -   **Input:** Plan and Findings.
    -   **Output:** `MemoryRecord` (structured JSON).
    -   **Task:** Compress and save the session artifacts into long-term memory.

## Workflow

1.  **Initialization:** The Coordinator receives a request to generate a new training cycle.
2.  **Analysis Phase:** Coordinator invokes **Analyst** to retrieve and analyze gym metrics.
3.  **Planning Phase:** Coordinator passes Analyst's findings to **Coach** to generate a `WeeklyPlan`.
4.  **Archival Phase:** Coordinator passes the generated Plan and Findings to **Memory Curator** to create and save a `MemoryRecord`.
