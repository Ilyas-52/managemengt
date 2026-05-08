'use client';
import { Gauge, Fuel, Flag, FileText } from 'lucide-react';

import { Agency } from '@/types/dashboard';

interface Props {
    mileage_start: number;
    mileage_end: number;
    fuel_expense: number;
    selectedAgency?: Agency | null;
    instructorName?: string;
}

export default function ManagerVehicle({ mileage_start, mileage_end, fuel_expense, selectedAgency, instructorName }: Props) {

    /// 🚀 دالة طباعة تقرير السيارة (أسبوعي بسيط) - نسخة الأندرويد المضمونة
    const handlePrintVehicle = () => {
        const totalDistance = (mileage_end > mileage_start) ? (mileage_end - mileage_start) : 0;

        // ✅ المسمار: كرينا Iframe مخفي بلاصة window.open
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const printWindow = iframe.contentWindow;

        if (!printWindow) return;

        printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>تقرير السيارة الأسبوعي</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
                body { font-family: 'Tajawal', sans-serif; padding: 40px; text-align: center; color: #000; }
                .header { border: 4px solid #000; padding: 20px; margin-bottom: 40px; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 900; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 2px solid #000; padding: 20px; font-size: 18px; font-weight: 700; }
                th { background-color: #f2f2f2; width: 40%; }
                
                .footer { margin-top: 50px; text-align: left; font-size: 12px; font-weight: bold; border-top: 1px solid #000; padding-top: 10px; }
                .highlight { font-size: 24px; font-weight: 900; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Auto Ecole ${selectedAgency?.name || 'Boudinar'}</h1>
                <p>تقرير حركة السيارة واستهلاك الوقود الاسبوعي</p>
                <span>Peugeot208</span>
            </div>

            <table>
                <tr>
                    <th>عداد البداية (KM)</th>
                    <td class="highlight">${mileage_start || 0}</td>
                </tr>
                <tr>
                    <th>عداد النهاية (KM)</th>
                    <td class="highlight">${mileage_end || 0}</td>
                </tr>
                <tr>
                    <th>المسافة المقطوعة</th>
                    <td class="highlight" style="color: #04b55f;">${totalDistance} KM</td>
                </tr>
                <tr>
                    <th>مصاريف الوقود (DH)</th>
                    <td class="highlight" style="color: #ef4444;">${fuel_expense || 0} DH</td>
                </tr>
            </table>

            <div class="footer">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-MA')}</div>

            <script>
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `);

        printWindow.document.close();

        // المسمار: كيسد الماكينة من بعد ما تسالي الطباعة
        iframe.onload = () => {
            setTimeout(() => {
                // document.body.removeChild(iframe); 
            }, 2000);
        };
    };

    return (
        <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-700 font-black italic uppercase tracking-tighter">

            {/* 1. عداد البداية */}
            <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-black px-4 flex items-center gap-2 opacity-70">
                    <Gauge size={10} /> عداد البداية (KM)
                </label>
                <div className="w-full h-20 bg-white border border-slate-100 rounded-[28px] flex items-center justify-center text-4xl text-slate-800 tabular-nums shadow-sm">
                    {mileage_start || 0}
                </div>
            </div>

            {/* 2. عداد النهاية */}
            <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-black px-4 flex items-center gap-2 opacity-70">
                    <Flag size={10} /> عداد النهاية (KM)
                </label>
                <div className="w-full h-20 bg-white border border-slate-100 rounded-[28px] flex items-center justify-center text-4xl text-slate-800 tabular-nums shadow-sm">
                    {mileage_end || 0}
                </div>
            </div>

            {/* 3. مصاريف الوقود */}
            <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-black px-4 flex items-center gap-2 opacity-70">
                    <Fuel size={10} /> مصاريف الوقود (DH)
                </label>
                <div className="w-full h-20 bg-white border-2 border-slate-900 rounded-[28px] flex items-center justify-center text-4xl text-slate-900 tabular-nums shadow-sm">
                    {fuel_expense || 0}
                </div>
            </div>

            {/* 4. إجمالي المسافة (خلاصة بسيطة) */}
            <div className="pt-2">
                <div className="w-full h-12 bg-slate-50 rounded-2xl flex items-center justify-between px-8 opacity-60">
                    <span className="text-[9px] text-slate-500 font-black">المسافة المقطوعة:</span>
                    <span className="text-lg text-slate-900 font-black">
                        {(mileage_end > mileage_start) ? (mileage_end - mileage_start) : 0} KM
                    </span>
                </div>
            </div>

            {/* 🚀 بوطونة استخراج الـ PDF */}
            <button
                onClick={handlePrintVehicle}
                className="w-full h-16 bg-slate-900 text-white rounded-[28px] flex items-center justify-center gap-3 font-black text-sm shadow-xl hover:bg-black transition-all active:scale-95 mt-6"
            >
                <FileText size={20} /> تـحـمـيـل تـقـريـر الـسـيـارة (PDF)
            </button>

        </div>
    );
}