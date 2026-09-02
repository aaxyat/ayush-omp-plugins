import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";
import type { UsageLimit, UsageReport } from "@oh-my-pi/pi-ai";

/**
 * Oh My Pi Extension: Minimal Gemini Quota Widget
 * Shows a compact quota gauge below the prompt only when a Gemini model is selected.
 */
export default function geminiUsageExtension(pi: ExtensionAPI) {
	let activeTimer: ReturnType<typeof globalThis.setInterval> | null = null;

	function isGeminiModel(ctx: ExtensionContext): boolean {
		const model = ctx.model;
		if (!model) return false;
		const id = (model.id ?? "").toLowerCase();
		const name = (model.name ?? "").toLowerCase();
		const provider = (model.provider ?? "").toLowerCase();

		if (id.includes("gemini") || name.includes("gemini")) return true;
		if (provider === "google-antigravity" && !id.includes("claude") && !id.includes("gpt")) {
			return true;
		}
		return false;
	}

	// 5% discrete step gradient (0%, 5%, 10%, ..., 100%)
	function getGradientAnsi(fraction: number): string {
		const clamped = Math.max(0, Math.min(1, fraction));
		const f = Math.round(clamped * 20) / 20;
		const r = f >= 0.5 ? Math.round(255 * (1 - f) * 2) : 235;
		const g = f >= 0.5 ? 220 : Math.round(220 * f * 2);
		return `\x1b[38;2;${r};${g};60m`;
	}

	function formatTimeShort(resetsAtMs: number | undefined): string | null {
		if (!resetsAtMs || typeof resetsAtMs !== "number") return null;
		const diff = resetsAtMs - Date.now();
		if (diff <= 1000) return null;
		const sec = Math.floor(diff / 1000);
		const min = Math.floor(sec / 60);
		const hours = Math.floor(min / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ${hours % 24}h`;
		if (hours > 0) return `${hours}h ${min % 60}m`;
		if (min > 0) return `${min}m`;
		return `${sec}s`;
	}

	function renderBar(fraction: number, width = 10): string {
		const clamped = Math.max(0, Math.min(1, fraction));
		const filled = Math.round(clamped * width);
		const empty = width - filled;
		const color = getGradientAnsi(clamped);
		return `${color}${"█".repeat(filled)}\x1b[90m${"░".repeat(empty)}\x1b[39m`;
	}

	async function updateWidget(ctx: ExtensionContext) {
		if (!ctx.ui.setWidget) return;

		// Only show when Gemini model is selected; otherwise hide
		if (!isGeminiModel(ctx)) {
			ctx.ui.setWidget("gemini-usage", undefined, { placement: "belowEditor" });
			return;
		}

		try {
			const authStorage = ctx.modelRegistry.authStorage;
			if (!authStorage.fetchUsageReports) return;

			const reports = (await authStorage.fetchUsageReports({
				baseUrlResolver: (provider: string) => {
					if (provider === "google-antigravity") return "https://daily-cloudcode-pa.googleapis.com";
					return ctx.modelRegistry.getProviderBaseUrl(provider);
				},
			})) as UsageReport[] | null;

			if (!Array.isArray(reports) || reports.length === 0) return;

			const antigravityReport =
				reports.find(r => r.provider === "google-antigravity") ||
				reports.find(r => r.limits && r.limits.length > 0);

			if (!antigravityReport) return;

			const limits = antigravityReport.limits || [];
			const geminiLimit: UsageLimit | undefined =
				limits.find(
					l =>
						l.window?.id === "5h" ||
						l.id.includes("5h") ||
						l.id.includes("google") ||
						l.label.toLowerCase().includes("google"),
				) ?? limits[0];

			if (!geminiLimit) return;

			const remFrac =
				typeof geminiLimit.amount.remainingFraction === "number"
					? geminiLimit.amount.remainingFraction
					: typeof geminiLimit.amount.usedFraction === "number"
						? 1 - geminiLimit.amount.usedFraction
						: 1;

			const now = Date.now();
			let resetTimestamp = geminiLimit.window?.resetsAt;
			if (!resetTimestamp || resetTimestamp <= now) {
				const futureResets = limits
					.map(l => l.window?.resetsAt)
					.filter((r): r is number => typeof r === "number" && r > now);
				if (futureResets.length > 0) {
					resetTimestamp = Math.min(...futureResets);
				}
			}

			const pct = (remFrac * 100).toFixed(1);
			const color = getGradientAnsi(remFrac);
			const bar = renderBar(remFrac);
			const resetStr = formatTimeShort(resetTimestamp);
			const resetText = resetStr ? ` \x1b[90m(${resetStr})\x1b[39m` : "";

			const line = `\x1b[1;38;5;75mGemini\x1b[39m \x1b[90m·\x1b[39m ${bar} \x1b[1m${color}${pct}%\x1b[39m\x1b[22m${resetText}`;

			ctx.ui.setWidget("gemini-usage", [line], { placement: "belowEditor" });
		} catch {
			// Non-blocking
		}
	}

	function startActivePolling(ctx: ExtensionContext) {
		if (activeTimer) return;
		void updateWidget(ctx);
		activeTimer = setInterval(() => {
			void updateWidget(ctx);
		}, 5_000);
	}

	function stopActivePolling(ctx: ExtensionContext) {
		if (activeTimer) {
			clearInterval(activeTimer);
			activeTimer = null;
		}
		void updateWidget(ctx);
	}

	pi.on("session_start", async (_event, ctx) => {
		void updateWidget(ctx);
		ctx.setInterval(() => {
			if (!activeTimer) void updateWidget(ctx);
		}, 30_000);
		// 1s live timer refresh for status bar countdown
		ctx.setInterval(() => {
			ctx.ui.requestRender?.();
		}, 1_000);
	});

	pi.on("turn_start", async (_event, ctx) => {
		startActivePolling(ctx);
	});

	pi.on("turn_end", async (_event, ctx) => {
		stopActivePolling(ctx);
	});

	pi.on("agent_end", async (_event, ctx) => {
		stopActivePolling(ctx);
	});
}
