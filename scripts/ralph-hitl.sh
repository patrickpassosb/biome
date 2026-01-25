#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${AGENT_CMD:-}" ]]; then
  echo "AGENT_CMD is required (e.g., 'codex ...', 'opencode ...', 'gemini ...')."
  exit 1
fi

TASK_FILE="${TASK_FILE:-TASK.md}"
LOG_DIR="${LOG_DIR:-.agent/ralph_logs}"
PROGRESS_FILE="${PROGRESS_FILE:-progress.txt}"
MAX_ITERS="${MAX_ITERS:-10}"

if [[ ! -f "${TASK_FILE}" ]]; then
  echo "Task file not found: ${TASK_FILE}"
  exit 1
fi

mkdir -p "${LOG_DIR}"

checklist_complete() {
  if grep -q "^\s*- \[ \]" "${TASK_FILE}"; then
    return 1
  fi
  return 0
}

run_feedback_loops() {
  (cd backend && uv run ruff check)
  (cd backend && uv run ruff format)
  (cd backend && uv run pytest)
  (cd frontend && npm run lint)
  (cd frontend && npm test)
  (cd frontend && npm run build)
}

iteration=1

while (( iteration <= MAX_ITERS )); do
  timestamp=$(date +"%Y%m%d_%H%M%S")
  log_file="${LOG_DIR}/ralph_${timestamp}_${iteration}.log"

  echo "==> Ralph iteration ${iteration}/${MAX_ITERS} (HITL)"
  echo "Log: ${log_file}"

  {
    echo "Iteration: ${iteration}"
    echo "Timestamp: ${timestamp}"
    echo "Task file: ${TASK_FILE}"
    echo "Progress file: ${PROGRESS_FILE}"
    echo "Agent command: ${AGENT_CMD}"
    echo ""
    echo "--- AGENT RUN ---"
    ${AGENT_CMD} "@${TASK_FILE} @${PROGRESS_FILE}"
    echo ""
    echo "--- FEEDBACK LOOPS ---"
    run_feedback_loops
  } | tee "${log_file}"

  if checklist_complete; then
    echo "Checklist complete. Exiting."
    exit 0
  fi

  read -r -p "Continue to next iteration? [y/N]: " reply
  case "${reply}" in
    y|Y) ;;
    *)
      echo "Stopping after iteration ${iteration}."
      exit 0
      ;;
  esac

  iteration=$((iteration + 1))
done

echo "Reached MAX_ITERS=${MAX_ITERS} without completion."
exit 1
