#!/usr/bin/env node
/**
 * Scrape multiple common search terms
 * Useful for initial data population or daily updates
 */

import * as path from "path";
import { execSync } from "child_process";

const SCRAPE_SCRIPT = path.join(process.cwd(), "scripts", "scrape.ts");

// Generate search terms
const COMMON_SEARCH_TERMS: string[] = [];

// OP01 to OP20
for (let i = 1; i <= 20; i++) {
	const num = i.toString().padStart(2, "0");
	COMMON_SEARCH_TERMS.push(`OP${num}`);
}

// EB01 to EB10
for (let i = 1; i <= 10; i++) {
	const num = i.toString().padStart(2, "0");
	COMMON_SEARCH_TERMS.push(`EB${num}`);
}

// ST01 to ST30
for (let i = 1; i <= 30; i++) {
	const num = i.toString().padStart(2, "0");
	COMMON_SEARCH_TERMS.push(`ST${num}`);
}

// P- (all P-series cards)
COMMON_SEARCH_TERMS.push("P-");

async function scrapeAll() {
	console.log("🚀 Starting batch scrape...\n");
	console.log(`Total search terms to scrape: ${COMMON_SEARCH_TERMS.length}`);
	console.log(`Breakdown:`);
	console.log(`  - OP01 to OP20: 20 terms`);
	console.log(`  - EB01 to EB10: 10 terms`);
	console.log(`  - ST01 to ST30: 30 terms`);
	console.log(`  - P-: 1 term (all P-series cards)`);
	console.log(`\nThis will take a while. Each term takes ~2-10 minutes depending on card count.\n`);

	let successCount = 0;
	let failCount = 0;

	for (let i = 0; i < COMMON_SEARCH_TERMS.length; i++) {
		const searchTerm = COMMON_SEARCH_TERMS[i];
		const progress = `[${i + 1}/${COMMON_SEARCH_TERMS.length}]`;

		try {
			console.log(`\n${progress} 📋 Scraping: ${searchTerm}`);
			execSync(`tsx ${SCRAPE_SCRIPT} ${searchTerm}`, {
				stdio: "inherit",
				cwd: process.cwd(),
			});
			console.log(`${progress} ✅ Completed: ${searchTerm}`);
			successCount++;

			// Add delay between searches to avoid rate limiting (except for the last one)
			if (i < COMMON_SEARCH_TERMS.length - 1) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		} catch (error) {
			console.error(`${progress} ❌ Failed to scrape ${searchTerm}:`, error);
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
