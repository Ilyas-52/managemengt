'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, History, CheckCircle2, CalendarDays, FileText, Plus, Trash2, Edit3 } from 'lucide-react';

export default function HolidaysTracker() {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHalfDay, setIsHalfDay] = useState(false);
    
    // المانجر يقدر يختار التاريخ لي بغا كبداية للعطلة
    const [selectedHolidayDate, setSelectedHolidayDate] = useState(new Date().toISOString().split('T')[0]);

    // ستيتس مخصصة للعطل الطويلة
    const [selectedInstructor, setSelectedInstructor] = useState('');
    const [customDuration, setCustomDuration] = useState('');

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

    // 📄 مسمار الـ PDF
    const handlePrint = () => {
        window.print();
    };

    // 🚀 حساب تاريخ نهاية العطلة أوتوماتيكياً للـ Payload والواجهة
    const getCalculateEndDate = (startDateStr: string, daysStr: string) => {
        const days = parseInt(daysStr);
        if (!startDateStr || isNaN(days) || days <= 0) return '';
        const startDate = new Date(startDateStr);
        startDate.setDate(startDate.getDate() + (days - 1));
        return startDate.toISOString().split('T')[0];
    };

    // 🚀 دالة تسجيل عطلة مستمرة وطويلة ف سطر واحد مجمع (مِن ... إلى ...)
    const handleCustomPeriodSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInstructor) {
            alert("⚠️ عافاك اختار اسم الموظف أولاً!");
            return;
        }
        const daysToInsert = parseInt(customDuration);
        if (isNaN(daysToInsert) || daysToInsert <= 0) {
            alert("⚠️ عافاك دخل عدد أيام صحيح!");
            return;
        }

        const usedTotal = holidays.filter(h => h.instructor_name === selectedInstructor).reduce((sum, h) => sum + (Number(h.duration) || 0), 0);
        const remainingTotal = TOTAL_FIXED - usedTotal;

        if (daysToInsert > remainingTotal) {
            alert(`❌ خطأ! الأيام المطلوبة (${daysToInsert}) أكبر من الرصيد المتبقي (${remainingTotal.toFixed(1)} يوم).`);
            return;
        }

        setLoading(true);
        try {
            const endDateStr = getCalculateEndDate(selectedHolidayDate, customDuration);

            const payload = {
                instructor_name: selectedInstructor,
                holiday_date: selectedHolidayDate, 
                end_holiday_date: endDateStr,      
                duration: daysToInsert,            
                notes: `عطلة مستمرة مدتها ${daysToInsert} أيام`
            };

            const { error } = await supabase.from('instructor_holidays').insert([payload]);
            if (error) throw error;

            alert(`✅ تم تسجيل العطلة بنجاح من ${selectedHolidayDate} إلى ${endDateStr}`);
            setCustomDuration('');
            setSelectedInstructor('');
            fetchHolidays();
        } catch (err: any) {
            alert("❌ خطأ أثناء الحفظ: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 🚀 تسجيل الغياب المرن القديم (يوم كامل أو نصف يوم)
    const addTodayHoliday = async (name: string) => {
        const targetDate = selectedHolidayDate; 
        const requestedValue = isHalfDay ? 0.5 : 1;

        const { data: existingRecords } = await supabase
            .from('instructor_holidays')
            .select('*')
            .eq('instructor_name', name)
            .eq('holiday_date', targetDate);

        const totalToday = (existingRecords || []).reduce((sum, h) => sum + (Number(h.duration) || 0), 0);

        if (totalToday >= 1) {
            alert(`❌ حبس! ${name} ديجا كمل "يوم كامل" (1.0) في تاريخ ${targetDate}.`);
            return;
        }

        const { error } = await supabase.from('instructor_holidays').insert([
            {
                instructor_name: name,
                holiday_date: targetDate, 
                duration: requestedValue,
                notes: isHalfDay ? 'نصف يوم عمل' : 'يوم عمل كامل'
            }
        ]);

        if (!error) {
            fetchHolidays();
            alert(`✅ تم تسجيل ${requestedValue} لـ ${name} بتاريخ ${targetDate}.`);
        }
    };

    // 🌟 🛠️ بوطون الحذف والتنقيص الذكي
    const handleSubtractOrDeleteHoliday = async (holiday: any) => {
        const inputDays = window.prompt(`هاد العطلة فيها (${holiday.duration}) أيام المسجلة.\nشحال من يوم باغي تنقص/تمسح منها؟`, holiday.duration);
        if (inputDays === null) return; 

        const daysToSubtract = parseFloat(inputDays);
        if (isNaN(daysToSubtract) || daysToSubtract <= 0) {
            alert("⚠️ عافاك دخل رقم صحيح د الأيام!");
            return;
        }

        if (daysToSubtract > holiday.duration) {
            alert(`❌ ما يمكنش تنقص ${daysToSubtract} أيام حيت العطلة كاملة فيها غير ${holiday.duration} أيام!`);
            return;
        }

        setLoading(true);

        if (daysToSubtract === holiday.duration) {
            const { error } = await supabase.from('instructor_holidays').delete().eq('id', holiday.id);
            if (!error) {
                alert("🗑️ تم حذف العطلة بالكامل بنجاح!");
                fetchHolidays();
            } else {
                alert("⚠️ خطأ أثناء الحذف: " + error.message);
                setLoading(false);
            }
        } else {
            const newDuration = holiday.duration - daysToSubtract;
            const newEndDate = getCalculateEndDate(holiday.holiday_date, newDuration.toString());

            const { error } = await supabase
                .from('instructor_holidays')
                .update({ 
                    duration: newDuration,
                    end_holiday_date: newEndDate || null,
                    notes: `تم تنقيص ${daysToSubtract} أيام بواسطة المدير`
                })
                .eq('id', holiday.id);

            if (!error) {
                alert(`⚙️ تم تنقيص الأيام بنجاح! الباقي الآن هو: ${newDuration} أيام.`);
                fetchHolidays();
            } else {
                alert("⚠️ خطأ أثناء التحديث: " + error.message);
                setLoading(false);
            }
        }
    };

    // 📝 مسمار التعديل السريع للعطلة
    const handleEditHoliday = async (holiday: any) => {
        const newDuration = window.prompt(`تعديل إجمالي الأيام لـ ${holiday.instructor_name}:`, holiday.duration);
        if (newDuration === null) return; 

        const parsedDuration = parseFloat(newDuration);
        if (isNaN(parsedDuration) || parsedDuration <= 0) {
            alert("⚠️ دخل رقم صحيح!");
            return;
        }

        setLoading(true);
        const newEndDate = getCalculateEndDate(holiday.holiday_date, parsedDuration.toString());
        
        const { error } = await supabase
            .from('instructor_holidays')
            .update({ 
                duration: parsedDuration,
                end_holiday_date: newEndDate || null
            })
            .eq('id', holiday.id);

        if (!error) {
            alert("⚙️ تم تحديث العطلة بنجاح!");
            fetchHolidays();
        } else {
            alert("⚠️ خطأ ف التحديث: " + error.message);
            setLoading(false);
        }
    };

    // 🌟 دالة فرعية ذكية ومحدثة لعرض البادج بشكل مجمع (أفقي ومِن ... إلى ...) ف الجدول والـ PDF
    const renderHolidayBadges = (instructorName: string, isForPDFReport = false) => {
        const list = holidays.filter(h => 
            h.instructor_name === instructorName && 
            (!isForPDFReport || h.holiday_date >= START_TRACKING_DATE)
        );

        if (list.length === 0) return <span className="text-slate-200 text-[10px] select-none">---</span>;

        return (
            // 🌟 جعل الحاوية flex-row مع flex-wrap باش كاع النطاقات والتواريخ يتستفو أفقيًا ف سطر واحد ومايهبطوش تحت بعض
            <div className="flex flex-row flex-wrap justify-center items-center gap-2 max-w-[500px] mx-auto">
                {list.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl whitespace-nowrap date-badge shrink-0">
                        {h.end_holiday_date && h.end_holiday_date !== h.holiday_date ? (
                            <span className="text-[9px] font-black text-amber-700">
                                📅 مِن {h.holiday_date.substring(5)} إلى {h.end_holiday_date.substring(5)} ({h.duration} أيام)
                            </span>
                        ) : (
                            <span className="text-[9px] font-bold text-slate-600">
                                📅 {h.holiday_date.substring(5)} ({h.duration} يوم)
                            </span>
                        )}
                        
                        {!isForPDFReport && (
                            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity no-print">
                                <button type="button" onClick={() => handleEditHoliday(h)} className="text-amber-500 hover:text-amber-700 border-none bg-transparent cursor-pointer">
                                    <Edit3 size={11} />
                                </button>
                                <button type="button" onClick={() => handleSubtractOrDeleteHoliday(h)} className="text-slate-400 hover:text-red-500 border-none bg-transparent cursor-pointer">
                                    <Trash2 size={11} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-300 uppercase italic">جاري تحديث الرصيد...</div>;

    return (
        <div className="w-full max-w-[1400px] mx-auto px-4 space-y-8 pb-40 font-black italic text-right w-full-print" dir="rtl">

            {/* 🛠️ CSS المطور والمعدل بالكامل للطباعة الاحترافية د الـ PDF */}
            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 12mm 10mm 12mm 10mm; 
                    }
                    nav, aside, button, .no-print, .footer-action, .custom-period-box { 
                        display: none !important; 
                    }
                    body { 
                        background: white !important; 
                        margin: 0 !important; 
                        font-family: Arial, sans-serif !important; 
                        -webkit-print-color-adjust: exact;
                        direction: rtl;
                    }
                    .w-full-print {
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    /* إظهار هيدر رسمي للتقرير ف الـ PDF */
                    .print-report-header {
                        display: block !important;
                        text-align: center !important;
                        margin-bottom: 25px !important;
                        border-bottom: 3px solid #1e293b !important;
                        padding-bottom: 15px !important;
                    }
                    .print-report-header h1 {
                        font-size: 20pt !important;
                        color: #1e293b !important;
                        margin: 0 0 5px 0 !important;
                        font-weight: bold !important;
                    }
                    .print-report-header p {
                        font-size: 10pt !important;
                        color: #64748b !important;
                        margin: 0 !important;
                    }
                    /* تنسيق وتنظيف الجدول للمنع من التموج */
                    .table-container { 
                        display: block !important; 
                        width: 100% !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: transparent !important;
                    }
                    table { 
                        width: 100% !important; 
                        border-collapse: collapse !important; 
                        margin: 0 !important;
                    }
                    th { 
                        background-color: #f8fafc !important;
                        border-bottom: 2px solid #000 !important; 
                        padding: 12px 8px !important; 
                        text-align: center !important;
                        font-size: 10pt !important; 
                        color: #000 !important;
                        font-weight: bold !important;
                    }
                    td { 
                        border-bottom: 1px solid #cbd5e1 !important; 
                        padding: 10px 8px !important; 
                        font-size: 9.5pt !important; 
                        text-align: center !important;
                        color: #000 !important;
                    }
                    .date-badge { 
                        background: #f1f5f9 !important;
                        border: 1px solid #cbd5e1 !important;
                        padding: 3px 6px !important;
                        border-radius: 6px !important;
                        font-size: 8pt !important; 
                        margin: 2px !important; 
                        display: inline-flex !important; 
                        align-items: center !important;
                    }
                }
                /* إخفاء هيدر التقرير ف الشاشة العادية */
                .print-report-header { display: none; }
            `}</style>

            {/* هيدر سري يظهر فقط عند طباعة الـ PDF */}
            <div className="print-report-header" dir="rtl">
                <h1>بيان تتبع عطل ومغادرات العاملين</h1>
                <p>تاريخ استخراج التقرير: {new Date().toLocaleDateString('fr-FR')} | نظام الرصيد السنوي (21 يوم)</p>
            </div>

            {/* Header العادي - يختفي في الطباعة */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col md:flex-row justify-between items-center border-b-8 border-emerald-500 shadow-2xl gap-6 no-print">
                <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl uppercase tracking-tighter italic flex items-center gap-3">
                        تتبع عطل العاملين <History className="text-emerald-400" />
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[2px]">نظام العطل - 21 يوم</p>
                </div>

                <div className="flex flex-wrap gap-3 justify-center items-center">
                    <div className="flex items-center gap-2 bg-slate-800 border-2 border-slate-700 px-4 py-2.5 rounded-[25px]">
                        <label className="text-[10px] text-slate-400 uppercase font-black whitespace-nowrap">تاريخ البدء:</label>
                        <input 
                            type="date" 
                            value={selectedHolidayDate} 
                            onChange={(e) => setSelectedHolidayDate(e.target.value)}
                            className="bg-transparent text-white font-black text-[12px] outline-none cursor-pointer"
                        />
                    </div>

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

            {/* لوحة إدخال العطل الطويلة */}
            <div className="bg-white p-6 rounded-[35px] border-2 border-slate-900 shadow-sm no-print custom-period-box">
                <form onSubmit={handleCustomPeriodSubmit} className="flex flex-col lg:flex-row items-end gap-4 justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:flex-1">
                        <div className="space-y-1">
                            <label className="text-[11px] text-slate-400 pr-2 block font-black">الموظف / المدرب</label>
                            <select 
                                value={selectedInstructor} 
                                onChange={(e) => setSelectedInstructor(e.target.value)}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-xs cursor-pointer"
                            >
                                <option value="">-- اختار الموظف --</option>
                                {instructors.map(name => (
                                    <option key={name} value={name}>👤 {name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] text-slate-400 pr-2 block font-black">عدد أيام العطلة</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="21" 
                                placeholder="مثال: 5"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] text-slate-400 pr-2 block font-black">تاريخ النهاية التلقائي</label>
                            <div className="w-full h-12 px-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-start font-black text-xs text-emerald-700">
                                {customDuration ? `📅 النطاق: إلى ${getCalculateEndDate(selectedHolidayDate, customDuration)}` : '--- ينتظر الأيام ---'}
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full lg:w-auto h-12 bg-slate-900 hover:bg-emerald-600 text-white px-6 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md border-none cursor-pointer">
                        <Plus size={16} /> تسجيل العطلة المستمرة
                    </button>
                </form>
            </div>

            {/* 📱 نسخة التليفون */}
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
                                    <span className="text-[8px] block uppercase font-bold">الباقي</span>
                                    <span className="text-lg font-black">{remaining.toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="pt-2">
                                {renderHolidayBadges(name, false)}
                            </div>
                            <button onClick={() => { if (confirm(`تسجيل غياب لـ ${name} بتاريخ ${selectedHolidayDate}؟`)) addTodayHoliday(name); }} disabled={remaining <= 0} className={`w-full py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 transition-all ${remaining <= 0 ? 'bg-slate-50 text-slate-200' : 'bg-slate-900 text-white shadow-lg active:scale-95'}`}>
                                <CheckCircle2 size={16} /> {isHalfDay ? 'سجل 0.5' : 'سجل يوم كامل'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* 💻 نسخة الـ PC والـ PDF المجمعة الأفقية منعا للتموج */}
            <div className="table-container hidden lg:block bg-white rounded-[45px] border-4 border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-right border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-slate-50 text-[11px] uppercase text-slate-500 italic">
                            <th className="p-8">الاسم الكامل</th>
                            <th className="p-8 text-center">تواريخ ونطاقات العطل (مِن / إلى)</th>
                            <th className="p-8 text-center text-rose-500">الأيام المستهلكة</th>
                            <th className="p-8 text-center text-emerald-600 bg-emerald-50/50">الرصيد المتبقي</th>
                            <th className="p-8 text-center no-print">إجراء سريع</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {instructors.map((name) => {
                            const usedTotal = holidays.filter(h => h.instructor_name === name).reduce((sum, h) => sum + (Number(h.duration) || 0), 0);
                            const remainingTotal = TOTAL_FIXED - usedTotal;

                            return (
                                <tr key={name} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="p-8 font-black text-slate-900 text-lg whitespace-nowrap">{name}</td>

                                    {/* 🌟 التعديل المطلوب: العطل دابا ولات كتخرج مجمعة أفقيًا بالكامل هنا وف الـ PDF */}
                                    <td className="p-4 text-center">
                                        {renderHolidayBadges(name, false)}
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

            {/* Footer */}
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