"""
ASSESSORIA AI Agents — Dispatcher
==================================
Entry point for the agents container.

Usage
-----
    # List available agents
    python -m agents.dispatcher

    # Run a specific agent task
    python -m agents.dispatcher --agent marketing --task analyze
    python -m agents.dispatcher --agent sales     --task analyze_prospect
    python -m agents.dispatcher --agent geoseo    --task brand_scan

Flags
-----
    --agent   One of: marketing, sales, geoseo
    --task    Task name to execute (agent-specific)
    --help    Show this help text

The dispatcher adds the agent's own directory to sys.path so
that each agent's internal imports resolve without modification.
"""

from __future__ import annotations

import argparse
import importlib
import os
import sys
import textwrap
from pathlib import Path
from typing import NoReturn

# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

# Base directory where agent sub-packages are installed inside the container.
# Matches the COPY destinations in Dockerfile.agents.
_AGENTS_ROOT = Path(__file__).parent  # /app/agents/

AGENT_REGISTRY: dict[str, dict[str, str]] = {
    "marketing": {
        "path": str(_AGENTS_ROOT / "marketing"),
        "description": "AI Marketing Suite — competitive analysis, content, "
                       "conversion, strategy, and technical audits.",
        "default_task": "analyze_page",
        "tasks": "analyze_page, competitor_scan, social_calendar, generate_report",
    },
    "sales": {
        "path": str(_AGENTS_ROOT / "sales"),
        "description": "AI Sales Team — prospect analysis, contact discovery, "
                       "lead scoring, opportunity mapping.",
        "default_task": "analyze_prospect",
        "tasks": "analyze_prospect, find_contacts, score_lead, generate_report",
    },
    "geoseo": {
        "path": str(_AGENTS_ROOT / "geoseo"),
        "description": "Geo-SEO Agent — brand scanning, citability scoring, "
                       "schema generation, AI-visibility audits.",
        "default_task": "brand_scan",
        "tasks": "brand_scan, score_citability, generate_llmstxt, fetch_page, "
                 "generate_report",
    },
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _print_banner() -> None:
    print(
        textwrap.dedent(
            """\
            ╔══════════════════════════════════════════╗
            ║     ASSESSORIA AI Agents — Dispatcher     ║
            ╚══════════════════════════════════════════╝
            """
        )
    )


def _list_agents() -> None:
    _print_banner()
    print("Available agents:\n")
    for name, meta in AGENT_REGISTRY.items():
        print(f"  --agent {name:<12} {meta['description']}")
        print(f"  {'':>16}Tasks: {meta['tasks']}")
        print()
    print(
        "Example:\n"
        "  python -m agents.dispatcher --agent marketing --task analyze_page\n"
        "  python -m agents.dispatcher --agent geoseo    --task brand_scan\n"
    )


def _error(message: str) -> NoReturn:
    print(f"[dispatcher] ERROR: {message}", file=sys.stderr)
    sys.exit(1)


def _resolve_script(agent_name: str, task: str) -> Path:
    """Return the absolute path to the task script, trying common locations."""
    meta = AGENT_REGISTRY[agent_name]
    agent_root = Path(meta["path"])

    # Candidates in order of preference:
    #   1. <agent_root>/scripts/<task>.py
    #   2. <agent_root>/<task>.py
    candidates = [
        agent_root / "scripts" / f"{task}.py",
        agent_root / f"{task}.py",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate

    _error(
        f"Task '{task}' not found for agent '{agent_name}'. "
        f"Searched:\n  " + "\n  ".join(str(c) for c in candidates)
    )


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------


def dispatch(agent_name: str, task: str) -> None:
    """Load and execute a task script from the named agent."""
    if agent_name not in AGENT_REGISTRY:
        _error(
            f"Unknown agent '{agent_name}'. "
            f"Available: {', '.join(AGENT_REGISTRY)}"
        )

    meta = AGENT_REGISTRY[agent_name]
    agent_root = meta["path"]

    # Prepend agent directory so the script's own relative imports work.
    if agent_root not in sys.path:
        sys.path.insert(0, agent_root)

    script_path = _resolve_script(agent_name, task)

    print(
        f"[dispatcher] Running  agent={agent_name!r}  "
        f"task={task!r}  script={script_path}"
    )

    # Execute the script in its own namespace; pass agent metadata via env so
    # scripts can introspect their runtime context without coupling to this
    # dispatcher module.
    os.environ.setdefault("ASSESSORIA_AGENT", agent_name)
    os.environ.setdefault("ASSESSORIA_TASK", task)
    os.environ.setdefault("ASSESSORIA_AGENT_ROOT", agent_root)

    spec = importlib.util.spec_from_file_location(
        f"agents.{agent_name}.{task}", script_path
    )
    if spec is None or spec.loader is None:
        _error(f"Could not load module spec from {script_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)  # type: ignore[union-attr]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m agents.dispatcher",
        description="ASSESSORIA AI Agents — Dispatcher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent(
            """\
            Examples:
              python -m agents.dispatcher
              python -m agents.dispatcher --agent marketing --task analyze_page
              python -m agents.dispatcher --agent sales     --task analyze_prospect
              python -m agents.dispatcher --agent geoseo    --task brand_scan
            """
        ),
    )
    parser.add_argument(
        "--agent",
        choices=list(AGENT_REGISTRY),
        metavar="AGENT",
        help=f"Agent to run. Choices: {', '.join(AGENT_REGISTRY)}",
    )
    parser.add_argument(
        "--task",
        metavar="TASK",
        help="Task (script name without .py) to execute.",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    parser = _build_parser()
    args = parser.parse_args(argv)

    # No arguments — show the help listing.
    if args.agent is None:
        _list_agents()
        sys.exit(0)

    task = args.task or AGENT_REGISTRY[args.agent]["default_task"]
    dispatch(args.agent, task)


if __name__ == "__main__":
    main()
