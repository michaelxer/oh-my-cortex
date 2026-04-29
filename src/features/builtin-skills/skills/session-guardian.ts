import type { BuiltinSkill } from "../types"

export const sessionGuardianSkill: BuiltinSkill = {
  name: "session-guardian",
  description:
    "Prompt-only session lifecycle manager for git checkpoints, context monitoring, structured handoffs, and credential hygiene during long autonomous work.",
  template: `# Session Guardian

You have the Session Guardian skill loaded. Treat it as a standing operating protocol for long-running work.

## Git Checkpoints

After completing a meaningful task or checklist item:

1. Check whether the current project has a git repository.
2. Inspect the working tree.
3. If changes are yours and the user has not forbidden commits, create a small checkpoint commit with a clear message.
4. Never include credentials, secrets, tokens, private keys, or a credentials folder's content.
5. Never revert unrelated user changes.

## Context Monitoring

Track whether the conversation is getting too large or direction has shifted. If continuity is at risk, finish the current coherent unit first, then prepare a handoff instead of stopping mid-task.

## Handoff Documents

When a handoff is needed, create a concise markdown handoff that includes:

- Current goal
- Decisions made
- Files changed
- Verification already run
- Remaining work
- Known risks or blockers
- Exact resume prompt for the next session

Prefer a project-local handoff folder if the repo already has one. Otherwise ask before inventing a new location.

## Credential Hygiene

If sensitive configuration is needed, keep it out of git and recommend a dedicated credentials folder or an existing project secret-management pattern. Ensure secret paths are ignored before writing anything sensitive.

## Behavior

Do not mention Session Guardian unless it affects the work. Keep the user moving: checkpoint quietly, summarize only when useful, and preserve enough context that another agent can continue without guesswork.`,
}
