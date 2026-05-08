'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, History, CheckCircle2, CalendarDays, FileText } from 'lucide-react';

export default function HolidaysTracker() {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHalfDay, setIsHalfDay] = useState(false);

    const TOTAL_FIXED = 21;
    const START_TRACKING_DATE = '2026-05-08'; // تاريخ بداية عرض التواريخ في الـ PDF

    const instructors = [
        "حمزة متموري", "بلال متموري", "وفاء بوعزاتي", "اسماعيل بوسماي",
        "محمد بومزعق", "يوسف بومزعق", "محمد بلقاسم", "ابراهيم بوراس",
        "زكرياء بومزعق", "الحجاجي رشيدة"
    ];

    const fetchHolidays = async () => {
        const { data, error } = await supabase.from('instructor_holidays').select('*');
        if (!error) setHolidays(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchHolidays(); }, []);

    // 📄 مسمار الـ PDF (الطباعة الذكية)
    const handlePrint = () => {
        window.print();
    };

    // 🚀 مسمار تسجيل الغياب (مع منطق الـ 0.5 والمنع)
    const addTodayHoliday = async (name: string) => {
        const today = new Date().toLocaleDateString('en-CA');
        const requestedValue = isHalfDay ? 0.5 : 1;

        const { data: existingRecords } = await supabase
            .from('instructor_holidays')
            .select('*')
            .eq('instructor_name', name)
            .eq('holiday_date', today);

        const totalToday = (existingRecords || []).reduce((sum, h) => sum + (Number(h.duration) || 0), 0);

        if (totalToday >= 1) {
            alert(`❌ حبس! ${name} ديجا كمل "يوم كامل" (1.0) اليوم.`);
            return;
        }

        if (!isHalfDay && totalToday > 0) {
            alert(`❌ ما يمكنش تسجل "يوم كامل" لأن ${name} ديجا عندو ${totalToday} مسجلة. كملها بـ 0.5.`);
            return;
        }

        const { error } = await supabase.from('instructor_holidays').insert([
            {
                instructor_name: name,
                holiday_date: today,
                duration: requestedValue,
                notes: isHalfDay ? 'نصف يوم عمل' : 'يوم عمل كامل'
            }
        ]);

        if (!error) {
            fetchHolidays();
            alert(`✅ تم تسجيل ${requestedValue} لـ ${name}.`);
        }
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-300 uppercase italic">جاري تحديث الرصيد...</div>;

    return (
        <div className="w-full max-w-[1400px] mx-auto px-4 space-y-8 pb-40 font-black italic text-right" dir="rtl">

            {/* 🛠️ CSS خاص بالطباعة (PDF) لضبط التواريخ والجدول */}
            <style jsx global>{`
    @media print {
        /* 1. إعدادات الصفحة */
        @page {
            size: A4;
            margin: 15mm;
        }

        /* 2. مسح كاع الصداع */
        nav, aside, button, .no-print, .footer-action { 
            display: none !important; 
        }

        body { 
            background: white !important; 
            margin: 0 !important;
            font-family: Arial, sans-serif !important;
            -webkit-print-color-adjust: exact;
        }

        /* 3. الجدول البسيط (Basic & Clean) */
        .table-container { 
            display: block !important; 
            width: 100% !important;
        }

        table { 
            width: 100% !important; 
            border-collapse: collapse !important;
            direction: rtl;
        }

        /* 4. حدود خفيفة بزاف (Border خفيف) */
        th { 
            border-bottom: 2px solid #333 !important; /* خط تحت العنوان فقط */
            padding: 15px 10px !important; 
            text-align: center !important;
            font-size: 11pt !important;
            color: #000 !important;
        }

        td { 
            border-bottom: 1px solid #eee !important; /* خطوط أفقية خفيفة بزاف */
            padding: 12px 10px !important; 
            font-size: 10pt !important; 
            text-align: center !important;
            color: #444 !important;
        }

        /* لكتيبة ديال التواريخ تجي مجموعة */
        .date-badge { 
            font-size: 8pt !important;
            color: #666 !important;
            margin: 0 2px !important;
        }

        /* العنوان الفوقاني */
        .report-title {
            text-align: center !important;
            font-size: 16pt !important;
            margin-bottom: 30px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
        }
    }
`}</style>

            {/* Header - يختفي في الطباعة */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col md:flex-row justify-between items-center border-b-8 border-emerald-500 shadow-2xl gap-6 no-print">
                <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl uppercase tracking-tighter italic flex items-center gap-3">
                        تتبع عطل العاملين <History className="text-emerald-400" />
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[2px]">نظام العطل - 21 يوم</p>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                    <button onClick={handlePrint} className="bg-emerald-500 text-white px-6 py-4 rounded-[25px] text-[12px] font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                        تقرير PDF <FileText size={18} />
                    </button>

                    <div onClick={() => setIsHalfDay(!isHalfDay)} className={`flex items-center gap-4 px-6 py-4 rounded-[25px] cursor-pointer border-2 transition-all duration-500 ${isHalfDay ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/20' : 'bg-slate-800 border-slate-700'}`}>
                        <span className="text-[12px] uppercase">{isHalfDay ? 'نصف يوم (0.5)' : 'يوم كامل (1.0)'}</span>
                        <div className="w-10 h-6 bg-slate-700 rounded-full relative p-1 transition-colors">
                            <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${isHalfDay ? 'translate-x-0' : 'translate-x-[-16px]'}`}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 📱 نسخة التليفون (Cards) - تظهر فقط في الشاشات الصغيرة */}
            <div className="lg:hidden space-y-4 px-1 no-print card-container">
                {instructors.map((name) => {
                    const used = holidays.filter(h => h.instructor_name === name).reduce((sum, h) => sum + (Number(h.duration) || 0), 0);
                    const remaining = TOTAL_FIXED - used;
                    return (
                        <div key={name} className="bg-white rounded-[30px] border-2 border-slate-100 p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-4 border-b border-slate-50 pb-3">
                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><User size={18} /></div>
                                <span className="text-base font-black text-slate-900">{name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-rose-50 p-3 rounded-2xl text-center border border-rose-100">
                                    <span className="text-[8px] text-rose-400 block uppercase font-bold">المستهلك</span>
                                    <span className="text-lg font-black text-rose-600">{used.toFixed(1)}</span>
                                </div>
                                <div className={`${remaining <= 3 ? 'bg-orange-500 text-white' : 'bg-emerald-50 text-emerald-600'} p-3 rounded-2xl text-center transition-all`}>
                                    <span className={`text-[8px] block uppercase font-bold ${remaining <= 3 ? 'text-orange-100' : 'text-emerald-400'}`}>الباقي</span>
                                    <span className="text-lg font-black">{remaining.toFixed(1)}</span>
                                </div>
                            </div>
                            <button onClick={() => { if (confirm(`تسجيل غياب لـ ${name}؟`)) addTodayHoliday(name); }} disabled={remaining <= 0} className={`w-full py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 transition-all ${remaining <= 0 ? 'bg-slate-50 text-slate-200' : 'bg-slate-900 text-white shadow-lg active:scale-95'}`}>
                                <CheckCircle2 size={16} /> {isHalfDay ? 'تسجيل 0.5 اليوم' : 'تسجيل يوم كامل'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* 💻 نسخة الـ PC والـ PDF */}
            <div className="table-container hidden lg:block bg-white rounded-[45px] border-4 border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-right border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-slate-50 text-[11px] uppercase text-slate-500 italic">
                            <th className="p-8">الاسم الكامل</th>
                            <th className="p-8 text-center">تواريخ العطل (منذ اليوم)</th>
                            <th className="p-8 text-center text-rose-500">الأيام المستهلكة</th>
                            <th className="p-8 text-center text-emerald-600 bg-emerald-50/50">الرصيد المتبقي</th>
                            <th className="p-8 text-center no-print">إجراء سريع</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {instructors.map((name) => {
                            // تصفية التواريخ للتقرير فقط (منذ اليوم)
                            const recentHolidays = holidays.filter(h => h.instructor_name === name && h.holiday_date >= START_TRACKING_DATE);
                            const usedTotal = holidays.filter(h => h.instructor_name === name).reduce((sum, h) => sum + (Number(h.duration) || 0), 0);
                            const remainingTotal = TOTAL_FIXED - usedTotal;

                            return (
                                <tr key={name} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="p-8 font-black text-slate-900 text-lg">{name}</td>

                                    <td className="p-4 text-center">
                                        <div className="flex flex-wrap justify-center gap-1 max-w-[250px] mx-auto">
                                            {recentHolidays.length > 0 ? (
                                                recentHolidays.map((h, i) => (
                                                    <span key={i} className="date-badge bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100 text-[9px] font-bold">
                                                        {h.holiday_date.substring(5)} ({h.duration})
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-200 text-[10px]">---</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-8 text-center font-black text-rose-500 text-2xl tracking-tighter">{usedTotal.toFixed(1)}</td>
                                    <td className={`p-8 text-center font-black text-3xl tracking-tighter ${remainingTotal <= 3 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'} bg-emerald-50/10`}>
                                        {remainingTotal.toFixed(1)}
                                    </td>

                                    <td className="p-8 text-center no-print">
                                        <button onClick={() => addTodayHoliday(name)} disabled={remainingTotal <= 0} className={`px-8 py-4 rounded-[22px] font-black text-[12px] flex items-center gap-2 mx-auto transition-all ${remainingTotal <= 0 ? 'bg-slate-50 text-slate-200' : 'bg-slate-900 text-white hover:bg-emerald-600 active:scale-95 shadow-xl shadow-slate-900/10'}`}>
                                            <CheckCircle2 size={16} /> {isHalfDay ? 'سجل 0.5' : 'سجل 1.0'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer - No Print */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[35px] border-2 border-slate-100 shadow-sm no-print">
                <div className="flex items-center gap-4 text-slate-400">
                    <CalendarDays size={20} />
                    <span className="text-xs font-bold italic uppercase">تاريخ اليوم: {new Date().toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div> النظام متصل
                </div>
            </div>
        </div>
    );
}