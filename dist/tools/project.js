import path from "node:path";
import { PROJECT_ROOT } from "../utils.js";
export function registerProjectTools(server) {
    // --- Tool: foundry_project_info --------------------------
    server.registerTool("foundry_project_info", {
        title: "Foundry project info",
        description: "Return basic paths for the current Foundry project (src, test, script).",
    }, async () => {
        const info = {
            projectRoot: PROJECT_ROOT,
            srcDir: path.join(PROJECT_ROOT, "src"),
            testDir: path.join(PROJECT_ROOT, "test"),
            scriptDir: path.join(PROJECT_ROOT, "script")
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(info, null, 2)
                }
            ],
            structuredContent: info
        };
    });
}
