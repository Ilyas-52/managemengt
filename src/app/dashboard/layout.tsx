import React from 'react';

export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // 🏠 حيدنا الـ max-width ورجعناها w-full باش السيت يتفرش فـ الـ PC كامل
        // 💡 زدنا overflow-x-hidden باش نأكدو أن الرعدة ديال التليفون تموت هنا
        <div className="min-h-screen w-full bg-[#F3F4F6] font-sans antialiased overflow-x-hidden" dir="rtl">

            {/* 🟢 الـ Container الرئيسي: ولا دابا حرّ (بلا max-width) */}
            <main className="w-full">
                {/* حيدنا الـ Padding الزايد اللي كان هنا حيت ديجا درناه فـ الـ page.tsx */}
                <div className="w-full">
                    {children}
                </div>
            </main>

        </div>
    );
}