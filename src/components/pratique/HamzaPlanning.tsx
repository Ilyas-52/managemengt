'use client';

import {
    Calendar, Plus, Clock, Activity, Save, ShieldCheck, X, Unlock, Lock, Trash2, Printer
} from 'lucide-react';

import { ScheduleData } from '@/types/dashboard';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface HamzaPlanningProps {
    schedule: ScheduleData;
    setSchedule: (val: ScheduleData) => void;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    handleSave: () => Promise<void>;
    handleSmartReset: () => Promise<void>;
    setShowModal: (val: { day: string; type: string; index?: number } | null) => void;
    loading: boolean;
    
}

export default function HamzaPlanning({
    schedule,
    setSchedule,
    isEditing,
    setIsEditing,
    handleSave,
    handleSmartReset,
    setShowModal,
    loading
}: HamzaPlanningProps) {

    const days = [
        { id: 'monday', label: 'الاثنين' },
        { id: 'tuesday', label: 'الثلاثاء' },
        { id: 'wednesday', label: 'الأربعاء' },
        { id: 'thursday', label: 'الخميس' },
        { id: 'friday', label: 'الجمعة' }
    ];
    const [instructorName, setInstructorName] = useState('');
    const [agencyName, setAgencyName] = useState('');

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user?.user_metadata?.full_name) setInstructorName(user.user_metadata.full_name);
            if (user?.user_metadata?.agence_id) {
                const { data } = await supabase.from('agencies').select('name').eq('id', user.user_metadata.agence_id).single();
                if (data?.name) setAgencyName(data.name);
            }
        });
    }, []);
    // 🖨️ دالة استخراج البرنامج PDF
    const handlePrintPlanning = () => {
        if (!schedule) {
            alert("البرنامج فارغ حالياً.");
            return;
        }

        const weekDays = [
            { key: 'monday', label: 'الإثنين' },
            { key: 'tuesday', label: 'الثلاثاء' },
            { key: 'wednesday', label: 'الأربعاء' },
            { key: 'thursday', label: 'الخميس' },
            { key: 'friday', label: 'الجمعة' }
        ];

        const rows = weekDays.map(day => {
            const dayData = schedule[day.key] || { morning: [], evening: [] };
            const morning = dayData.morning || [];
            const evening = dayData.evening || [];

            const morningText = morning.join(' ');
            const eveningText = evening.join(' ');

            const isMorningAbsent = morningText.includes('غياب') || morningText.includes('صنف A') || morningText.includes('عطلة');
            const isEveningAbsent = eveningText.includes('غياب') || eveningText.includes('صنف A') || eveningText.includes('عطلة');

            const clean = (txt: string) => txt.replace(/تلاميذ|تلميذ/g, '').trim();

            const formatTasks = (list: string[], isAbsent: boolean) => {
                if (isAbsent) {
                    return `
                    <div class="absent-row" style="
                        margin: 0; 
                        padding: 8px 4px; 
                        height: 100%; 
                        width: 100%; 
                        min-height: 45px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        box-sizing: border-box;
                        line-height: 1.2;
                        font-size: 14px;
                    ">
                        ⚠️ ${clean(list.join(' '))}
                    </div>`;
                }

                if (list.length === 0) return '---';

                return `<div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-start; text-align: right; padding: 4px;">
                    ${list.map(name => {
                        const fontSize = name.length > 15 ? '9px' : '11px';
                        return `<span style="font-size: ${fontSize}; width: 48%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; font-weight: 800;">• ${name}</span>`;
                    }).join('')}
                </div>`;
            };

            return `
            <tr>
                <td class="day-cell">${day.label}</td>
                <td class="task-cell" style="${isMorningAbsent ? 'padding: 0;' : ''}">
                    ${formatTasks(morning, isMorningAbsent)}
                </td>
                <td class="task-cell" style="${isEveningAbsent ? 'padding: 0;' : ''}">
                    ${formatTasks(evening, isEveningAbsent)}
                </td>
            </tr>`;
        }).join('');

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const printWindow = iframe.contentWindow;
        if (!printWindow) return;

        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');

                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm 8mm 10mm;
                    }
                    body { font-family: 'Tajawal', sans-serif; padding: 0; margin: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .header { text-align: center; border: 4px solid #000; padding: 12px; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 20px; }
                    th, td { border: 2px solid #000; padding: 8px 5px; text-align: center; font-weight: 700; font-size: 13px; }
                    th { background: #f2f2f2 !important; -webkit-print-color-adjust: exact !important; }
                    .day-cell { background: #f9f9f9 !important; width: 75px; font-weight: 900; }
                    .absent-row { 
                        background-color: #ff0000 !important; 
                        color: #ffffff !important; 
                        font-size: 14px !important; 
                        font-weight: 900 !important; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .notice-box {
                        background-color: #b8dc44 !important;
                        border: 3px solid #a3c437;
                        border-radius: 20px;
                        padding: 12px 15px;
                        margin-top: 15px;
                        text-align: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        page-break-inside: avoid;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .notice-text {
                        color: #0f172a;
                        font-size: 14px;
                        font-weight: 900;
                        line-height: 1.5;
                        margin: 0 0 8px 0;
                    }
                    .phone-container {
                        display: inline-block;
                        border-bottom: 4px solid #dc2626;
                        padding-bottom: 1px;
                        margin-bottom: 3px;
                    }
                    .phone-number {
                        color: #dc2626;
                        font-size: 22px;
                        font-weight: 900;
                        letter-spacing: 1px;
                    }
                    .info-box {
                        background-color: #b8dc44 !important;
                        border: 3px solid #a3c437;
                        border-radius: 20px;
                        padding: 12px 15px;
                        margin-top: 12px;
                        text-align: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        page-break-inside: avoid;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .info-text {
                        color: #0f172a;
                        font-size: 14px;
                        font-weight: 900;
                        line-height: 1.5;
                        margin: 0;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>مـؤسـسـة ${agencyName || 'بـوديـنـار'}</h1>
                    <div style="font-size: 14px; font-weight: 900;"> البرنامج الأسبوعي للحصص مع الأستاذ: ${instructorName}</div>
                </div>           </div>

                <table>
                    <thead><tr><th class="day-cell">اليوم</th><th>الصباح</th><th>المساء</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>

                <div class="notice-box">
                    <p class="notice-text">
                        لأي استفسار أو طرح أي تساؤل،المرجو إرسال رسالة صوتية أو كتابية إلى صاحب المؤسسة على الرقم:
                    </p>
                    <div class="phone-container">
                        <span class="phone-number">0688774026</span>
                    </div>
                </div>

                <div class="info-box">
                    <p class="info-text">
                        استعمال الزمن ينظم الحصص التطبيقية (السياقة) فقط. اما الحصص النظرية(الكود) فهي متاحة للجميع في اي وقت.
                    </p>
                </div>

                <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); };</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── CONTROL BAR ── */}
            <div className="flex flex-wrap justify-between items-center gap-6 bg-white p-6 rounded-[40px] border-2 border-slate-100 shadow-sm">

                {/* 🏷️ الحالة */}
                <div className={`px-6 py-3 rounded-2xl border-2 font-black flex items-center gap-3 transition-all ${isEditing ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-emerald-500 text-emerald-600 bg-emerald-50'}`}>
                    {isEditing ? <Unlock size={18} /> : <Lock size={18} />}
                    <span className="text-[11px] uppercase tracking-[0.2em]">{isEditing ? 'وضـع الـتـعـديـل' : 'وضـع الـنـشـر'}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
    {!isEditing ? (
        <>
            <button
                onClick={handlePrintPlanning}
                className="flex-1 sm:flex-none justify-center bg-emerald-600 text-white px-4 sm:px-6 h-12 sm:h-14 rounded-2xl text-[11px] sm:text-xs font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
                <Printer size={16} /> استخراج (PDF)
            </button>

            <button
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-none justify-center bg-slate-900 text-white px-4 sm:px-8 h-12 sm:h-14 rounded-2xl text-[11px] sm:text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
                <Calendar size={16} /> تعديل البرنامج
            </button>

            <button
                onClick={handleSmartReset}
                className="w-full sm:w-auto justify-center bg-slate-900 text-white px-4 sm:px-6 h-12 sm:h-14 rounded-2xl text-[11px] sm:text-xs font-black flex items-center gap-2 shadow-lg transition-all duration-300 hover:bg-red-500 active:scale-95"
            >
                <Trash2 size={16} className="text-white" />
                مسح البرنامج
            </button>
        </>
    ) : (
        <button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto justify-center bg-slate-900 text-white px-8 sm:px-12 h-14 rounded-2xl text-xs font-black shadow-xl hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
        >
            {loading ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
            {loading ? 'جاري الإرسال للرئيس...' : 'حفظ ونشر الآن 🛰️'}
        </button>
    )}
</div>
            </div>

            {/* ── GRID DAYS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 pb-20">
                {days.map((day) => (
                    <div key={day.id} className="bg-white border-2 border-slate-100 rounded-[45px] overflow-hidden shadow-sm flex flex-col hover:border-emerald-500/20 transition-all group min-h-[500px]">

                        {/* Day Title */}
                        <div className="bg-slate-50 p-6 border-b-2 border-slate-100 flex justify-between items-center group-hover:bg-emerald-50 transition-colors">
                            <span className="text-lg font-black text-slate-900">{day.label}</span>
                            <ShieldCheck size={20} className={isEditing ? "text-slate-300" : "text-emerald-500"} />
                        </div>

                        {['morning', 'evening'].map((type) => {
                            const items = schedule?.[day.id]?.[type as 'morning' | 'evening'] || [];

                            return (
                                <div key={type} className="p-4 space-y-4 border-b-2 last:border-0 border-slate-50 flex-1 flex flex-col min-h-[220px]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-slate-400 flex items-center gap-2 font-black uppercase tracking-tighter">
                                            <Clock size={14} className="text-emerald-500" /> {type === 'morning' ? 'صباحاً' : 'مساءً'}
                                        </span>
                                        {isEditing && (
                                            <button onClick={() => setShowModal({ day: day.id, type })}
                                                className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg active:scale-90">
                                                <Plus size={16} strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>

                                    {/* 🚀 المسمار: استعملنا flex-row و flex-wrap باش السميات يجو وحدة حدا وحدة */}
                                    {/* 🚀 المسمار: حيدنا flex-col ورديناها flex-row مع flex-wrap باش السميات يفرقعو الكادر لتحت بلا ما يتمسحو */}
                                    {/* 🚀 مسمار الـ Unlimited: حيدنا min-h ودرنا h-auto باش الكادر يطوال مع السميات */}
                                    <div className="flex flex-row flex-wrap gap-2 content-start items-start w-full pt-1 h-auto min-h-[220px]">
                                        {items.length > 0 ? (
                                            items.map((name: string, i: number) => {
                                                const isCarAbsence = name.includes('⚠️') || name.includes('غياب');

                                                return (
                                                    <div
                                                        key={`${name}-${i}`}
                                                        onClick={() => { if (isEditing) setShowModal({ day: day.id, type, index: i }); }}
                                                        className={`p-2 rounded-2xl font-black border-2 flex items-center gap-2 cursor-pointer transition-all min-w-0
                        ${isCarAbsence
                                                                ? 'bg-red-500 border-red-600 text-white shadow-md justify-center w-full py-10 my-4 text-sm'
                                                                : 'bg-white border-slate-100 text-slate-900 shadow-sm hover:border-emerald-200 text-[9px] min-h-[50px] w-[calc(50%-4px)] py-2'
                                                            }`}
                                                    >
                                                        {isEditing && (
                                                            <div className="flex-shrink-0">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newItems = [...items];
                                                                        newItems.splice(i, 1);
                                                                        setSchedule({ ...schedule, [day.id]: { ...schedule[day.id], [type]: newItems } });
                                                                    }}
                                                                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shadow-sm
                                    ${isCarAbsence ? 'bg-white/20 text-white hover:bg-white/40' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                                                                >
                                                                    <X size={10} strokeWidth={4} />
                                                                </button>
                                                            </div>
                                                        )}

                                                        <span className="leading-tight flex-1 text-center whitespace-normal break-words overflow-visible">
                                                            {name}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="w-full flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-widest italic opacity-40 py-10">
                                                فارغ
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}