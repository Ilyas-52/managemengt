'use client';
import { CheckCircle2, PlusCircle } from 'lucide-react';

import { Student, AttendanceRecord } from '@/types/dashboard';

interface Props {
    students: Student[];
    attendanceData: AttendanceRecord[];
    toggleLesson: (studentId: string, name: string, lessonNum: number, currentStatus: boolean) => Promise<void>;
}

export default function HamzaAttendance({ students, attendanceData, toggleLesson }: Props) {
    const baseLessons = 12;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-[#04b55f] italic uppercase px-2">✅ تتبع الحصص المنجزة</h2>

            {/* 📱 نسخة التليفون: بطاقات (Cards) مطورة وديناميكية */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
                {students.map((student) => {
                    const name = `${student.first_name} ${student.last_name}`;
                    const record = attendanceData.find(a => a.student_id === student.id) || {} as Partial<AttendanceRecord>;

                    // جلب الحصص الإضافية
                    const extras = Array.isArray(record.extra_lessons) ? record.extra_lessons : [];
                    const lastExtraLesson = extras.length > 0 ? Math.max(...extras) : baseLessons;

                    return (
                        <div key={student.id} className="bg-white border-2 border-slate-100 rounded-[30px] p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                                <span className="font-black text-slate-800 italic text-lg">{name}</span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black uppercase">مرشح</span>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                {/* 1. الحصص الأساسية (1-12) */}
                                {Array.from({ length: baseLessons }).map((_, i) => {
                                    const lessonNum = i + 1;
                                    const isDone = !!record[`s${lessonNum}`];
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => toggleLesson(student.id, name, lessonNum, isDone)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-90 ${isDone ? 'bg-[#04b55f] border-[#04b55f] text-white' : 'bg-white border-slate-100 text-slate-300'}`}
                                        >
                                            <span className="text-[9px] font-black mb-1">ح{lessonNum}</span>
                                            <CheckCircle2 size={16} strokeWidth={isDone ? 3 : 2} />
                                        </button>
                                    );
                                })}

                                {/* 2. الحصص الإضافية */}
                                {extras.sort((a: number, b: number) => a - b).map((num: number) => (
                                    <button
                                        key={num}
                                        onClick={() => toggleLesson(student.id, name, num, true)}
                                        className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 bg-[#04b55f] border-[#04b55f] text-white transition-all active:scale-90"
                                    >
                                        <span className="text-[9px] font-black mb-1">ح{num}</span>
                                        <CheckCircle2 size={16} strokeWidth={3} />
                                    </button>
                                ))}

                                {/* 3. بوطونة الـ + فالتليفون */}
                                <button
                                    onClick={() => toggleLesson(student.id, name, lastExtraLesson + 1, false)}
                                    className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 hover:border-[#04b55f] hover:text-[#04b55f] transition-all active:scale-95"
                                >
                                    <span className="text-[9px] font-black mb-1">إضافة</span>
                                    <PlusCircle size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 💻 نسخة الـ PC */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto no-scrollbar border-2 border-slate-100 rounded-[40px] shadow-sm bg-white">
                    <table className="w-full text-right border-separate border-spacing-0" dir="rtl">
                        <thead className="bg-slate-50/50">
                            <tr className="text-[10px] text-slate-400 font-black uppercase italic">
                                <th className="py-5 px-6 text-sm font-black text-slate-800 text-right sticky right-0 z-[60] bg-white border-l-2 border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0,02)]">اسم المرشح</th>
                                {Array.from({ length: Math.max(baseLessons, ...attendanceData.map(a => (Array.isArray(a.extra_lessons) ? Math.max(0, ...a.extra_lessons) : 0))) }).map((_, i) => (
                                    <th key={i} className="text-center py-5 min-w-[60px]">ح{i + 1}</th>
                                ))}
                                <th className="w-20"></th>
                            </tr>
                        </thead>

                        <tbody>
                            {students.map((student) => {
                                const name = `${student.first_name} ${student.last_name}`;
                                const record = attendanceData.find(a => a.student_id === student.id) || {} as Partial<AttendanceRecord>;
                                const extras = Array.isArray(record.extra_lessons) ? record.extra_lessons : [];
                                const lastExtraLesson = extras.length > 0 ? Math.max(...extras) : baseLessons;

                                return (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6 text-sm font-black text-slate-700 italic sticky right-0 z-20 bg-white border-l-2 border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0,02)]">
                                            {name}
                                        </td>
                                        {Array.from({ length: baseLessons }).map((_, i) => {
                                            const lessonNum = i + 1;
                                            const isDone = !!record[`s${lessonNum}`];
                                            return (
                                                <td key={i} className="p-2 text-center border-b border-slate-50">
                                                    <button
                                                        onClick={() => toggleLesson(student.id, name, lessonNum, isDone)}
                                                        className={`w-10 h-10 rounded-2xl border-2 transition-all flex items-center justify-center mx-auto shadow-sm active:scale-90 ${isDone ? 'bg-[#04b55f] border-[#04b55f] text-white' : 'bg-white border-slate-200 text-slate-200 hover:border-[#04b55f]'}`}
                                                    >
                                                        <CheckCircle2 size={18} strokeWidth={isDone ? 3 : 2} />
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        {extras.sort((a: number, b: number) => a - b).map((num: number) => (
                                            <td key={num} className="p-2 text-center border-b border-slate-50">
                                                <button
                                                    onClick={() => toggleLesson(student.id, name, num, true)}
                                                    className="w-10 h-10 rounded-2xl border-2 bg-[#04b55f] border-[#04b55f] text-white transition-all flex items-center justify-center mx-auto shadow-sm"
                                                >
                                                    <CheckCircle2 size={18} strokeWidth={3} />
                                                </button>
                                            </td>
                                        ))}
                                        <td className="p-2 text-center border-b border-slate-50">
                                            <button
                                                onClick={() => toggleLesson(student.id, name, lastExtraLesson + 1, false)}
                                                className="w-10 h-10 rounded-2xl border-2 border-dashed border-slate-300 text-slate-300 hover:border-[#04b55f] hover:text-[#04b55f] hover:bg-emerald-50 transition-all flex items-center justify-center mx-auto group-hover:scale-110 shadow-sm"
                                                title="إضافة حصة إضافية"
                                            >
                                                <PlusCircle size={22} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}