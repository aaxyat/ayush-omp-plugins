# ayush-omp-plugins

Custom runtime extensions and enhancements for [Oh My Pi](https://omp.sh).

## Included Extensions

### 1. `antigravity-usage` (`src/antigravity-usage.ts`)
- **Below-Prompt Quota Widget:** Displays live Google Antigravity quota and remaining percentage.
- **5% Stepped Gradient:** Smooth, color-coded visual progress gauge ($100\%$ green $\rightarrow 50\%$ amber $\rightarrow 0\%$ red).
- **Active 5s Polling:** Accelerates refresh rate to $5\,\text{s}$ during active generation.
- **Model-Aware:** Automatically displays only when a Gemini model is active.

### 2. `authoritative-agents` (`src/authoritative-agents.ts`)
- **Supreme Root Rule:** Enforces `~/.omp/agent/AGENTS.md` as the supreme source of truth across all sessions.
- **Project Context Support:** Discovers and binds project-level `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`.
- **Dynamic Cross-Directory Traversal:** Automatically discovers and follows directory-level guidelines when operations span multiple projects (e.g. `~/p/a` $\rightarrow$ `~/p/b`).

---

## Installation

Link locally to your Oh My Pi agent:
```bash
omp plugin link /path/to/ayush-omp-plugins
```
Or copy directly into `~/.omp/agent/extensions/`.

---

## License
MIT
