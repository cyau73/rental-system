import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const url = request.nextUrl.pathname;

    // 1. Get and Sanitize IP (Removes ::ffff:)
    const forwarded = request.headers.get('x-forwarded-for');
    let ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    ip = ip.replace(/^::ffff:/, '');

    // 2. Local Traffic Check
    const isLocal = ip === '127.0.0.1' || ip === '::1';

    // 3. Explicit Bot/Scanner Trap
    // Add paths that should ALWAYS trigger a Fail2Ban 404
    const devTraps = ['/SDK/webLanguage', '/wp-admin', '/.env', '/.git', '/phpmyadmin'];
    const isTrap = devTraps.some(path => url.includes(path));

    if (isTrap && !isLocal) {
        const now = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const timestamp = `${now.getDate().toString().padStart(2, '0')}/${months[now.getMonth()]}/${now.getFullYear()}:${now.toTimeString().split(' ')[0]}`;

        // Force a 404 log entry for Fail2Ban
        console.log(`${ip} - - [${timestamp}] "${request.method} ${url} HTTP/1.1" 404`);

        // Return an actual 404 response so the scanner stops here
        return new NextResponse(null, { status: 404 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /* Exclude static assets to prevent noise */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$).*)',
    ],
};