import fs from "fs/promises";
import path from "path";

/**
 * Logs server-side actions to a local JSON file for debugging
 */
export async function logAction(message: string) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        message
    };

    // Also log to terminal for immediate feedback
    console.log(`[SERVER-LOG]: ${message}`);

    try {
        const logPath = path.join(process.cwd(), "logs.json");
        let logs = [];

        try {
            const data = await fs.readFile(logPath, "utf-8");
            logs = JSON.parse(data);
        } catch (e) {
            // File doesn't exist yet, which is fine
        }

        logs.unshift(logEntry); // Put newest log at the top

        // Keep only the last 100 entries so the file doesn't grow forever
        await fs.writeFile(logPath, JSON.stringify(logs.slice(0, 100), null, 2));
    } catch (err) {
        console.error("Critical: Failed to write to logs.json", err);
    }
}