//app/not-found.tsx
import { headers } from 'next/headers';

export default async function NotFound() {
    const headersList = await headers();

    // x-invoke-path is a Next.js internal header for the requested route
    const path = headersList.get('x-invoke-path') || "unknown-resource";

    // 1. Get and Sanitize IP
    const forwarded = headersList.get('x-forwarded-for');
    let ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    ip = ip.replace(/^::ffff:/, '');

    const isLocal = ip === '127.0.0.1' || ip === '::1';

    // 2. Log the 404 for Fail2Ban
    if (!isLocal) {
        const now = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const timestamp = `${now.getDate().toString().padStart(2, '0')}/${months[now.getMonth()]}/${now.getFullYear()}:${now.toTimeString().split(' ')[0]}`;
        const logPath = path === "unknown-resource" ? "Direct-404-Access" : path;
        // Match the exact format expected by your Fail2Ban Filter
        console.log(`${ip} - - [${timestamp}] "GET ${logPath} HTTP/1.1" 404`);
    }

    return (
        <div style={{ padding: "100px", textAlign: "center", fontFamily: "sans-serif" }}>
            <h1 style={{ fontSize: "24px" }}>404 - Not Found</h1>
            <p>The requested resource does not exist.</p>
            <a href="/">Return Home</a>
        </div>
    );
}