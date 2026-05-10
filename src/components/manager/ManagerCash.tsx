'use client';
import { CircleDollarSign, Calendar, Clock, ArrowUpRight, ArrowDownRight, Printer, FileText } from 'lucide-react';

import { CashRecord, Agency } from '@/types/dashboard';

interface Props {
    balance: number;
    ledger: CashRecord[];
    previousBalance: number;
    selectedAgency?: Agency | null;
    instructorName?: string;
}

export default function ManagerCash({ balance, ledger, previousBalance, selectedAgency, instructorName }: Props) {
    const translateCategory = (cat: string) => {
        const mapping: { [key: string]: string } = {
            'transport_exam': 'نقل الامتحان',
            'heures_supp': 'ساعات إضافية',
            'younnes_zeriah': 'يونس زرياح', // 🚀 المسمار الجديد: يونس زرياح بالعربية
            'fuel': 'بنزين',
            'wash': 'غسيل السيارة',
            'repair': 'إصلاح / صيانة'
        };
        return mapping[cat] || cat;
    };

    // 🚀 دالة طباعة كشف الحساب (المداخيل والمصاريف) - نسخة الأندرويد المضمونة
    const handlePrintCash = () => {
        const previousBalanceRow = previousBalance !== 0 ? `
            <tr>
                <td style="text-align:right; font-weight: bold; background-color: #f0fdf4;">📦 رصيد البداية (من الأسابيع السابقة)</td>
                <td style="background-color: #f0fdf4;">رصيد سابق</td>
                <td style="color: ${previousBalance >= 0 ? '#04b55f' : '#ef4444'}; font-weight: 900; background-color: #f0fdf4;">${previousBalance >= 0 ? 'رصيد إيجابي' : 'رصيد سلبي'}</td>
                <td style="background-color: #f0fdf4;">--</td>
                <td style="font-weight: 900; background-color: #f0fdf4;">${previousBalance} DH</td>
            </tr>
        ` : '';

        const rows = ledger.map(entry => {
            const date = new Date(entry.created_at).toLocaleDateString('ar-MA');
            const type = entry.type === 'recette' ? 'مدخول (+)' : 'مصروف (-)';
            const color = entry.type === 'recette' ? '#04b55f' : '#ef4444';

            // 🚀 المسمار: تحديد السمية اللي غاتطبع (داخلية أو خارجية)
            const displayName = entry.student_name === 'EXTERNAL_CANDIDATE'
                ? `👤 خارجي: ${entry.external_name || 'بدون اسم'}`
                : (entry.student_name || 'مصاريف عامة');

            return `
        <tr>
            <td style="text-align:right; font-weight: bold;">${displayName}</td>
            <td>${translateCategory(entry.category)}</td>
            <td style="color: ${color}; font-weight: 900;">${type}</td>
            <td>${date}</td>
            <td style="font-weight: 900;">${entry.amount} DH</td>
        </tr>
    `;
        }).join('');

        const finalRows = previousBalanceRow + rows;

        // ✅ المسمار: كرينا Iframe مخفي فـ بلاصة window.open (مضمون للأندرويد)
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const printWindow = iframe.contentWindow;

        if (!printWindow) return;

        printWindow.document.write(`
    <html dir="rtl">
    <head>
        <title>تقرير الصندوق - Auto Ecole ${selectedAgency?.name || 'Boudinar'}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
            body { font-family: 'Tajawal', sans-serif; padding: 30px; }
            .header { text-align: center; border-bottom: 5px solid #04b55f; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-weight: 900; }
            .balance-box { background: #f8f9fa; border: 2px solid #000; padding: 15px; display: inline-block; margin-bottom: 20px; border-radius: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: center; font-size: 14px; }
            th { background-color: #000; color: #fff; }
            .footer { margin-top: 30px; font-size: 10px; opacity: 0.6; text-align: left; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Auto Ecole ${selectedAgency?.name || 'Boudinar'}</h1>
            <h2>تقرير المداخيل والمصاريف</h2>
        </div>
        
        <div class="balance-box">
            <strong>الرصيد الحالي المتبقي:</strong> 
            <span style="color:#04b55f; font-size: 20px;"> ${balance} DH</span>
        </div>

        <table>
            <thead>
                <tr>
                    <th>المرشح / التفاصيل</th>
                    <th>التصنيف</th>
                    <th>النوع</th>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                </tr>
            </thead>
            <tbody>${finalRows}</tbody>
        </table>

        <div class="footer">تم استخراج التقرير في: ${new Date().toLocaleString('ar-MA')}</div>
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

        // مسح الـ Iframe من الكود ملي تسالي الطباعة باش ما يتقلش الصفحة
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 5000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-black italic uppercase tracking-tighter text-right" dir="rtl">

            {/* 🔝 بوطونة استخراج PDF ف الراس */}
            <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <CircleDollarSign size={18} className="text-[#04b55f]" /> الحالة المالية
                </h2>
                <button
                    onClick={handlePrintCash}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-black transition-all active:scale-95"
                >
                    <Printer size={14} /> تقرير المداخيل والمصاريف
                </button>
            </div>

            {/* ── الكارد ديال الرصيد ── */}
            <div className="bg-white border-2 border-slate-50 p-10 rounded-[45px] shadow-sm relative overflow-hidden group">
                <div className="relative z-10 w-2/3">
                    <span className="text-[10px] text-slate-400 tracking-[0.2em] block mb-2 font-black">رصيد الصندوق الحالي</span>
                    <div className="flex items-baseline gap-2">
                        <p className="text-6xl tabular-nums text-slate-900 leading-none">{balance}</p>
                        <span className="text-xl text-[#04b55f] font-black">درهم</span>
                    </div>
                </div>
                <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-10 text-[#04b55f]">
                    <CircleDollarSign size={80} strokeWidth={1.5} />
                </div>
            </div>

            {/* ── سجل العمليات ── */}
            <div className="bg-white border border-slate-50 rounded-[45px] p-8 shadow-md">
                <div className="flex items-center gap-2 mb-8 pr-2 border-r-4 border-[#04b55f]">
                    <h3 className="text-xs font-black text-slate-800 tracking-widest uppercase px-3">تقرير المداخيل والمصاريف</h3>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="text-[9px] text-slate-300 uppercase tracking-widest border-b border-slate-50 font-black italic">
                            <tr>
                                <th className="pb-6 pr-4">المرشح / التفاصيل</th>
                                <th className="pb-6 text-center">التصنيف</th>
                                <th className="pb-6 text-center">النوع</th>
                                <th className="pb-6 text-left pl-4">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 italic font-black">
                            {/* 🚀 المسمار: سطر "الرصيد السابق" فـ المانجر */}
                            {previousBalance !== 0 && (
                                <tr className="bg-slate-900 text-white shadow-inner">
                                    <td className="py-6 pr-4">
                                        <p className="text-[12px] font-black leading-none">📦 رصيد البداية (من الأسابيع السابقة)</p>
                                        <span className="text-[7px] text-white/50 uppercase tracking-widest mt-1 block">INITIAL CARRY-OVER</span>
                                    </td>
                                    <td className="py-6 text-center">
                                        <div className="mx-auto w-9 h-9 rounded-2xl flex items-center justify-center bg-emerald-500 text-white">
                                            <FileText size={16} />
                                        </div>
                                    </td>
                                    <td className="py-6 text-center text-[10px] font-black text-white/50">رصيد سابق</td>
                                    <td className={`py-6 pl-4 text-left font-black tabular-nums text-xl ${previousBalance >= 0 ? 'text-[#04b55f]' : 'text-red-400'}`}>
                                        {previousBalance >= 0 ? '+' : ''}{previousBalance} <span className="text-[9px] opacity-30">درهم</span>
                                    </td>
                                </tr>
                            )}

                            {ledger.map((entry, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="py-5 pr-4">
                                        <p className="text-[12px] font-black text-slate-800 leading-none group-hover:text-[#04b55f] transition-colors uppercase">
                                            {/* 🚀 المسمار: كنشوفو واش المترشح خارجي نيشـان فـ جدول المانجر */}
                                            {entry.student_name === 'EXTERNAL_CANDIDATE'
                                                ? `👤 ${(entry as any).external_name || 'مترشح خارجي'}`
                                                : (entry.student_name || 'مصاريف عامة')}
                                        </p>

                                        <div className="flex flex-col gap-1 mt-2 opacity-40">
                                            <div className="flex items-center gap-1">
                                                <Clock size={10} />
                                                <span className="text-[8px] font-bold">
                                                    {new Date(entry.created_at).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={10} />
                                                <span className="text-[8px] font-bold">
                                                    {new Date(entry.created_at).toLocaleDateString('ar-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 text-center">
                                        <div className={`mx-auto w-9 h-9 rounded-2xl flex items-center justify-center ${entry.type === 'recette' ? 'bg-emerald-50 text-[#04b55f]' : 'bg-red-50 text-red-500'}`}>
                                            {entry.type === 'recette' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                        </div>
                                    </td>
                                    <td className="py-5 text-center text-[10px] font-black text-slate-400">{translateCategory(entry.category)}</td>
                                    <td className={`py-5 pl-4 text-left font-black tabular-nums ${entry.type === 'recette' ? 'text-[#04b55f] text-xl' : 'text-slate-900 text-xl'}`}>
                                        {entry.type === 'recette' ? '+' : '-'}{entry.amount} <span className="text-[9px] opacity-30">درهم</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}