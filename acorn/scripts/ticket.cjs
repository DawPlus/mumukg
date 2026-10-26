#!/usr/bin/env node
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { parseBoard, boardValue, updateBoardTicket } = require("./board.cjs");

const GATES = {
	"code-review": { field: "code_review", role: "code-reviewer", state: "review" },
	security: { field: "security_review", role: "security-reviewer", state: "review" },
	e2e: { field: "e2e", role: "e2e-runner", state: "review" },
	docs: { field: "docs", role: "reporter", state: "docs" },
};

function parseFrontmatter(content) {
	const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!block) return null;
	return Object.fromEntries(
		block[1].split(/\r?\n/).flatMap((line) => {
			const match = line.match(/^([a-z][a-z0-9_]*):\s*(.*?)\s*$/);
			return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, "")]] : [];
		}),
	);
}

// The parser only understands single-line `key: value`. Report anything it would silently drop.
function frontmatterIssues(content) {
	const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!block) return [];
	return block[1].split(/\r?\n/).flatMap((line, index) => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) return [];
		if (/^([a-z][a-z0-9_]*):\s*(.*?)\s*$/.test(line) && !/:\s*[|>][-+]?\s*$/.test(line)) return [];
		return [`frontmatter line ${index + 2} is not single-line lowercase \`key: value\`: ${trimmed}`];
	});
}

function renderYamlValue(value) {
	if (value === null || value === undefined) return "null";
	const text = String(value);
	return /[:#{}[\],&*?!<>=!%@`]/.test(text) || /\s/.test(text) ? JSON.stringify(text) : text;
}

function setFrontmatter(content, updates) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
	if (!match) throw new Error("ticket body missing YAML frontmatter");
	const lines = match[1].split(/\r?\n/);
	const keys = new Set(Object.keys(updates || {}));
	const next = lines.map((line) => {
		const field = line.match(/^([a-z][a-z0-9_]*):/);
		if (!field || !keys.has(field[1])) return line;
		keys.delete(field[1]);
		return `${field[1]}: ${renderYamlValue(updates[field[1]])}`;
	});
	for (const key of keys) next.push(`${key}: ${renderYamlValue(updates[key])}`);
	return `---\n${next.join("\n")}\n---${match[2]}${content.slice(match[0].length)}`;
}

function nextAfterGate(gates, gateName) {
	const index = gates.indexOf(gateName);
	if (index < 0) return null;
	const pending = gates.slice(index + 1).find((gate) => GATES[gate]);
	return pending ? GATES[pending] : null;
}

function parseGates(value) {
	return typeof value === "string"
		? value.split(",").map((gate) => gate.trim()).filter(Boolean)
		: [];
}

function validateGateContract(metadata, requirePassed = false) {
	const errors = [];
	const gates = parseGates(metadata.gates);
	if (!gates.length || gates.at(-1) !== "docs") errors.push("gates must end with docs");
	if (new Set(gates).size !== gates.length) errors.push("gates must not contain duplicates");
	for (const gate of gates) {
		const definition = GATES[gate];
		if (!definition) {
			errors.push(`unknown gate: ${gate}`);
			continue;
		}
		const receipt = metadata[definition.field];
		if (!["pending", "passed", "failed"].includes(receipt)) {
			errors.push(`${definition.field} must be pending, passed, or failed`);
		} else if (requirePassed && receipt !== "passed") {
			errors.push(`${definition.field} must be passed`);
		}
	}
	return { gates, errors };
}

function validateTicketTransition(metadata, { state, next, role = "worker" }) {
	const contract = validateGateContract(metadata);
	const errors = [...contract.errors];
	if (state === "blocked") {
		if (next.toLowerCase() !== "human") errors.push("blocked ticket Next must be human");
		return errors;
	}
	if (metadata.verification !== "passed") {
		if (["ready", "in_progress"].includes(state) && next !== role)
			errors.push(`Next must be ${role} before verification passes`);
		return errors;
	}
	const pending = contract.gates.find(
		(gate) => GATES[gate] && metadata[GATES[gate].field] !== "passed",
	);
	if (!pending) return errors;
	const definition = GATES[pending];
	const failedReceipt = metadata[definition.field] === "failed";
	const expectedNext = failedReceipt ? role : definition.role;
	const expectedState = failedReceipt ? "in_progress" : definition.state;
	const nextMatches =
		(pending === "docs" && next === "doc-updater") || next === expectedNext;
	if (!nextMatches) errors.push(`Next must be ${expectedNext} for ${pending}`);
	if (state !== expectedState) errors.push(`State must be ${expectedState} for ${pending}`);
	return errors;
}

