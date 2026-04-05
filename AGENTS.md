# Karpathy-Inspired Claude Code Guidelines

Refer to these principles to maintain code quality, simplicity, and project consistency for `dcss-tools`.
For project documentation in this repository, start from `docs/meta--catalog.md` and use it as the single source of truth for document names and metadata.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- **State assumptions explicitly** — If uncertain, ask rather than guess.
- **Present multiple interpretations** — Don't pick silently when ambiguity exists.
- **Push back when warranted** — If a simpler approach exists, say so.
- **Stop when confused** — Name what's unclear and ask for clarification.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked; no abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If 200 lines could be 50, rewrite it.
- **The test:** Would a senior engineer say this is overcomplicated? If yes, simplify.

## 3. Surgical Changes & Version Control

**Touch only what you must. Maintain history consistency.**

- **Minimal Impact**: Don't refactor adjacent code or formatting that isn't broken. Match existing style perfectly.
- **Atomic Commits**: Do not bundle multiple features into one commit. Split logical changes into separate, small commits.
- **Commit Consistency**: Check `git log` before committing to follow existing message styles (e.g., prefix, language, tone).
- **Dead Code**: Remove imports/variables/functions that YOUR changes made unused. Don't touch pre-existing dead code unless asked.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

- **Test-First**: Write/reproduce tests before fixing bugs or adding validation.
- **No Browser MCP Verification**: Do not use Playwright or other browsing MCP tools for verification. For UI/layout work, verify by code and local non-browser checks only unless the user explicitly asks otherwise.
- **Plan your steps**: For multi-step tasks, follow this loop:
  1. [Step] → verify: [check]
  2. [Step] → verify: [check]
- **The Insight**: Transform imperative instructions into declarative goals with verification loops.

## 5. Commit Documentation Check

- Before committing code changes, verify that the changes are documented. If they are not, document why the change was made, what was changed, and how it was implemented.
