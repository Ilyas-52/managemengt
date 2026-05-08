'use client';
import { Activity, Printer, CheckCircle2, UserCircle } from 'lucide-react';

import { Student, AttendanceRecord, Agency } from '@/types/dashboard';

interface Props {
    students: Student[];
    hamzaAttendance: AttendanceRecord[];
    selectedAgency?: Agency | null;
    instructorName?: string;
}

export default function ManagerSuivi({ students, hamzaAttendance, selectedAgency, instructorName }: Props) {
    const baseLessons = 12;

    // 🚀 تحديث محرك الـ PDF باش يبين الحصص الإضافية
    const handlePrint = () => {
        // حساب أقصى عدد حصص كاين ف الداتا كاملة
        const maxLessonOverall = Math.max(baseLessons, ...hamzaAttendance.map(a =>
            Array.isArray(a.extra_lessons) ? Math.max(0, ...a.extra_lessons) : 0
        ));

        const rows = students.map(student => {
            const fullName = `${student.first_name} ${student.last_name}`;
            const record = hamzaAttendance.find(a => a.student_id === student.id) || {} as Partial<AttendanceRecord>;
            const extras = Array.isArray(record.extra_lessons) ? record.extra_lessons : [];

            let totalDone = 0;

            // خلايا الحصص الأساسية + الإضافية
            const cells = Array.from({ length: maxLessonOverall }).map((_, i) => {
                const num = i + 1;
                let isDone = false;
                if (num <= baseLessons) {
                    isDone = !!record[`s${num}`];
                } else {
                    isDone = extras.includes(num);
                }
                if (isDone) totalDone++;
                return `<td style="${num > baseLessons ? 'background-color: #f0f9ff;' : ''}">${isDone ? '<span class="check-icon">✓</span>' : ''}</td>`;
            }).join('');

            return `
            <tr>
                <td class="student-name">${fullName}</td>
                ${cells}
                <td class="total-cell">${totalDone}</td>
            </tr>
        `;
        }).join('');

        const htmlContent = `
        <html>
            <head>
                <title>تقرير تتبع الحصص</title>
                <style>
                    @page { size: A4 landscape; margin: 5mm; }
                    body { font-family: 'Arial', sans-serif; dir: rtl; padding: 10px; color: #000; }
                    .header { text-align: center; margin-bottom: 15px; border-bottom: 4px solid #04b55f; padding-bottom: 10px; }
                    table { width: 100% !important; border-collapse: collapse; }
                    th, td { border: 1.5px solid #333; padding: 4px 2px; text-align: center; font-size: 9px; }
                    th { background-color: #f8f8f8; font-weight: bold; }
                    .student-name { text-align: right; padding-right: 8px; width: 120px; font-weight: bold; }
                    .total-cell { background-color: #f0fdf4; font-weight: 900; color: #04b55f; width: 40px; }
                    .check-icon { color: #04b55f; font-size: 14px; font-weight: 900; }
                </style>
            </head>
            <body dir="rtl">
                <div class="header">
                    <h1>Auto Ecole ${selectedAgency?.name || 'Boudinar'}</h1>
                    <p style="font-size: 10px; font-weight: bold;">سجل تتبع حصص السياقة (نظام الحصص الديناميكي)</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 120px;">المرشح</th>
                            ${Array.from({ length: maxLessonOverall }).map((_, i) => `<th>ح${i + 1}</th>`).join('')}
                            <th style="width: 40px;">المجموع</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
        </html>`;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert("يرجى السماح بالـ Pop-ups");
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); }, 800);
    };

    return (
        <div className="space-y-6 overflow-x-hidden font-black italic tracking-tighter w-full pb-24 px-1 sm:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print px-3">
                <h2 className="text-lg font-black text-[#04b55f] flex items-center gap-2 uppercase">
                    <Activity size={20} /> تتبع الحصص العام
                </h2>
                <button onClick={handlePrint} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-[22px] text-xs font-black shadow-xl hover:bg-black transition-all active:scale-95">
                    <Printer size={18} /> استخراج PDF
                </button>
            </div>

            {/* 📱 نسخة التليفون: Cards */}
            <div className="grid grid-cols-1 gap-4 sm:hidden px-3">
                {students.map(student => {
                    const fullName = `${student.first_name} ${student.last_name}`;
                    const record = hamzaAttendance.find(a => a.student_id === student.id) || {} as Partial<AttendanceRecord>;
                    const extras = Array.isArray(record.extra_lessons) ? record.extra_lessons : [];

                    let totalDone = 0;
                    // حساب الأساسي
                    Array.from({ length: 12 }).forEach((_, i) => { if (!!record[`s${i + 1}`]) totalDone++; });
                    // حساب الإضافي
                    totalDone += extras.length;

                    return (
                        <div key={student.id} className="bg-white border-2 border-slate-900 rounded-[30px] p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <UserCircle size={20} className="text-slate-400" />
                                    <span className="font-black text-slate-900 text-base">{fullName}</span>
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">
                                    {totalDone} حصة منجزة
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {/* عرض الأساسي */}
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${!!record[`s${i + 1}`] ? 'bg-[#04b55f] border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-transparent'}`}>
                                        <CheckCircle2 size={12} strokeWidth={4} />
                                    </div>
                                ))}
                                {/* عرض الإضافي بـ لون أزرق خفيف للتمييز */}
                                {extras.sort((a: number, b: number) => a - b).map((num: number) => (
                                    <div key={num} className="w-8 h-8 rounded-lg flex items-center justify-center border-2 bg-blue-500 border-slate-900 text-white">
                                        <CheckCircle2 size={12} strokeWidth={4} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 💻 نسخة الـ PC: الطابلو البيطوني */}
            <div className="hidden sm:block bg-white border-2 border-slate-900 rounded-[35px] overflow-hidden">
                <div className="overflow-x-auto w-full no-scrollbar">
                    <table className="w-full text-right min-w-[900px] border-separate border-spacing-0" dir="rtl">
                        <thead className="bg-slate-900 text-white">
                            <tr className="text-[11px] font-black uppercase">
                                <th className="py-5 px-6 sticky right-0 bg-slate-900 z-30 border-l border-white/10">المرشح</th>
                                {Array.from({ length: Math.max(baseLessons, ...hamzaAttendance.map(a => Array.isArray(a.extra_lessons) ? Math.max(0, ...a.extra_lessons) : 0)) }).map((_, i) => (
                                    <th key={i} className="text-center min-w-[50px]">ح{i + 1}</th>
                                ))}
                                <th className="text-center bg-emerald-600 w-24">المجموع</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                            {students.map(student => {
                                const fullName = `${student.first_name} ${student.last_name}`;
                                const record = hamzaAttendance.find(a => a.student_id === student.id) || {} as Partial<AttendanceRecord>;
                                const extras = Array.isArray(record.extra_lessons) ? record.extra_lessons : [];

                                const maxL = Math.max(baseLessons, ...hamzaAttendance.map(a => Array.isArray(a.extra_lessons) ? Math.max(0, ...a.extra_lessons) : 0));
                                let totalDone = 0;

                                return (
                                    <tr key={student.id} className="hover:bg-emerald-50/30 group transition-all">
                                        <td className="py-5 px-6 text-sm font-black text-slate-900 italic sticky right-0 bg-white z-20 group-hover:bg-emerald-50/30 border-l-2 border-slate-100">{fullName}</td>
                                        {Array.from({ length: maxL }).map((_, i) => {
                                            const num = i + 1;
                                            let isDone = false;
                                            if (num <= baseLessons) isDone = !!record[`s${num}`];
                                            else isDone = extras.includes(num);

                                            if (isDone) totalDone++;

                                            return (
                                                <td key={i} className="p-2 text-center">
                                                    <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center mx-auto ${isDone ? (num > 12 ? 'bg-blue-500 border-slate-900' : 'bg-[#04b55f] border-slate-900') : 'bg-slate-50 border-slate-200 text-transparent'} text-white shadow-sm`}>
                                                        <CheckCircle2 size={16} strokeWidth={3} />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="text-center font-black text-emerald-600 bg-emerald-50/50 text-sm">{totalDone}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}