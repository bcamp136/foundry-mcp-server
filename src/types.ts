import { ChildProcess } from "node:child_process";

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

export interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  structuredContent?: any;
}

export interface AnvilState {
  process: ChildProcess | null;
}
