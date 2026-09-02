import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

/**
 * DeepSeek Peak & Off-Peak Rate Monitor
 *
 * Schedule:
 * - Peak: 01:00 - 04:00 & 06:00 - 10:00 UTC (Mon - Fri)
 * - Off-Peak: All other times (50% cheaper rates)
 */
export function getDeepSeekState(now = new Date()): { isPeak: boolean; nextSec: number } {
	const nowMs = now.getTime();
	const utcDay = now.getUTCDay();
	const cMin = now.getUTCHours() * 60 + now.getUTCMinutes();
	const isWeekday = utcDay >= 1 && utcDay <= 5;
	const isPeak = isWeekday && ((cMin >= 60 && cMin < 240) || (cMin >= 360 && cMin < 600));

	let targetMs = nowMs + 60 * 1000;
	for (let m = 1; m <= 7 * 24 * 60; m++) {
		const check = new Date(nowMs + m * 60 * 1000);
		const d = check.getUTCDay();
		const min = check.getUTCHours() * 60 + check.getUTCMinutes();
		const weekday = d >= 1 && d <= 5;
		const peak = weekday && ((min >= 60 && min < 240) || (min >= 360 && min < 600));
		if (peak !== isPeak) {
			check.setUTCSeconds(0, 0);
			targetMs = check.getTime();
			break;
		}
	}
	const nextSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
	return { isPeak, nextSec };
}

export function formatDeepSeekTimer(totalSec: number): string {
	const h = Math.floor(totalSec / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	const sPad = String(s).padStart(2, "0");
	if (h > 0) {
		const mPad = String(m).padStart(2, "0");
		return `${h}h${mPad}m${sPad}s`;
	}
	return `${m}m${sPad}s`;
}

export default function deepseekStatusExtension(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		// Live 1-second status bar timer refresh
		ctx.setInterval(() => {
			ctx.ui.requestRender?.();
		}, 1_000);
	});
}
