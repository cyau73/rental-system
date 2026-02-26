// src/app/admin/logs/page.tsx
import fs from "fs/promises";
import path from "path";
import Link from "next/link";

/**
 * Server Component to display activity logs
 */
export default async function LogsPage() {
    let logs = [];

    try {
        const logPath = path.join(process.cwd(), "logs.json");
        // Check if file exists before reading
        await fs.access(logPath);
        const data = await fs.readFile(logPath, "utf-8");
        logs = JSON.parse(data);
    } catch (e) {
        // If file doesn't exist, show a friendly empty state
        logs = [];
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Logs</h1>
                        <p className="text-gray-500 text-sm mt-1">Monitor file deletions and database activity</p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/admin"
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
                    {logs.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {logs.map((log: any, i: number) => (
                                <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/30 transition-colors group">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${log.message.includes('ERROR') ? 'bg-red-500' : 'bg-green-500'
                                            }`} />
                                        <span className="text-sm font-mono text-gray-800 break-all leading-relaxed">
                                            {log.message}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-md">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="text-4xl mb-4">📜</div>
                            <p className="text-gray-500 font-medium">No activity logged yet.</p>
                            <p className="text-gray-400 text-sm">Try updating a property to see logs appear.</p>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400 mt-6 italic">
                    Logs are stored in the root directory as logs.json
                </p>
            </div>
        </div>
    );
}