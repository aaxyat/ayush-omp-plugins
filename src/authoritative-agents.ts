import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";

/**
 * Oh My Pi Extension: Authoritative AGENTS.md & Multi-Directory Traversal Enforcer
 *
 * Rules:
 * 1. Root OMP (~/.omp/agent/AGENTS.md or ~/.omp/AGENTS.md) is supreme and overrides all.
 * 2. Project context reads AGENTS.md, CLAUDE.md, and GEMINI.md.
 * 3. Follow AGENTS.md wherever operations go (e.g. touching ~/p/b requires reading and adhering to ~/p/b/AGENTS.md).
 * 4. Root AGENTS.md always overrides any project/directory-level clash.
 */
export default function authoritativeAgentsExtension(pi: ExtensionAPI) {
	const home = os.homedir();
	const rootCandidatePaths = [
		path.join(home, ".omp", "agent", "AGENTS.md"),
		path.join(home, ".omp", "AGENTS.md"),
	];

	function getRootAgentsFile(): { path: string; content: string } | null {
		for (const p of rootCandidatePaths) {
			try {
				if (fs.existsSync(p)) {
					const content = fs.readFileSync(p, "utf-8").trim();
					if (content.length > 0) return { path: p, content };
				}
			} catch {
				// Continue
			}
		}
		return null;
	}

	function findDirectoryContextFiles(dir: string): Array<{ path: string; kind: string; content: string }> {
		const rootInfo = getRootAgentsFile();
		const rootNorm = rootInfo ? path.normalize(rootInfo.path).toLowerCase() : "";

		const candidates = [
			{ name: "AGENTS.md", sub: [".omp", "AGENTS.md"], kind: "AGENTS.md" },
			{ name: "CLAUDE.md", sub: [".claude", "CLAUDE.md"], kind: "CLAUDE.md" },
			{ name: "GEMINI.md", sub: [".gemini", "GEMINI.md"], kind: "GEMINI.md" },
			{ name: "agents.md", sub: [".omp", "agents.md"], kind: "AGENTS.md" },
			{ name: "claude.md", sub: [".claude", "claude.md"], kind: "CLAUDE.md" },
			{ name: "gemini.md", sub: [".gemini", "gemini.md"], kind: "GEMINI.md" },
		];

		const results: Array<{ path: string; kind: string; content: string }> = [];
		const seenPaths = new Set<string>();

		let current = path.resolve(dir);
		while (true) {
			for (const c of candidates) {
				const checkPaths = [
					path.join(current, c.name),
					path.join(current, ...c.sub),
				];

				for (const cp of checkPaths) {
					const norm = path.normalize(cp).toLowerCase();
					if (norm === rootNorm || seenPaths.has(norm)) continue;
					try {
						if (fs.existsSync(cp)) {
							const content = fs.readFileSync(cp, "utf-8").trim();
							if (content.length > 0) {
								seenPaths.add(norm);
								results.push({ path: cp, kind: c.kind, content });
							}
						}
					} catch {
						// Continue
					}
				}
			}

			const parent = path.dirname(current);
			if (parent === current || current.toLowerCase() === home.toLowerCase()) {
				break;
			}
			current = parent;
		}

		return results;
	}

	function buildAuthoritativeRules(cwd: string): string {
		const root = getRootAgentsFile();
		const projectFiles = findDirectoryContextFiles(cwd);

		const sections: string[] = [
			"<repo-rules>",
			"AUTHORITATIVE CONTEXT HIERARCHY & CROSS-DIRECTORY TRAVERSAL RULES:",
			"1. ROOT AGENTS.md (~/.omp/agent/AGENTS.md) IS SUPREME. It overrides any project or directory rules if there is a conflict.",
			"2. PROJECT CONTEXT: AGENTS.md, CLAUDE.md, and GEMINI.md are recognized and followed within their project boundaries.",
			"3. DYNAMIC TARGET DIRECTORY RULES: Whenever you access, read, or edit files in another target directory (e.g. ~/p/b while in ~/p/a):",
			"   - You MUST read and follow the AGENTS.md / CLAUDE.md / GEMINI.md in that target directory before performing operations there.",
			"   - Target directory rules govern all operations in that specific directory, subordinated only to Root AGENTS.md.",
			"",
		];

		if (root) {
			sections.push(`<file path="${root.path}" role="root-supreme-override">`);
			sections.push(root.content);
			sections.push("</file>\n");
		}

		for (const pf of projectFiles) {
			sections.push(`<file path="${pf.path}" role="project-context-${pf.kind.toLowerCase()}">`);
			sections.push(pf.content);
			sections.push("</file>\n");
		}

		sections.push("</repo-rules>");
		return sections.join("\n");
	}

	pi.on("before_agent_start", async (event, ctx: ExtensionContext) => {
		const cwd = ctx.cwd || process.cwd();
		const authoritativeRules = buildAuthoritativeRules(cwd);

		const newSystemPrompt = event.systemPrompt.map(block => {
			if (block.includes("<repo-rules>")) {
				return block.replace(/<repo-rules>[\s\S]*?<\/repo-rules>/g, authoritativeRules);
			}
			return block;
		});

		return { systemPrompt: newSystemPrompt };
	});
}
