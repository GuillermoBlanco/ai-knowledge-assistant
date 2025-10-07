import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from "uuid";

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const sid = request.cookies.get('sid')?.value;

    if (!sid || !uuidV4Regex.test(sid)) {
        const newSid = uuidv4();
        response.cookies.set('sid', newSid, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });
        return response;
    }
}