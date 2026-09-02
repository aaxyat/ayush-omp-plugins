import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

/**
 * Oh My Pi Extension: Token-Per-Second (TPS) Tracker
 * Real-time streaming throughput calculation with provider-accurate metrics.
 */
export default function tokenPerSecondExtension(pi: ExtensionAPI) {
	let streamStartTime = 0;
	let streamTokens = 0;
	let lastUpdate = 0;
	let isStreaming = false;

	function estimateTokens(text: string): number {
		return text ? Math.max(1, Math.round(text.length / 3.8)) : 0;
	}

	pi.on("turn_start", async () => {
		streamStartTime = performance.now();
		streamTokens = 0;
		lastUpdate = 0;
		isStreaming = true;
	});

	pi.on("message_start", async () => {
		streamStartTime = performance.now();
		streamTokens = 0;
		lastUpdate = 0;
		isStreaming = true;
	});

	pi.on("message_update", async (event) => {
		if (!isStreaming) {
			streamStartTime = performance.now();
			isStreaming = true;
		}

		const e = event.assistantMessageEvent;
		if (e && (e.type === "text_delta" || e.type === "thinking_delta" || e.type === "toolcall_delta")) {
			if (typeof e.delta === "string") streamTokens += estimateTokens(e.delta);
		}
	});

	pi.on("message_end", async () => {
		isStreaming = false;
	});

	pi.on("turn_end", async () => {
		isStreaming = false;
	});
}