function loadConfig() {
	const configPath = path.join(process.cwd(), "acorn", "config.json");
	if (!fs.existsSync(configPath)) throw new Error("Missing acorn/config.json");
	return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

const lockPath = () => path.join(process.cwd(), "acorn", ".ticket.lock");
const transactionPath = () => path.join(process.cwd(), "acorn", ".ticket-transaction.json");
const recoveryPath = () => path.join(process.cwd(), "acorn", ".ticket-recovery");

function atomicWrite(file, content) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const temporary = `${file}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
	try {
		fs.writeFileSync(temporary, content);
		fs.renameSync(temporary, file);
	} finally {
		if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
	}
}

function transactionFiles(paths) {
	return [...new Set(paths.map((file) => path.resolve(file)))].map((file) => {
		if (file !== process.cwd() && !file.startsWith(process.cwd() + path.sep)) {
			throw new Error(`ticket path is outside project: ${file}`);
		}
		return {
			path: path.relative(process.cwd(), file),
			content: fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null,
		};
	});
}

function restoreTransaction(journal) {
	if (journal?.version !== 1 || !Array.isArray(journal.files)) {
		throw new Error("Invalid pending ticket transaction");
	}
	for (const entry of journal.files) {
		const file = path.resolve(process.cwd(), String(entry.path || ""));
		if (file !== process.cwd() && !file.startsWith(process.cwd() + path.sep)) {
			throw new Error(`pending transaction path is outside project: ${file}`);
		}
		if (entry.content === null) fs.rmSync(file, { force: true });
		else if (typeof entry.content === "string") atomicWrite(file, entry.content);
		else throw new Error(`Invalid pending transaction entry: ${file}`);
	}
}

function recoverPendingTransaction() {
	const file = transactionPath();
	if (!fs.existsSync(file)) return;
	let journal;
	try {
		journal = JSON.parse(fs.readFileSync(file, "utf8"));
	} catch {
		throw new Error("Invalid pending ticket transaction");
	}
	restoreTransaction(journal);
	fs.rmSync(file, { force: true });
	console.error("Recovered interrupted ticket transaction");
}

function runTransaction(paths, mutate) {
	const file = transactionPath();
	const journal = { version: 1, files: transactionFiles(paths) };
	atomicWrite(file, JSON.stringify(journal));
	try {
		const result = mutate();
		fs.rmSync(file, { force: true });
		return result;
	} catch (error) {
		restoreTransaction(journal);
		fs.rmSync(file, { force: true });
		throw error;
	}
}

function processExists(pid) {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return error.code === "EPERM";
	}
}

function withTicketLock(run) {
	const file = lockPath();
	fs.mkdirSync(path.dirname(file), { recursive: true });
	if (fs.existsSync(recoveryPath())) throw new Error("ticket recovery is in progress");
	const token = `${process.pid}.${crypto.randomBytes(12).toString("hex")}.json`;
	let ownerFile;
	const wait = new Int32Array(new SharedArrayBuffer(4));
	// Completion can run two 60s checks while holding the rollback boundary.
	const deadline = Date.now() + 180000;
	while (Date.now() < deadline) {
		try {
			fs.mkdirSync(file);
			ownerFile = path.join(file, token);
			atomicWrite(ownerFile, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
			break;
		} catch (error) {
			if (error.code !== "EEXIST") throw error;
			const stat = fs.lstatSync(file, { throwIfNoEntry: false });
			if (!stat) continue;
			let owner;
			try {
				const ownerPath = stat.isDirectory()
					? path.join(file, fs.readdirSync(file).find((name) => name.endsWith(".json")) || "")
					: file;
				owner = JSON.parse(fs.readFileSync(ownerPath, "utf8"));
			} catch {}
			const lockAge = Date.now() - (fs.statSync(file, { throwIfNoEntry: false })?.mtimeMs || 0);
			const incompleteAndFresh = !Number.isInteger(owner?.pid) && lockAge < 1000;
			if (incompleteAndFresh || processExists(owner?.pid)) {
				Atomics.wait(wait, 0, 0, 25);
			} else {
				throw new Error("stale ticket lock: run node acorn/scripts/ticket.cjs recover, then retry");
			}
		}
	}
	if (!ownerFile) throw new Error("ticket operation lock timed out after 180s; inspect the running ticket operation before retrying");
	try {
		if (fs.existsSync(recoveryPath())) throw new Error("ticket recovery is in progress");
		recoverPendingTransaction();
		return run();
	} finally {
		fs.rmSync(ownerFile, { force: true });
		try {
			fs.rmdirSync(file);
		} catch (error) {
			if (!["ENOENT", "ENOTEMPTY"].includes(error.code)) throw error;
		}
	}
}

function ticketRecover({ force = false } = {}) {
	const gate = recoveryPath();
	const token = `${process.pid}.${crypto.randomBytes(12).toString("hex")}.json`;
	let ownerFile;
	try {
		fs.mkdirSync(gate);
		ownerFile = path.join(gate, token);
		atomicWrite(ownerFile, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
		{
			const entries = fs.readdirSync(gate).filter((name) => name.endsWith(".json"));
			const owners = entries.map((entry) => {
				try {
					return { entry, ...JSON.parse(fs.readFileSync(path.join(gate, entry), "utf8")) };
				} catch {
					return { entry };
				}
			});
			const liveOwner = owners.find((owner) => processExists(owner.pid));
			if (liveOwner) throw new Error(`ticket recovery is already in progress (pid ${liveOwner.pid})`);
			const gateAge = Date.now() - (fs.statSync(gate, { throwIfNoEntry: false })?.mtimeMs || 0);
			if (!owners.length && gateAge < 1000) throw new Error("ticket recovery is already in progress");
			if (!force) {
				throw new Error("stale ticket recovery gate: confirm no recovery is running, then run node acorn/scripts/ticket.cjs recover --force");
			}
			ownerFile = path.join(gate, token);
			atomicWrite(ownerFile, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
			const competingOwner = fs.readdirSync(gate)
				.filter((entry) => entry.endsWith(".json") && entry !== token)
				.map((entry) => {
					try {
						return JSON.parse(fs.readFileSync(path.join(gate, entry), "utf8"));
					} catch {
						return null;
					}
				})
				.find((owner) => processExists(owner?.pid));
			if (competingOwner) {
				fs.rmSync(ownerFile, { force: true });
				ownerFile = undefined;
				throw new Error(`ticket recovery is already in progress (pid ${competingOwner.pid})`);
			}
			for (const owner of owners) fs.rmSync(path.join(gate, owner.entry), { force: true });
		}
	}
	try {
		const lock = lockPath();
		if (fs.existsSync(lock)) {
			let owner;
			try {
				const entry = fs.lstatSync(lock).isDirectory()
					? fs.readdirSync(lock).find((name) => name.endsWith(".json"))
					: null;
				owner = JSON.parse(fs.readFileSync(entry ? path.join(lock, entry) : lock, "utf8"));
			} catch {}
			if (processExists(owner?.pid)) {
				throw new Error(`ticket operation still running (pid ${owner.pid})`);
			}
			fs.rmSync(lock, { recursive: true, force: true });
		}
		recoverPendingTransaction();
		console.log("recovered stale ticket operation");
	} finally {
		fs.rmSync(ownerFile, { force: true });
		try {
			fs.rmdirSync(gate);
		} catch (error) {
			if (!["ENOENT", "ENOTEMPTY"].includes(error.code)) throw error;
		}
	}
}

function isoNow(date = new Date()) {
	const offsetMin = -date.getTimezoneOffset();
	const sign = offsetMin >= 0 ? "+" : "-";
	const abs = Math.abs(offsetMin);
	const hh = String(Math.floor(abs / 60)).padStart(2, "0");
	const mm = String(abs % 60).padStart(2, "0");
	const local = new Date(date.getTime() + offsetMin * 60_000);
	const y = local.getUTCFullYear();
	const mo = String(local.getUTCMonth() + 1).padStart(2, "0");
	const d = String(local.getUTCDate()).padStart(2, "0");
	const h = String(local.getUTCHours()).padStart(2, "0");
	const mi = String(local.getUTCMinutes()).padStart(2, "0");
	const s = String(local.getUTCSeconds()).padStart(2, "0");
	return `${y}-${mo}-${d}T${h}:${mi}:${s}${sign}${hh}:${mm}`;
}

function gateStateKey(field) {
	if (field === "code_review") return "codeReview";
	if (field === "security_review") return "securityReview";
	return field;
}

function ticketBodyPath(config, boardPath, board, row, ticketId) {
	const linked = boardValue(board, row, "Body") || boardValue(board, row, "Links");
	const target = linked?.match(/\]\(\s*<?([^>\s)]+)>?/)?.[1]?.split(/[?#]/)[0];
	if (target && !/^[a-z][a-z0-9+.-]*:/i.test(target))
		return path.resolve(path.dirname(boardPath), target);
	const pattern = config.ticketBodyPath || "docs/tickets/active/{ID}.md";
	if (!pattern.includes("{ID}")) throw new Error("ticketBodyPath must include {ID}");
	return path.resolve(pattern.replace("{ID}", ticketId));
}

function syncState(config, ticketId, { state, next, metadata }, { clear = false } = {}) {
	const statePath = path.join(process.cwd(), "acorn", "state.json");
	const current = fs.existsSync(statePath)
		? JSON.parse(fs.readFileSync(statePath, "utf8"))
		: { version: 2 };
	if (clear) {
		const cleared = {
			...current,
			version: 2,
			activeTicket: null,
			classification: null,
			phase: null,
			next: null,
			verification: "pending",
			gates: {
				codeReview: "pending",
				securityReview: "n/a",
				e2e: "n/a",
				docs: "pending",
			},
			updatedAt: isoNow(),
		};
		atomicWrite(statePath, JSON.stringify(cleared, null, "\t") + "\n");
		return;
	}
	const gates = {};
	for (const [name, definition] of Object.entries(GATES)) {
		const declared = parseGates(metadata.gates || "").includes(name);
		gates[gateStateKey(definition.field)] = declared
			? metadata[definition.field] || "pending"
			: "n/a";
	}
	const phase =
		state === "docs"
			? "report"
			: state === "review"
				? "verify"
				: state === "done"
					? "done"
					: state === "ready"
						? "plan"
						: "build";
	atomicWrite(
		statePath,
		JSON.stringify(
			{
				...current,
				version: 2,
				activeTicket: ticketId,
				classification: current.classification || "feature",
				phase,
				next,
				verification: metadata.verification || "pending",
				gates,
				updatedAt: isoNow(),
			},
			null,
			"\t",
		) + "\n",
	);
}

function shellQuote(value) {
	const text = String(value);
	if (process.platform === "win32") return /[\s"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
	return /[^A-Za-z0-9_\/:=+-]/.test(text) ? `'${text.replaceAll("'", `'\\''`)}'` : text;
}

