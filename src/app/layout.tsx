import "./globals.css";
import type { Viewport } from 'next'; // زدنا هادي باش يكون الكود ناضي

export const metadata = {
    title: "Auto-Ecole Management",
    description: "System for Younes & Khalid",
};

// 🟢 هاد السطر هو "السّمّار" اللي كيحبس الـ Zoom التلقائي فـ التليفونات
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // هادي كاتخلي السيت مسمّر فـ بلاصتو كأنه App
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            {/* زدنا "overflow-x-hidden" حتى هنا باش نقتلو أي رعدة جانبية من الساس */}
            <body className="antialiased bg-slate-50 overflow-x-hidden">
                {children}
            </body>
        </html>
    );
}