import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { CommandResult } from "./types.js";

const execFileAsync = promisify(execFile);

// Root of your Foundry project; override via env if needed
export const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

// Default private key from environment variable
export const DEFAULT_PRIVATE_KEY = process.env.FOUNDRY_PRIVATE_KEY;

// Helper to run forge commands safely
export async function runForge(args: string[]): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFileAsync("forge", args, {
      cwd: PROJECT_ROOT,
      env: process.env
    });
    return { success: true, stdout, stderr };
  } catch (err: any) {
    return {
      success: false,
      stdout: err.stdout?.toString?.() ?? "",
      stderr: err.stderr?.toString?.() ?? err.message ?? "forge failed"
    };
  }
}

// Helper to run cast commands safely
export async function runCast(args: string[]): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFileAsync("cast", args, {
      cwd: PROJECT_ROOT,
      env: process.env
    });
    return { success: true, stdout, stderr };
  } catch (err: any) {
    return {
      success: false,
      stdout: err.stdout?.toString?.() ?? "",
      stderr: err.stderr?.toString?.() ?? err.message ?? "cast failed"
    };
  }
}