function runCheck(command, args = [], options = {}) {
	const timeout = options.timeout !== undefined ? options.timeout : 60000;
	let result;
	if (Array.isArray(command)) {
		if (!command.length) throw new Error("command array is empty");
		result = spawnSync(command[0], [...command.slice(1), ...args], {
			cwd: process.cwd(),
			stdio: ["ignore", "inherit", "inherit"],
			timeout,
		});
	} else {
		const full = [String(command), ...args.map(shellQuote)].filter(Boolean).join(" ");
		result = spawnSync(full, {
			cwd: process.cwd(),
			stdio: ["ignore", "inherit", "inherit"],
			shell: true,
			timeout,
		});
	}
	const label = Array.isArray(command) ? command.join(" ") : String(command);
	if (result.error && (result.error.code === "ETIMEDOUT" || result.signal === "SIGTERM")) {
		throw new Error(`command timed out after ${timeout}ms: ${label}`);
	}
	if (result.error) throw new Error(`cannot run command: ${label}: ${result.error.message}`);
	if (result.status !== 0) throw new Error(`command failed: ${label} ${args.join(" ")}`);
}

function validationCommands(config) {
	return Array.isArray(config.validationCommands)
		? config.validationCommands.filter((command) => (Array.isArray(command) ? command.length : String(command).trim()))
		: [];
}

function commandLabel(commands) {
	return commands.map((command) => (Array.isArray(command) ? command.join(" ") : String(command))).join("; ");
}

function git(args, { optional = false } = {}) {
	const result = spawnSync("git", args, {
		cwd: process.cwd(),
		maxBuffer: 512 * 1024 * 1024,
		timeout: 60000,
	});
	if (!result.error && result.status === 0) return result.stdout;
	if (optional && !result.error) return null;
	throw new Error(`cannot fingerprint workspace: git ${args[0]} failed (${result.error?.code || result.status}); verification receipt cannot be reused`);
}

