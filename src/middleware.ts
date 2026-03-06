import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // 1. Get IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // 2. Ignore local traffic from the access.log to avoid clutter/self-banning
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip.includes('ffff:127.0.0.1');

    if (!isLocal) {
        const now = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const timestamp = `${now.getDate().toString().padStart(2, '0')}/${months[now.getMonth()]}/${now.getFullYear()}:${now.toTimeString().split(' ')[0]}`;

        // Standard Log4j/Apache Format for Fail2Ban
        console.log(`${ip} - - [${timestamp}] "${request.method} ${request.nextUrl.pathname} HTTP/1.1" ${response.status}`);
    } else {
        // Optional: Keep a quiet trace in terminal for you, but not in the log file
        // console.log(`[DEV] ${request.nextUrl.pathname} - ${response.status}`);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all paths except static assets. 
         * This stops Fail2Ban from seeing 404s for missing images/icons.
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
    ],
};