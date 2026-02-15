#!/usr/bin/env node
import { rmSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const nextDir = join(__dirname, "..", ".next");

if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Cleaned .next folder");
} else {
  console.log(".next folder not found (already clean)");
}
