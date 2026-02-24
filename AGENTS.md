## skills
a skill is a set of local instructions to follow that is stored in a `SKILL.md` file. below is the list of skills that can be used. each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.

### available skills
- unfold-brand-engineering-standards: default standards for unfold frontend and tauri rust work. use for any task in this repository that touches ui components, styling, theme tokens, copy, layout behavior, architecture, backend commands/services, refactors, or docs that affect engineering conventions. enforce token-based styling, allowed brand palette usage, lowercase ui copy, responsive behavior, and production-grade rust practices. (file: /Users/mathangik/.codex/skills/unfold-brand-engineering-standards/SKILL.md)
- skill-creator: guide for creating effective skills. use when users want to create a new skill (or update an existing skill) that extends codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: /Users/mathangik/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: install codex skills into `$CODEX_HOME/skills` from a curated list or a github repo path. use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: /Users/mathangik/.codex/skills/.system/skill-installer/SKILL.md)

### default policy
- always apply `unfold-brand-engineering-standards` by default for every task in this repository unless the user explicitly requests an exception.

### how to use skills
- discovery: the list above is the skills available in this session (name + description + file path). skill bodies live on disk at the listed paths.
- trigger rules: if the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. multiple mentions mean use them all. do not carry skills across turns unless re-mentioned.
- missing/blocked: if a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- how to use a skill (progressive disclosure):
  1) after deciding to use a skill, open its `SKILL.md`. read only enough to follow the workflow.
  2) when `SKILL.md` references relative paths (e.g., `scripts/foo.py`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
  3) if `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  4) if `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  5) if `assets/` or templates exist, reuse them instead of recreating from scratch.
- coordination and sequencing:
  - if multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - announce which skill(s) you're using and why (one short line). if you skip an obvious skill, say why.
- context hygiene:
  - keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - when variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- safety and fallback: if a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