// Tested input identity: HEAD + tracked diff + untracked files, excluding ticket records/caches
// that transitions themselves rewrite. Returns null outside Git (freshness cannot be proven).
function workspaceFingerprint(config) {
	if (git(["rev-parse", "--is-inside-work-tree"], { optional: true })?.toString().trim() !== "true") return null;
	const activeDir = path.dirname((config.ticketBodyPath || "docs/tickets/active/{ID}.md").replace("{ID}", "x"));
	const excludes = [
		config.ticketBoardPath || "docs/tickets/board.md",
		activeDir,
		config.ticketArchivePath || "docs/tickets/archive",
		"acorn/state.json",
		"acorn/.ticket.lock",
		"acorn/.ticket-transaction.json",
		"acorn/.ticket-recovery",
		"handoff.md",
	].map((entry) => `:(exclude)${String(entry).replaceAll("\\", "/")}`);
	const spec = ["--", ".", ...excludes];
	const head = git(["rev-parse", "--short=12", "HEAD"], { optional: true })?.toString().trim();
	const hash = crypto.createHash("sha256");
	if (head) hash.update(git(["diff", "--binary", "HEAD", ...spec]));
	else {
		hash.update(git(["diff", "--binary", "--cached", ...spec]));
		hash.update(git(["diff", "--binary", ...spec]));
	}
	const untracked = git(["ls-files", "--others", "--exclude-standard", "-z", ...spec])
		.toString()
		.split("\0")
		.filter(Boolean)
		.sort();
	const maxInputFiles = nonNegativeInteger(
		config.verificationInputMaxFiles ?? 10000,
		"verificationInputMaxFiles",
	);
	const maxInputBytes = nonNegativeInteger(
		config.verificationInputMaxBytes ?? 256 * 1024 * 1024,
		"verificationInputMaxBytes",
	);
	let inputFiles = 0;
	let inputBytes = 0;
	const hashInputFile = (file) => {
		inputFiles += 1;
		if (inputFiles > maxInputFiles) {
			throw new Error(`verification inputs exceed ${maxInputFiles} files`);
		}
		const fd = fs.openSync(file, "r");
		const buffer = Buffer.allocUnsafe(64 * 1024);
		try {
			for (let bytes = fs.readSync(fd, buffer, 0, buffer.length, null); bytes; bytes = fs.readSync(fd, buffer, 0, buffer.length, null)) {
				inputBytes += bytes;
				if (inputBytes > maxInputBytes) {
					throw new Error(`verification inputs exceed ${maxInputBytes} bytes`);
				}
				hash.update(buffer.subarray(0, bytes));
			}
		} finally {
			fs.closeSync(fd);
		}
	};
	const addConfiguredInput = (target, label) => {
		const stat = fs.lstatSync(target, { throwIfNoEntry: false });
		hash.update(`\0input:${label}\0${stat ? stat.isDirectory() ? "dir" : stat.isSymbolicLink() ? "link" : "file" : "missing"}`);
		if (!stat) return;
		if (stat.isSymbolicLink()) {
			throw new Error(`verification input must not be a symbolic link: ${label}`);
		}
		if (stat.isDirectory()) {
			for (const name of fs.readdirSync(target).sort()) {
				addConfiguredInput(path.join(target, name), `${label}/${name}`);
			}
			return;
		}
		if (!stat.isFile()) throw new Error(`verification input must be a regular file: ${label}`);
		hashInputFile(target);
	};
	for (const file of untracked) {
		hash.update(`\0${file}\0`);
		const stat = fs.lstatSync(file);
		if (stat.isSymbolicLink()) hash.update(fs.readlinkSync(file));
		else if (stat.isFile()) hashInputFile(file);
		else throw new Error(`verification input must be a regular file: ${file}`);
	}
	for (const input of config.verificationInputPaths || []) {
		if (typeof input !== "string" || !input.trim()) throw new Error("verificationInputPaths must contain non-empty paths");
		const target = path.resolve(input);
		if (target !== process.cwd() && !target.startsWith(process.cwd() + path.sep)) {
			throw new Error(`verification input is outside project: ${input}`);
		}
		addConfiguredInput(target, input.replaceAll("\\", "/"));
	}
	return `git:${head || "no-commit"}:${hash.digest("hex").slice(0, 12)}`;
}

function runValidation(config, commands, input = workspaceFingerprint(config)) {
	const timeout =
		typeof config.validationTimeoutMs === "number" && config.validationTimeoutMs > 0
			? config.validationTimeoutMs
			: 60000;
	for (const command of commands) runCheck(command, [], { timeout });
	const current = workspaceFingerprint(config);
	if (input && current !== input) {
		throw new Error("workspace changed during validation; rerun verification");
	}
	return {
		verified_at: isoNow(),
		verified_input: current || "no-git",
		verified_commands: commandLabel(commands),
	};
}

// Evidence for verification PASS. Never trusts a bare `passed`: commands run here, or a
// receipt is reused only when its tested input still matches the working tree.
function verificationEvidence(config, ctx, ticketId, manual) {
	if (manual !== undefined) {
		return {
			verified_at: isoNow(),
			verified_input: workspaceFingerprint(config) || "no-git",
			verified_commands: `manual: ${manual}`,
		};
	}
	const commands = validationCommands(config);
	if (!commands.length) return {};
	const input = workspaceFingerprint(config);
	if (
		input &&
		ctx.metadata.verified_input === input &&
		ctx.metadata.verified_commands === commandLabel(commands)
	) {
		console.log(`ticket ${ticketId}: reuse fresh verification receipt (${input})`);
		return {};
	}
	return runValidation(config, commands, input);
}

function loadTicket(config, ticketId) {
	const boardRel = config.ticketBoardPath || "docs/tickets/board.md";
	const boardPath = path.join(process.cwd(), boardRel);
	if (!fs.existsSync(boardPath)) throw new Error(`Missing BOARD: ${boardRel}`);
	const boardContent = fs.readFileSync(boardPath, "utf8");
	const board = parseBoard(boardContent);
	const row = board.rows.find((entry) => boardValue(board, entry, "Ticket") === ticketId);
	if (!row) throw new Error(`BOARD row not found: ${ticketId}`);
	const bodyPath = ticketBodyPath(config, boardPath, board, row, ticketId);
	if (!fs.existsSync(bodyPath)) throw new Error(`Missing ticket body: ${bodyPath}`);
	const bodyContent = fs.readFileSync(bodyPath, "utf8");
	const metadata = parseFrontmatter(bodyContent);
	if (!metadata) throw new Error(`Invalid ticket frontmatter: ${ticketId}`);
	if (metadata.id && metadata.id !== ticketId)
		throw new Error(`ticket body id ${metadata.id} does not match ${ticketId}`);
	const statePath = path.join(process.cwd(), "acorn", "state.json");
	return {
		boardRel,
		boardPath,
		boardContent,
		board,
		row,
		bodyPath,
		bodyContent,
		metadata,
		statePath,
		stateContent: fs.existsSync(statePath) ? fs.readFileSync(statePath, "utf8") : null,
	};
}

