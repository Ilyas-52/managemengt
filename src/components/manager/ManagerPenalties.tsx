'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserX, Trash2, Plus, Scale, Printer, Save, Edit3, X, Calendar } from 'lucide-react';

const STAFF_LIST = [
    'حمزة متموري',
    'بلال متموري',
    'وفاء بوعزاتي',
    'اسماعيل بوسماي',
    'محمد بومزعق',
    'يوسف بومزعق',
    'محمد بلقاسم',
    'ابراهيم بوراس',
    'زكرياء بومزعق'
];

export default function ManagerPenalties() {
    const [loading, setLoading] = useState(false);
    const [penalties, setPenalties] = useState<any[]>([]);

    // States د الإدخال والـتـصـفـيـة
    const [selectedStaff, setSelectedStaff] = useState(STAFF_LIST[0]);
    const [errorDescription, setErrorDescription] = useState('');
    
    // 🌟 اختيار تاريخ العقوبة ب اليد ف الـ Form
    const [penaltyDate, setPenaltyDate] = useState(new Date().toISOString().split('T')[0]);

    // 🌟 فلتر الشهر الحالي (YYYY-MM) باش الجدول يعرض غير عقوبات هاد الشهر وميتخلطش الشي
    const [currentMonthFilter, setCurrentMonthFilter] = useState(new Date().toISOString().slice(0, 7));

    // 🔒 مسمار ساروت التعديل
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchPenalties = async () => {
        try {
            const { data, error } = await supabase
                .from('staff_penalties')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setPenalties(data);
        } catch (err) { console.error("Error fetching penalties:", err); }
    };

    useEffect(() => {
        fetchPenalties();
    }, []);

    // 🚀 دالة الحفظ والتحديث الذكية
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!errorDescription.trim()) return;

        setLoading(true);
        const customTimestamp = new Date(`${penaltyDate}T${new Date().toTimeString().split(' ')[0]}`).toISOString();

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('staff_penalties')
                    .update({
                        staff_name: selectedStaff,
                        error_type: errorDescription,
                        created_at: customTimestamp
                    })
                    .eq('id', editingId);

                if (!error) {
                    alert("⚙️ تم تحديث العقوبة بنجاح !");
                    setEditingId(null);
                    setErrorDescription('');
                    setPenaltyDate(new Date().toISOString().split('T')[0]);
                    await fetchPenalties();
                } else {
                    alert("⚠️ خطأ في التحديث: " + error.message);
                }
            } else {
                const { error } = await supabase.from('staff_penalties').insert([{
                    staff_name: selectedStaff,
                    error_type: errorDescription,
                    penalty_value: 'خصم نصف يوم',
                    created_at: customTimestamp
                }]);

                if (!error) {
                    setErrorDescription('');
                    alert(`✅ تم تسجيل العقوبة بنجاح بتاريخ ${penaltyDate} (خصم نصف يوم)`);
                    await fetchPenalties();
                } else {
                    alert("⚠️ خطأ في الحفظ: " + error.message);
                }
            }
        } catch (err: any) { alert("وقع مشكل: " + err.message); }
        setLoading(false);
    };

    const handleLoadToForm = (penalty: any) => {
        setEditingId(penalty.id);
        setSelectedStaff(penalty.staff_name);
        setErrorDescription(penalty.error_type);
        if (penalty.created_at) {
            setPenaltyDate(penalty.created_at.split('T')[0]);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeletePenalty = async (id: string) => {
        const confirmDelete = window.confirm("🚨 واش بصح باغي تمسح هاد المخالفة نهائياً؟");
        if (!confirmDelete) return;
        
        const { error } = await supabase.from('staff_penalties').delete().eq('id', id);
        if (!error) {
            alert("🗑️ تم الحذف بنجاح!");
            if (editingId === id) {
                setEditingId(null);
                setErrorDescription('');
                setPenaltyDate(new Date().toISOString().split('T')[0]);
            }
            fetchPenalties();
        }
    };

    // 🚀 مسمار الـ PDF العالمي المفلتر بالشهر والاسم
    const handlePrintPDF = () => {
        // الفلترة بالاسم وبداية تاريخ الشهر
        const filtered = penalties.filter(p => 
            p.staff_name === selectedStaff && 
            p.created_at && p.created_at.startsWith(currentMonthFilter)
        );

        if (filtered.length === 0) {
            alert(`📝 سجل العقوبات خالي لهذا الشهر بالنسبة لـ: ${selectedStaff}`);
            return;
        }

        const rows = filtered.map(p => {
            const date = new Date(p.created_at).toLocaleDateString('fr-FR');
            return `
                <tr>
                    <td style="padding: 12px; border: 1px solid #000; font-weight: bold; text-align: right;">${p.error_type}</td>
                    <td style="padding: 12px; border: 1px solid #000; color: #ef4444; font-weight: 900;">🛑 ناقص نصف يوم</td>
                    <td style="padding: 12px; border: 1px solid #000; font-weight: bold;">${date}</td>
                </tr>
            `;
        }).join('');

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const printWindow = iframe.contentWindow;

        if (!printWindow) return;

        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>تقرير العقوبات لشهر ${currentMonthFilter} - ${selectedStaff}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
                    @page { size: A4; margin: 20mm; }
                    body { font-family: 'Tajawal', sans-serif; padding: 10px; color: #000; }
                    .info-box { background: #f8f9fa; border: 1px solid #000; padding: 15px; margin-bottom: 20px; border-radius: 8px; font-size: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background-color: #000; color: #fff; padding: 12px; font-size: 13px; font-weight: 900; }
                    .footer { margin-top: 40px; font-size: 11px; opacity: 0.7; text-align: left; border-top: 1px dashed #000; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="info-box">
                    <strong>الاسم الكامل :</strong> <span style="font-size: 18px; color: #ef4444;">${selectedStaff}</span>
                    <br/>
                    <strong>الشهر المستهدف :</strong> <span style="font-weight: bold;">${currentMonthFilter}</span>
                    <br/>
                    <strong>إجمالي المخالفات المسجلة ف هاد الشهر:</strong> <span>${filtered.length} </span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 50%;">السبب / نوع الخطأ</th>
                            <th style="width: 25%;">الإجراء العقابي</th>
                            <th style="width: 25%;">التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>

                <div class="footer">تم استخراج هذا التقرير في: ${new Date().toLocaleString('ar-MA')}</div>
                <script>
                    window.onload = () => { 
                        setTimeout(() => { window.print(); }, 500); 
                    };
                </script>
            </body>
            </html>
        `);

        printWindow.document.close();
        setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 5000);
    };

    // 🌟 مسمار الفلترة على الشاشة: الفلترة بـ الاسم + الـشهر ب دقة عالية
    const filteredPenaltiesOnScreen = penalties.filter(p => 
        p.staff_name === selectedStaff && 
        p.created_at && p.created_at.startsWith(currentMonthFilter)
    );

    return (
        <div className="space-y-6 bg-[#F3F4F6]/60 p-4 rounded-[35px] font-black tracking-tighter uppercase text-right w-full italic" dir="rtl">

            {/* ── الرأس المطور بـ بوطون الـ PDF العالمي والـتصفية بالشهر ── */}
            <div className="bg-white p-6 rounded-[25px] border border-slate-100 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Scale size={20} className="text-red-500 animate-pulse" /> نظام ضبط عقوبات الموظفين
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    {/* 🌟 فلتر اختيار الشهر والسنة الذكي للجدول والطباعة */}
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200">
                        <Calendar size={14} className="text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-bold">عرض شهر:</span>
                        <input 
                            type="month" 
                            value={currentMonthFilter}
                            onChange={(e) => setCurrentMonthFilter(e.target.value)}
                            className="bg-transparent text-slate-900 border-none outline-none font-black text-xs cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={handlePrintPDF}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-2xl text-[10px] font-black shadow-lg transition-all active:scale-95 border-none cursor-pointer"
                    >
                        <Printer size={14} className="text-red-500" /> استخراج بيان العقوبات (PDF) 📄
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ── الجهة 1: الـ Form الذكي ── */}
                <form onSubmit={handleFormSubmit} className={`bg-white p-6 rounded-[30px] border shadow-sm space-y-4 transition-all duration-300 ${editingId ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-100'}`}>
                    <header className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 text-white rounded-lg flex items-center justify-center rotate-3 shadow-md ${editingId ? 'bg-amber-500' : 'bg-red-500'}`}>
                                <UserX size={16} />
                            </div>
                            <h4 className="font-black text-xs text-slate-900">
                                {editingId ? 'تعديل وتحديث المخالفة' : 'تسجيل مخالفة جديدة'}
                            </h4>
                        </div>
                        {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setErrorDescription(''); setPenaltyDate(new Date().toISOString().split('T')[0]); }} className="text-slate-400 hover:text-rose-500 p-1 bg-slate-50 rounded-md border-none cursor-pointer">
                                <X size={14} />
                            </button>
                        )}
                    </header>

                    <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 pr-3 block font-black">تاريخ المخالفة / العقوبة</label>
                        <input
                            type="date"
                            value={penaltyDate}
                            onChange={(e) => setPenaltyDate(e.target.value)}
                            className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-red-500 cursor-pointer"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 pr-3 block font-black">الموظف / العامل المستهدف</label>
                        <select
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                            className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-red-500 cursor-pointer"
                        >
                            {STAFF_LIST.map(name => (
                                <option key={name} value={name}>👤 {name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 pr-3 block font-black">نوع الخطأ أو المخالفة</label>
                        <input
                            type="text"
                            placeholder="مثال: غياب بدون إذن مسبق"
                            value={errorDescription}
                            onChange={(e) => setErrorDescription(e.target.value)}
                            className="w-full h-16 pr-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-red-500"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 pr-3 block font-black">الإجراء العقابي التلقائي</label>
                        <input
                            type="text"
                            value="🛑 ناقص نصف يوم من الأجرة"
                            className="w-full h-14 pr-4 bg-red-50/50 border-2 border-red-100 rounded-2xl text-red-600 text-xs font-black outline-none"
                            disabled
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full h-14 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg border-none disabled:bg-slate-300 cursor-pointer ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : editingId ? (
                            <><Save size={16} /> حفظ التحديثات فورا</>
                        ) : (
                            <><Plus size={16} /> تسجيل العقوبة فوريّاً</>
                        )}
                    </button>
                </form>

                {/* ── الجهة 2: الـ جدول المفلتر بـ الاسم والشهر معاً ── */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm overflow-x-auto">
                    <h4 className="text-xs font-black text-slate-900 mb-4 uppercase tracking-wider">
                        كشف اختلالات الموظف لشهر <span className="text-blue-600">{currentMonthFilter}</span> : <span className="text-red-500 underline">{selectedStaff}</span>
                    </h4>

                    <table className="w-full text-right border-collapse text-xs font-black text-slate-800">
                        <thead>
                            <tr className="border-b-2 border-slate-950 bg-slate-50 text-[10px] text-slate-400">
                                <th className="p-3">السبب / نوع الخطأ</th>
                                <th className="p-3 text-red-600">العقوبة المفروضة</th>
                                <th className="p-3">التاريخ</th>
                                <th className="p-3 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPenaltiesOnScreen.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-300 font-bold italic">
                                        السجل نظيف تماماً لهذا الموظف فـ هاد الشهر المعزول.
                                    </td>
                                </tr>
                            ) : (
                                filteredPenaltiesOnScreen.map(p => (
                                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === p.id ? 'bg-amber-50/40' : ''}`}>
                                        <td className="p-3 text-slate-900 font-bold">📝 {p.error_type}</td>
                                        <td className="p-3 text-red-500 font-black">🛑 ناقص نصف يوم</td>
                                        <td className="p-3 text-slate-400 text-[10px]">
                                            {new Date(p.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="p-3 text-left flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleLoadToForm(p)} 
                                                className="text-amber-500 hover:text-amber-700 transition-colors bg-transparent border-none cursor-pointer"
                                                title="تعديل العقوبة (إرسال للفوق)"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePenalty(p.id)} 
                                                className="text-slate-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer"
                                                title="حذف العقوبة"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}