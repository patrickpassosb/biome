.DEFAULT_GOAL := help

.PHONY: help ralph ralph-hitl

help:
	@echo "Available targets:"
	@echo "  ralph       Run AFK Ralph loop (scripts/ralph-loop.sh)"
	@echo "  ralph-hitl  Run HITL Ralph loop (scripts/ralph-hitl.sh)"

ralph:
	@bash scripts/ralph-loop.sh

ralph-hitl:
	@bash scripts/ralph-hitl.sh
