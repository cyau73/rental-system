import { headers } from 'next/headers';

export default async function NotFound() {
    const headersList = await headers();
    const path = headersList.get('x-invoke-path') || "unknown-resource";

    // Get IP
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Only log to the access log if it's NOT local traffic
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip.includes('ffff:127.0.0.1');

    if (!isLocal && path !== "unknown-resource") {
        const now = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const timestamp = `${now.getDate().toString().padStart(2, '0')}/${months[now.getMonth()]}/${now.getFullYear()}:${now.toTimeString().split(' ')[0]}`;

        console.log(`${ip} - - [${timestamp}] "GET ${path} HTTP/1.1" 404`);
    }

    return (
        <div style={{ padding: "100px", textAlign: "center", fontFamily: "sans-serif" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>404</h1>
            <p>The requested resource could not be found.</p>
            <a href="/" style={{ color: "blue", textDecoration: "underline" }}>Return Home</a>
        </div>
    );
}