function writeTicket(config, ticketId, ctx, { boardUpdates, bodyUpdates, clearState = false }) {
	let bodyContent = ctx.bodyContent;
	if (bodyUpdates && Object.keys(bodyUpdates).length) {
		bodyUpdates.updated_at = isoNow();
		bodyContent = setFrontmatter(bodyContent, bodyUpdates);
	}
	const metadata = parseFrontmatter(bodyContent);
	let boardContent = ctx.boardContent;
	let state = boardUpdates?.State || boardValue(ctx.board, ctx.row, "State");
	let next = boardUpdates?.Next || boardValue(ctx.board, ctx.row, "Next");
	if (boardUpdates && Object.keys(boardUpdates).length) {
		const boardResult = updateBoardTicket(ctx.boardContent, ticketId, boardUpdates);
		if (!boardResult) throw new Error(`failed to update BOARD row: ${ticketId}`);
		boardContent = boardResult.content.endsWith("\n")
			? boardResult.content
			: `${boardResult.content}\n`;
		state = boardUpdates.State || state;
		next = boardUpdates.Next || next;
	}
	if (!clearState) {
		const errors = validateTicketTransition(metadata, {
			state,
			next,
			role: boardValue(ctx.board, ctx.row, "Role") || "worker",
		});
		if (errors.length) throw new Error(`${ticketId}: ${errors.join("; ")}`);
	}

	runTransaction([ctx.bodyPath, ctx.boardPath, ctx.statePath], () => {
		atomicWrite(ctx.bodyPath, bodyContent);
		atomicWrite(ctx.boardPath, boardContent);
		syncState(config, ticketId, { state, next, metadata }, { clear: clearState });
		runCheck(
			config.docsConsistencyCommand || "node acorn/scripts/check-docs-consistency.cjs",
			clearState ? [] : ["--ticket", ticketId],
		);
	});
	console.log(`ticket ${ticketId}: State=${clearState ? "done" : state} Next=${clearState ? "-" : next}`);
}

function resolvePassTarget(metadata, requested) {
	const gates = parseGates(metadata.gates || "");
	if (requested === "verification") return { kind: "verification" };
	if (!requested) {
		if (metadata.verification === "passed") {
			throw new Error("pass requires an explicit gate name after verification has passed");
		}
		return { kind: "verification" };
	}
	if (!GATES[requested]) throw new Error(`unknown gate: ${requested}`);
	if (!gates.includes(requested)) throw new Error(`gate not declared on ticket: ${requested}`);
	return { kind: "gate", gate: requested, definition: GATES[requested] };
}

function nonNegativeInteger(value, name) {
	const number = typeof value === "number"
		? value
		: /^\d+$/.test(String(value))
			? Number(value)
			: Number.NaN;
	if (!Number.isSafeInteger(number) || number < 0) {
		throw new Error(`${name} must be a non-negative integer`);
	}
	return number;
}

function repairBudget(config, metadata) {
	const repairs = nonNegativeInteger(
		metadata.repairs_used === undefined ? 0 : metadata.repairs_used,
		"repairs_used",
	);
	const defaultLimit = nonNegativeInteger(
		config.workflow?.maxAgentRetries ?? 1,
		"workflow.maxAgentRetries",
	);
	const limit = metadata.repair_limit === undefined
		? defaultLimit
		: nonNegativeInteger(metadata.repair_limit, "repair_limit");
	return { repairs, limit };
}

function currentBoardState(ctx) {
	return boardValue(ctx.board, ctx.row, "State");
}

function assertNotBlocked(ctx, action) {
	if (currentBoardState(ctx) === "blocked" || ctx.metadata.state === "blocked") {
		throw new Error(`ticket is blocked; use resume before ${action}`);
	}
}

function assertRepairBudget(config, metadata) {
	const { repairs, limit } = repairBudget(config, metadata);
	if (repairs > limit) {
		throw new Error(
			`repair budget exhausted (${repairs}/${limit}); raise repair_limit then resume`,
		);
	}
}

function assertTicketUnchanged(before, current) {
	if (
		before.bodyPath !== current.bodyPath ||
		before.bodyContent !== current.bodyContent ||
		JSON.stringify(before.row) !== JSON.stringify(current.row)
	) {
		throw new Error("ticket changed during validation; rerun verification");
	}
}

function ticketStart(config, ticketId) {
	const ctx = loadTicket(config, ticketId);
	assertNotBlocked(ctx, "start");
	assertRepairBudget(config, ctx.metadata);
	const state = currentBoardState(ctx);
	if (state !== "ready") throw new Error(`start requires BOARD State=ready (got ${state})`);
	const role = boardValue(ctx.board, ctx.row, "Role") || "worker";
	writeTicket(config, ticketId, ctx, {
		boardUpdates: { State: "in_progress", Next: role },
		bodyUpdates: { state: "in_progress" },
	});
}

function ticketBlock(config, ticketId) {
	const ctx = loadTicket(config, ticketId);
	writeTicket(config, ticketId, ctx, {
		boardUpdates: { State: "blocked", Next: "human" },
		bodyUpdates: { state: "blocked" },
	});
}

function ticketResume(config, ticketId) {
	const ctx = loadTicket(config, ticketId);
	const state = currentBoardState(ctx);
	if (state !== "blocked" && ctx.metadata.state !== "blocked") {
		throw new Error(`resume requires blocked ticket (got ${state})`);
	}
	const { repairs, limit } = repairBudget(config, ctx.metadata);
	if (repairs > limit) {
		throw new Error(
			`repair budget still exhausted (${repairs}/${limit}); raise repair_limit before resume`,
		);
	}
	const role = boardValue(ctx.board, ctx.row, "Role") || "worker";
	writeTicket(config, ticketId, ctx, {
		boardUpdates: { State: "in_progress", Next: role },
		bodyUpdates: { state: "in_progress" },
	});
}

function ticketPass(config, ticketId, targetName, { manual, evidence } = {}) {
	const ctx = loadTicket(config, ticketId);
	assertNotBlocked(ctx, "pass");
	assertRepairBudget(config, ctx.metadata);
	const target = resolvePassTarget(ctx.metadata, targetName);
	const gates = parseGates(ctx.metadata.gates || "");
	if (manual !== undefined && target.kind !== "verification") {
		throw new Error("--manual is only valid for verification");
	}
	if (target.kind === "verification") {
		const state = currentBoardState(ctx);
		if (state !== "in_progress" && ctx.metadata.state !== "in_progress") {
			throw new Error(`verification pass requires State=in_progress (got ${state})`);
		}
		const bodyUpdates = {
			verification: "passed",
			...(evidence === undefined
				? verificationEvidence(config, ctx, ticketId, manual)
				: evidence),
		};
		for (const gate of gates) {
			const definition = GATES[gate];
			if (definition && ctx.metadata[definition.field] === "failed") {
				bodyUpdates[definition.field] = "pending";
			}
		}
		const first = gates.find((name) => {
			const definition = GATES[name];
			if (!definition) return false;
			const receipt = Object.hasOwn(bodyUpdates, definition.field)
				? bodyUpdates[definition.field]
				: ctx.metadata[definition.field];
			return receipt !== "passed";
		});
		if (!first) throw new Error("ticket has no gates to route after verification");
		const definition = GATES[first];
		writeTicket(config, ticketId, ctx, {
			boardUpdates: { State: definition.state, Next: definition.role },
			bodyUpdates: { ...bodyUpdates, state: definition.state },
		});
		return;
	}
	if (ctx.metadata.verification !== "passed")
		throw new Error("verification must be passed before gate receipts");
	const following = nextAfterGate(gates, target.gate);
	const boardUpdates = {
		State: following ? following.state : "docs",
		Next: following ? following.role : "reporter",
	};
	writeTicket(config, ticketId, ctx, {
		boardUpdates,
		bodyUpdates: {
			state: boardUpdates.State,
			[target.definition.field]: "passed",
		},
	});
}

