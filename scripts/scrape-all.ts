#!/usr/bin/env node
/**
 * Scrape multiple common search terms
 * Useful for initial data population or daily updates
 */

import * as path from "path";
import { execSync } from "child_process";

const SCRAPE_SCRIPT = path.join(process.cwd(), "scripts", "scrape.ts");

// Generate search terms - using lowercase to match vers[] parameter format
const COMMON_SEARCH_TERMS: string[] = [];

// OP01 to OP14 (lowercase: op01 to op14)
for (let i = 1; i <= 14; i++) {
	const num = i.toString().padStart(2, "0");
	COMMON_SEARCH_TERMS.push(`op${num}`);
}

// PRB01 to PRB02 (lowercase: prb01 to prb02)
for (let i = 1; i <= 2; i++) {
	const num = i.toString().padStart(2, "0");
	COMMON_SEARCH_TERMS.push(`prb${num}`);
}

// ST01 to ST29 (lowercase: st01 to st29)
for (let i = 1; i <= 29; i++) {
	const num = i.toString().padStart(2, "0");
	COMMON_SEARCH_TERMS.push(`st${num}`);
}

// EB01 to EB04 (lowercase: eb01 to eb04)
for (let i = 1; i <= 4; i++) {
	const num = i.toString().padStart(2, "0");
	COMMON_SEARCH_TERMS.push(`eb${num}`);
}

// Promo cards
COMMON_SEARCH_TERMS.push("promo-100");
COMMON_SEARCH_TERMS.push("promo-200");
COMMON_SEARCH_TERMS.push("promo-op10");
COMMON_SEARCH_TERMS.push("promo-op20");
COMMON_SEARCH_TERMS.push("promo-st10");
COMMON_SEARCH_TERMS.push("promo-eb10");

async function scrapeAll() {
	console.log("🚀 Starting batch scrape...\n");
	console.log(`Total search terms to scrape: ${COMMON_SEARCH_TERMS.length}`);
	console.log(`Breakdown:`);
	console.log(`  - op01 to op14: 14 terms`);
	console.log(`  - prb01 to prb02: 2 terms`);
	console.log(`  - st01 to st29: 29 terms`);
	console.log(`  - eb01 to eb04: 4 terms`);
	console.log(`  - promo cards: 6 terms (promo-100, promo-200, promo-op10, promo-op20, promo-st10, promo-eb10)`);
	console.log(`\nThis will take a while. Each term takes ~2-10 minutes depending on card count.\n`);

	let successCount = 0;
	let failCount = 0;

	for (let i = 0; i < COMMON_SEARCH_TERMS.length; i++) {
		const searchTerm = COMMON_SEARCH_TERMS[i];
		const progress = `[${i + 1}/${COMMON_SEARCH_TERMS.length}]`;

		try {
			console.log(`\n${progress} 📋 Scraping: ${searchTerm}`);
			const command = `tsx ${SCRAPE_SCRIPT} ${searchTerm}`;
			console.log(`Running command: ${command}`);
			console.log(`Script path: ${SCRAPE_SCRIPT}`);
			console.log(`Working directory: ${process.cwd()}`);

			execSync(command, {
				stdio: "inherit", // Show output in real-time
				cwd: process.cwd(),
				env: { ...process.env },
			});
			console.log(`${progress} ✅ Completed: ${searchTerm}`);
			successCount++;

			// Add longer delay between searches to avoid rate limiting (except for the last one)
			if (i < COMMON_SEARCH_TERMS.length - 1) {
				const delay = 5000 + Math.random() * 3000; // 5-8 seconds between searches
				console.log(`⏳ Waiting ${Math.round(delay / 1000)}s before next scrape...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		} catch (error: unknown) {
			console.error(`\n${progress} ❌ Failed to scrape ${searchTerm}`);
			console.error("Error details:");

			// Type guard for execSync error
			if (error && typeof error === "object" && "stdout" in error) {
				const execError = error as { stdout?: unknown; stderr?: unknown; status?: unknown; message?: unknown };
				if (execError.stdout) {
					console.error("STDOUT:", String(execError.stdout));
				}
				if (execError.stderr) {
					console.error("STDERR:", String(execError.stderr));
				}
				if (execError.status) {
					console.error("Exit status:", execError.status);
				}
			}

			if (error instanceof Error) {
				console.error("Error message:", error.message);
				console.error("Error stack:", error.stack);
			} else {
				console.error("Unknown error:", error);
			}

			failCount++;
			// Continue with next term even if one fails
			// Still add delay to avoid rate limiting
			if (i < COMMON_SEARCH_TERMS.length - 1) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		}
	}

	console.log("\n" + "=".repeat(50));
	console.log("✅ Batch scrape completed!");
	console.log(`Successfully scraped: ${successCount} terms`);
	if (failCount > 0) {
		console.log(`Failed: ${failCount} terms`);
	}
	console.log("=".repeat(50));
}

scrapeAll();
