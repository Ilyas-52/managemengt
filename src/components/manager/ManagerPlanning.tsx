'use client';
import { Calendar, Clock, Printer } from 'lucide-react';
import { ScheduleData, Agency } from '@/types/dashboard';

interface Props {
    hamzaSchedule: ScheduleData | null;
    days: { id: string; label: string; }[];
    selectedAgency: Agency | null;
    instructorName: string;
}

export default function ManagerPlanning({ hamzaSchedule, days, selectedAgency, instructorName }: Props) {

    const handlePrintPlanning = () => {
        // 🚀 مسمار الحقيقة: كنشوفو شنو كاين فـ الداتا دابا نيشان
        console.log("البرنامج الحالي اللي غايتطبع:", hamzaSchedule);

        if (!hamzaSchedule) {
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

        // مسمار الفلتر: السبت ديما محيد
        const rows = weekDays.map(day => {
            const dayData = hamzaSchedule[day.key] || { morning: [], evening: [] };
            const morning = dayData.morning || [];
            const evening = dayData.evening || [];

            const morningText = morning.join(' ');
            const eveningText = evening.join(' ');

            // حضيّة منفصلة لكل فترة
            const isMorningAbsent = morningText.includes('غياب') || morningText.includes('صنف A') || morningText.includes('عطلة');
            const isEveningAbsent = eveningText.includes('غياب') || eveningText.includes('صنف A') || eveningText.includes('عطلة');

            // ركّز غير على هاد السطر وبدلو بحال هكا:
            const clean = (txt: string) => txt.replace(/تلاميذ|تلميذ/g, '').trim();
            // دالة التنسيق: كتعالج كل فترة بوحدها
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
                box-sizing: border-box; /* 🚀 هاد المسمار كيخلي كولشي لداخل بلا ما يخرج */
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
            // مسمار السطر: ما بقيناش غانجمعوه بـ colspan باش يبان كولشي
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
                    body { font-family: 'Tajawal', sans-serif; padding: 20px; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .header { text-align: center; border: 4px solid #000; padding: 15px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                    th, td { border: 2px solid #000; padding: 10px; text-align: center; font-weight: 700; }
                    th { background: #f2f2f2 !important; -webkit-print-color-adjust: exact !important; }
                    .day-cell { background: #f9f9f9 !important; width: 80px; font-weight: 900; }
                    .absent-row { 
                        background-color: #ff0000 !important; 
                        color: #ffffff !important; 
                        font-size: 16px !important; 
                        font-weight: 900 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>مـؤسـسـة ${selectedAgency?.name || 'بـوديـنـار'}</h1>
                    <div style="font-size: 14px; font-weight: 900;"> البرنامج الأسبوعي للحصص مع الأستاذ: ${instructorName}</div>
                </div>
                <table>
                    <thead><tr><th class="day-cell">اليوم</th><th>الصباح</th><th>المساء</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); };</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredDays = days.filter((d: any) => d.id !== 'saturday');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-black italic uppercase">
            <div className="flex justify-between items-center px-4 no-print">
                <div className="flex items-center gap-3 text-[#0F5A3E]">
                    <Calendar size={22} />
                    <h2 className="text-sm font-black uppercase tracking-tighter">برنامج الحصص: {instructorName}</h2>
                </div>

                <button
                    onClick={handlePrintPlanning}
                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[11px] font-black shadow-xl hover:bg-[#0F5A3E] transition-all active:scale-95"
                >
                    <Printer size={16} /> استخراج البرنامج (PDF)
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full print-content" dir="rtl">
                {filteredDays.map((day) => (
                    <div key={day.id} className="bg-white border border-slate-200 rounded-[30px] overflow-hidden shadow-sm h-fit transition-all hover:shadow-md">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 text-center text-[#0F5A3E] font-black text-xs uppercase italic">
                            {day.label}
                        </div>
                        <div className="p-4 space-y-6">
                            {['morning', 'evening'].map(type => {
                                const sessionTasks = hamzaSchedule?.[day.id]?.[type] || [];
                                return (
                                    <div key={type} className="session-container">
                                        <span className="session-title text-[8px] text-slate-400 flex items-center gap-1 uppercase tracking-widest font-black mb-3">
                                            <Clock size={10} /> {type === 'morning' ? 'الصباح (09-13)' : 'المساء (15-18)'}
                                        </span>
                                        <div className="space-y-2">
                                            {sessionTasks.length > 0 ? (
                                                sessionTasks.map((name: string, i: number) => {
                                                    const isSpecial = name.includes('غياب') || name.includes('عطلة') || name.includes('صنف A');
                                                    return (
                                                        <div key={i} className={`p-3 rounded-xl border text-[9px] font-black truncate shadow-sm transition-all ${isSpecial ? 'bg-red-600 text-white border-red-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                            {isSpecial ? '⚠️ ' : ''}{name}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-[9px] text-slate-300 italic py-2">لا توجد حصص</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}