function ticketPassVerification(config, ticketId, targetName, { manual } = {}) {
	const before = withTicketLock(() => {
		const ctx = loadTicket(config, ticketId);
		assertNotBlocked(ctx, "pass");
		assertRepairBudget(config, ctx.metadata);
		const target = resolvePassTarget(ctx.metadata, targetName);
		if (target.kind !== "verification") throw new Error("expected verification target");
		const state = currentBoardState(ctx);
		if (state !== "in_progress" && ctx.metadata.state !== "in_progress") {
			throw new Error(`verification pass requires State=in_progress (got ${state})`);
		}
		return ctx;
	});
	const evidence = verificationEvidence(config, before, ticketId, manual);
	return withTicketLock(() => {
		const current = loadTicket(config, ticketId);
		assertTicketUnchanged(before, current);
		return ticketPass(config, ticketId, targetName, { manual, evidence });
	});
}

function ticketFail(config, ticketId, targetName) {
	const ctx = loadTicket(config, ticketId);
	assertNotBlocked(ctx, "fail");
	const role = boardValue(ctx.board, ctx.row, "Role") || "worker";
	const budget = repairBudget(config, ctx.metadata);
	const repairs = budget.repairs + 1;
	const exhausted = repairs > budget.limit;
	const boardUpdates = exhausted
		? { State: "blocked", Next: "human" }
		: { State: "in_progress", Next: role };
	const bodyUpdates = {
		state: boardUpdates.State,
		repairs_used: repairs,
	};
	if (!targetName || targetName === "verification") bodyUpdates.verification = "failed";
	else {
		const definition = GATES[targetName];
		if (!definition) throw new Error(`unknown gate: ${targetName}`);
		const gates = parseGates(ctx.metadata.gates || "");
		if (!gates.includes(targetName)) throw new Error(`gate not declared on ticket: ${targetName}`);
		bodyUpdates[definition.field] = "failed";
	}
	writeTicket(config, ticketId, ctx, { boardUpdates, bodyUpdates });
	if (exhausted) console.log(`ticket ${ticketId}: repair budget exhausted (${repairs}/${budget.limit})`);
}

function ticketVerify(config, ticketId) {
	loadTicket(config, ticketId);
	runCheck(
		config.docsConsistencyCommand || "node acorn/scripts/check-docs-consistency.cjs",
		["--ticket", ticketId],
	);
	console.log(`ticket ${ticketId}: check passed`);
}

function ticketCheck(config, ticketId) {
	const before = withTicketLock(() => loadTicket(config, ticketId));
	const commands = validationCommands(config);
	if (!commands.length) throw new Error("validationCommands is empty in acorn/config.json");
	const evidence = runValidation(config, commands);
	return withTicketLock(() => {
		const current = loadTicket(config, ticketId);
		assertTicketUnchanged(before, current);
		writeTicket(config, ticketId, current, { bodyUpdates: evidence });
	});
}

function nextTicketId(config, board) {
	const stamp = new Date();
	const yymmdd = [
		String(stamp.getFullYear()).slice(-2),
		String(stamp.getMonth() + 1).padStart(2, "0"),
		String(stamp.getDate()).padStart(2, "0"),
	].join("");
	const prefix = `T-${yymmdd}-`;
	const used = new Set(
		board.rows
			.map((row) => boardValue(board, row, "Ticket"))
			.filter((id) => typeof id === "string" && id.startsWith(prefix)),
	);
	const activePattern = config.ticketBodyPath || "docs/tickets/active/{ID}.md";
	const activeDir = path.dirname(path.resolve(activePattern.replace("{ID}", "__id__")));
	if (fs.existsSync(activeDir)) {
		for (const file of fs.readdirSync(activeDir)) {
			if (file.startsWith(prefix) && file.endsWith(".md")) used.add(file.slice(0, -3));
		}
	}
	const archiveRoot = config.ticketArchivePath || "docs/tickets/archive";
	if (fs.existsSync(archiveRoot)) {
		for (const entry of fs.readdirSync(archiveRoot, { withFileTypes: true })) {
			if (!entry.isDirectory() || !/^\d{4}-\d{2}$/.test(entry.name)) continue;
			for (const file of fs.readdirSync(path.join(archiveRoot, entry.name))) {
				if (file.startsWith(prefix) && file.endsWith(".md")) used.add(file.slice(0, -3));
			}
		}
	}
	let seq = 1;
	while (used.has(`${prefix}${String(seq).padStart(2, "0")}`)) seq += 1;
	return `${prefix}${String(seq).padStart(2, "0")}`;
}

