import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    let res = NextResponse.next({
        request: { headers: req.headers },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return req.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
                    res = NextResponse.next({ request: { headers: req.headers } });
                    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
                },
            },
        }
    );

    // 1. جلب المستخدم الحالي
    const { data: { user } } = await supabase.auth.getUser();

    // 2. حماية الدخول: إيلا ما سجلش الدخول وهو داخل لـ /dashboard
    if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const userRole = user?.user_metadata?.user_role;
    const url = req.nextUrl.clone();

    // 3. حماية البيانات: إيلا كان User بلا Role محدد
    if (user && !userRole && url.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // 🛡️ تحديد الصلاحيات بناءً على المانيفست التقني
    const isManager = userRole === 'manager';
    const isTheory = userRole === 'instructor_theory' || isManager;
    const isPractical = userRole === 'instructor_practical' || isManager;

    // 🕵️‍♂️ منطق حماية المجلدات (تزغين، بودينار، كرونا)

    // حماية مسارات النظري (Theory) - كيشمل Tazaghine-theory, Mohammed, Youssef
    if (url.pathname.startsWith('/dashboard/theory') && !isTheory) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // حماية مسارات التطبيقي (Instructor) - كيشمل Belkassmi, Bilal, Hamza
    if (url.pathname.startsWith('/dashboard/instructor') && !isPractical) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // حماية مجلد الماناجر الرئيسي
    if (url.pathname.startsWith('/dashboard/manager') && !isManager) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return res;
}

export const config = {
    // حماية شاملة لجميع مسارات الدشبورد
    matcher: ['/dashboard/:path*'],
};