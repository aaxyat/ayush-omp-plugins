# aaxyat-omp

Custom runtime extensions and status bar enhancements for [Oh My Pi](https://omp.sh).

## Quick Install

Install directly via the Oh My Pi plugin manager:

```bash
omp plugin install aaxyat-omp
```

Or link locally for development:

```bash
omp plugin link /path/to/ayush-omp-plugins
```

---

## Included Extensions & Plugins

### 1. `antigravity-usage` (`src/antigravity-usage.ts`)
- **Below-Prompt Quota Widget:** Displays live Google Antigravity quota and remaining percentage.
- **5% Stepped Gradient:** Smooth, color-coded visual progress gauge ($100\%$ green $\rightarrow 50\%$ amber $\rightarrow 0\%$ red).
- **Active 5s Polling:** Accelerates refresh rate to $5\,\text{s}$ during active generation.
- **Model-Aware:** Automatically displays only when a Gemini model is active.

### 2. `authoritative-agents` (`src/authoritative-agents.ts`)
- **Supreme Root Rule:** Enforces `~/.omp/agent/AGENTS.md` as the supreme source of truth across all sessions.
- **Project Context Support:** Discovers and binds project-level `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`.
- **Dynamic Cross-Directory Traversal:** Automatically discovers and follows directory-level guidelines when operations span multiple projects (e.g. `~/p/a` $\rightarrow$ `~/p/b`).

### 3. `deepseek-status` (`src/deepseek-status.ts`)
- **Peak / Off-Peak Rate Monitor:** Real-time state tracker for DeepSeek API discount periods (Peak: 01:00–04:00 & 06:00–10:00 UTC Mon–Fri; Off-Peak: 50% discount).
- **Status Indicator:** Soft red dot for peak hours, green dot for off-peak.
- **Countdown Timer:** Live second-by-second countdown to the next price transition.

### 4. `token-per-second` (`src/token-per-second.ts`)
- **Real-Time Throughput Tracker:** Computes streaming tokens per second (tps) and reports generation speed adjacent to the cost indicator.

---

## Status Bar Configuration

Add the custom segments to your `~/.omp/agent/config.yml`:

```yaml
statusLine:
  preset: custom
  leftSegments:
    - pi
    - model
    - mode
    - collab
    - path
    - git
    - pr
    - cost
    - token_rate
    - deepseek
    - context_pct
  rightSegments:
    - session_name
```

---

## License
MIT