function appendBoardRow(content, headers, values) {
	const lines = content.split(/\r?\n/);
	let fence = null;
	for (let i = 0; i < lines.length; i += 1) {
		const trimmed = lines[i].trim();
		const marker = trimmed.match(/^(`{3,}|~{3,})/);
		if (marker) {
			if (!fence) fence = marker[1];
			else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
			continue;
		}
		if (fence || !trimmed.startsWith("|")) continue;
		const found = require("./board.cjs").boardCells(trimmed);
		if (!found.includes("Ticket") || !found.includes("State")) continue;
		const separator = require("./board.cjs").boardCells((lines[i + 1] || "").trim());
		if (separator.length !== found.length) continue;
		let last = i + 1;
		while (last + 1 < lines.length && lines[last + 1].trim().startsWith("|")) last += 1;
		const row = found.map((header) => values[header] ?? "");
		const formatted = `| ${row.map((cell) => String(cell).replaceAll("|", "\\|")).join(" | ")} |`;
		lines.splice(last + 1, 0, formatted);
		return lines.join("\n");
	}
	throw new Error("BOARD table not found");
}

function ticketNew(config, title, gatesArg) {
	const boardRel = config.ticketBoardPath || "docs/tickets/board.md";
	const boardPath = path.join(process.cwd(), boardRel);
	if (!fs.existsSync(boardPath)) throw new Error(`Missing BOARD: ${boardRel}`);
	const boardContent = fs.readFileSync(boardPath, "utf8");
	const board = parseBoard(boardContent);
	if (!board.headers.length) throw new Error("Invalid BOARD table");
	const ticketId = nextTicketId(config, board);
	const gates = parseGates(gatesArg || "code-review,docs");
	if (!gates.length || gates.at(-1) !== "docs") throw new Error("gates must end with docs");
	const now = isoNow();
	const bodyPath = path.resolve(
		(config.ticketBodyPath || "docs/tickets/active/{ID}.md").replace("{ID}", ticketId),
	);
	if (fs.existsSync(bodyPath)) {
		throw new Error(`active ticket body already exists: ${bodyPath}`);
	}
	fs.mkdirSync(path.dirname(bodyPath), { recursive: true });
	const receipts = Object.fromEntries(
		Object.entries(GATES).map(([name, definition]) => [
			definition.field,
			gates.includes(name) ? "pending" : "n/a",
		]),
	);
	const body = `---
id: ${ticketId}
state: ready
created_at: ${JSON.stringify(now)}
updated_at: ${JSON.stringify(now)}
completed_at: null
verification: pending
gates: ${gates.join(",")}
code_review: ${receipts.code_review}
security_review: ${receipts.security_review}
e2e: ${receipts.e2e}
docs: ${receipts.docs}
repairs_used: 0
---

# ${title || ticketId}

## Goal
TODO

## Do
- TODO

## Keep
- TODO

## Done
- TODO

## Role
worker

## Gates
${gates.join(", ")}
`;
	const relativeLink = path
		.relative(path.dirname(boardPath), bodyPath)
		.replaceAll("\\", "/");
	const values = {
		Ticket: ticketId,
		Title: title || ticketId,
		State: "ready",
		Next: "worker",
		Role: "worker",
		Mode: "implementation",
		"Read Budget": "1+2",
		Links: `[body](${relativeLink})`,
		Body: `[body](${relativeLink})`,
		Notes: "-",
	};
	const nextBoard = appendBoardRow(boardContent, board.headers, values);
	const statePath = path.join(process.cwd(), "acorn", "state.json");
	runTransaction([bodyPath, boardPath, statePath], () => {
		atomicWrite(bodyPath, body);
		atomicWrite(boardPath, nextBoard.endsWith("\n") ? nextBoard : `${nextBoard}\n`);
		syncState(config, ticketId, {
			state: "ready",
			next: "worker",
			metadata: parseFrontmatter(body),
		});
		runCheck(
			config.docsConsistencyCommand || "node acorn/scripts/check-docs-consistency.cjs",
			["--ticket", ticketId],
		);
	});
	console.log(`ticket ${ticketId}: created State=ready Next=worker`);
}

function removeBoardRow(content, ticketId) {
	const lines = content.split(/\r?\n/);
	let fence = null;
	for (let i = 0; i < lines.length; i += 1) {
		const trimmed = lines[i].trim();
		const marker = trimmed.match(/^(`{3,}|~{3,})/);
		if (marker) {
			if (!fence) fence = marker[1];
			else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
			continue;
		}
		if (fence || !trimmed.startsWith("|")) continue;
		const headers = require("./board.cjs").boardCells(trimmed);
		if (!headers.includes("Ticket") || !headers.includes("State")) continue;
		for (let j = i + 2; j < lines.length && lines[j].trim().startsWith("|"); j += 1) {
			const row = require("./board.cjs").boardCells(lines[j].trim());
			if (row[headers.indexOf("Ticket")] !== ticketId) continue;
			lines.splice(j, 1);
			return lines.join("\n");
		}
	}
	throw new Error(`BOARD row not found: ${ticketId}`);
}

function completionCommand(config) {
	return config.ticketCompletionCommand || "node acorn/scripts/check-ticket-completion.cjs";
}

function ticketDone(config, ticketId) {
	const ctx = loadTicket(config, ticketId);
	const metadata = ctx.metadata;
	if (metadata.verification !== "passed") {
		throw new Error("verification must already be passed before done");
	}
	for (const gate of parseGates(metadata.gates || "")) {
		const definition = GATES[gate];
		if (!definition) throw new Error(`unknown gate: ${gate}`);
		if (metadata[definition.field] !== "passed") {
			throw new Error(`gate not passed: ${gate} (${metadata[definition.field] || "missing"})`);
		}
	}
	if (validationCommands(config).length && !metadata.verified_commands) {
		throw new Error(`missing verification receipt; run ticket.cjs check ${ticketId} before done`);
	}
	if (!/^## Result\s*\r?\n\s*\S/m.test(ctx.bodyContent)) {
		throw new Error("missing non-empty ## Result section; write Result before done");
	}
	const boardState = boardValue(ctx.board, ctx.row, "State");
	const boardNext = (boardValue(ctx.board, ctx.row, "Next") || "").toLowerCase();
	if (boardState !== "docs") {
		throw new Error("BOARD State must be docs before done; run pass {ID} docs first");
	}
	if (!["reporter", "doc-updater"].includes(boardNext)) {
		throw new Error("BOARD Next must be reporter before done; run pass {ID} docs first");
	}

	const now = isoNow();
	const bodyContent = setFrontmatter(ctx.bodyContent, {
		state: "done",
		completed_at: now,
		updated_at: now,
	});
	const doneMetadata = parseFrontmatter(bodyContent);
	const check = completionCommand(config);
	const archiveRoot = config.ticketArchivePath || "docs/tickets/archive";
	const monthDir = path.join(archiveRoot, now.slice(0, 7));
	const archivePath = path.join(monthDir, `${ticketId}.md`);
	let boardAfterArchive = null;

	runTransaction([ctx.bodyPath, ctx.boardPath, ctx.statePath, archivePath], () => {
		atomicWrite(ctx.bodyPath, bodyContent);
		runCheck(check, ["--preflight", ticketId]);
		fs.mkdirSync(monthDir, { recursive: true });
		if (fs.existsSync(archivePath)) throw new Error(`archive already exists: ${archivePath}`);
		fs.renameSync(ctx.bodyPath, archivePath);
		boardAfterArchive = removeBoardRow(fs.readFileSync(ctx.boardPath, "utf8"), ticketId);
		atomicWrite(
			ctx.boardPath,
			boardAfterArchive.endsWith("\n") ? boardAfterArchive : `${boardAfterArchive}\n`,
		);
		syncState(config, ticketId, { state: "done", next: null, metadata: doneMetadata }, { clear: true });
		runCheck(check, [ticketId]);
	});
	console.log(`ticket ${ticketId}: archived and removed from BOARD`);
}

function ticketContext(config, ticketId) {
	const ctx = loadTicket(config, ticketId);
	const next = boardValue(ctx.board, ctx.row, "Next") || "unknown";
	const role = config.roles?.[next]?.guide;
	const read = ctx.bodyContent.match(/^## Read\s*\r?\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1] || "";
	console.log(`Ticket: ${ticketId}\nNext: ${next}\nGates: ${ctx.metadata.gates || "unspecified"}`);
	console.log(`Body: ${path.relative(process.cwd(), ctx.bodyPath)}`);
	if (role) console.log(`Guide: ${role}`);
	for (const line of read.split(/\r?\n/)) {
		const file = line.match(/^\s*[-*]\s+(.+?)\s*$/)?.[1];
		if (!file) continue;
		const target = path.resolve(process.cwd(), file);
		const inside = target.startsWith(process.cwd() + path.sep);
		console.log(`Read: ${file} [${!inside ? "outside project" : fs.existsSync(target) ? "found" : "missing"}]`);
	}
}

function usage(code = 1) {
	console.log(`Usage:
  node acorn/scripts/ticket.cjs new [title] [--gates code-review,docs]
  node acorn/scripts/ticket.cjs start <ID>
  node acorn/scripts/ticket.cjs pass <ID> [verification] [--manual "reason"]
  node acorn/scripts/ticket.cjs pass <ID> <gate>
  node acorn/scripts/ticket.cjs fail <ID> [verification|gate]
  node acorn/scripts/ticket.cjs block <ID>
  node acorn/scripts/ticket.cjs resume <ID>
  node acorn/scripts/ticket.cjs check <ID>
  node acorn/scripts/ticket.cjs verify <ID>
  node acorn/scripts/ticket.cjs context <ID>
  node acorn/scripts/ticket.cjs done <ID>
  node acorn/scripts/ticket.cjs recover [--force]

Notes:
  pass verification runs validationCommands (or reuses a receipt whose Git input still matches)
  and records verified_at/verified_input/verified_commands; --manual records a visible exception.
  check runs validationCommands and records the receipt without a transition.
  verify runs only the docs consistency check.
  After verification is passed, gate names are required for pass.
  blocked tickets need resume (and repair_limit >= repairs_used).
  done checks existing receipts/Result only; run pass {ID} docs first.`);
	process.exit(code);
}

function runCliUnlocked(argv, { unlockedValidation = false } = {}) {
	if (!argv.length || argv.includes("-h") || argv.includes("--help")) usage(argv.length ? 0 : 1);
	const action = argv[0];
	if (action === "recover") {
		if (argv.length > 2 || (argv[1] && argv[1] !== "--force")) throw new Error(`Unexpected argument: ${argv[1]}`);
		ticketRecover({ force: argv[1] === "--force" });
		return;
	}
	const config = loadConfig();
	if (action === "new") {
		const gatesIndex = argv.indexOf("--gates");
		const gates = gatesIndex >= 0 ? argv[gatesIndex + 1] : null;
		if (gatesIndex >= 0 && !gates) throw new Error("--gates needs a value");
		const titleParts = argv
			.slice(1)
			.filter((part, index, all) => {
				const gatesAt = all.indexOf("--gates");
				return part !== "--gates" && (gatesAt < 0 || index !== gatesAt + 1);
			});
		ticketNew(config, titleParts.join(" ").trim(), gates);
		return;
	}
	const rest = argv.slice(1);
	let manual;
	const manualAt = rest.indexOf("--manual");
	if (manualAt >= 0) {
		if (action !== "pass") throw new Error("--manual is only valid with pass verification");
		manual = String(rest[manualAt + 1] || "").trim();
		if (!manual || manual.startsWith("--")) throw new Error("--manual needs a reason");
		rest.splice(manualAt, 2);
	}
	const ticketId = rest[0];
	const target = rest[1];
	if (!ticketId) throw new Error(`ticket ${action} needs a ticket id`);
	if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(ticketId)) {
		throw new Error(`invalid ticket id: ${ticketId}`);
	}
	if (rest.length > 2) throw new Error(`Unexpected argument: ${rest[2]}`);
	if (action === "start") ticketStart(config, ticketId);
	else if (action === "pass") {
		if (unlockedValidation && (!target || target === "verification")) {
			ticketPassVerification(config, ticketId, target, { manual });
		} else ticketPass(config, ticketId, target, { manual });
	}
	else if (action === "fail") ticketFail(config, ticketId, target);
	else if (action === "block") ticketBlock(config, ticketId);
	else if (action === "resume") ticketResume(config, ticketId);
	else if (action === "check") ticketCheck(config, ticketId);
	else if (action === "verify") ticketVerify(config, ticketId);
	else if (action === "context") ticketContext(config, ticketId);
	else if (action === "done") ticketDone(config, ticketId);
	else throw new Error(`Unknown ticket action: ${action}`);
}

function runCli(argv) {
	const action = argv[0];
	if (action === "recover") return runCliUnlocked(argv);
	const passTarget = action === "pass" && argv[2] && !argv[2].startsWith("--")
		? argv[2]
		: null;
	const unlockedValidation = action === "check" ||
		(action === "pass" && (!passTarget || passTarget === "verification"));
	if (unlockedValidation) return runCliUnlocked(argv, { unlockedValidation: true });
	const mutating = new Set(["new", "start", "pass", "fail", "block", "resume", "check", "done"]);
	return mutating.has(action)
		? withTicketLock(() => runCliUnlocked(argv))
		: runCliUnlocked(argv);
}

module.exports = {
	GATES,
	isoNow,
	parseFrontmatter,
	frontmatterIssues,
	setFrontmatter,
	parseGates,
	repairBudget,
	nextAfterGate,
	validateGateContract,
	validateTicketTransition,
	workspaceFingerprint,
	runCli,
};

if (require.main === module) {
	try {
		runCli(process.argv.slice(2));
	} catch (error) {
		console.error(`ticket: ${error.message}`);
		process.exit(1);
	}
}
