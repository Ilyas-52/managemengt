'use client';
import { useMemo } from 'react'; // ✅ ضروري باش نرتبو بلا ما نقيسو الداتا الأصلية
import { Trophy, User, History, Check, Printer, X, AlertCircle, CalendarDays } from 'lucide-react';
import { generateWinnersPrint } from './PrintWinnersList';

import { Student, ExamResult, Agency } from '@/types/dashboard';

interface Props {
    students: Student[];
    examResults: ExamResult[];
    highlightedName: string | null;
    highlightExpiry: number;
    selectedAgency?: Agency | null;
    instructorName?: string;
    selectedDate: string;
}

export default function ManagerExams({ students, examResults, highlightedName, highlightExpiry, selectedAgency, instructorName, selectedDate }: Props) {

    // 🚀 المسمار اللي طلبيني عليه: كنغربلو غير اللي عندهم تاريخ الامتحان وبلا ما نمسحو أي معلومة
    const filteredAndSortedStudents = useMemo(() => {
        return students
            .filter(student => student.exam_date && student.exam_date.trim() !== '') // كيجيب غير اللي مبرمجين
            .sort((a, b) => {
                // ترتيب من الأقرب للأبعد
                return new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime();
            });
    }, [students]);

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-700 font-bold italic tracking-tighter pb-32 text-right" dir="rtl">

            {/* 🔝 بوطونات الطباعة (كتبقى كما هي) */}
            <div className="flex flex-col sm:flex-row justify-start items-center gap-4 px-2 no-print">
                <button
                    onClick={() => generateWinnersPrint(filteredAndSortedStudents, examResults, selectedDate)}
                    className="bg-emerald-600 border-2 border-emerald-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Trophy size={14} /> لائحة الناجحين (فقط)
                </button>
            </div>

            {/* ── شبكة النتائج المفلترة ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedStudents.map((student) => {
                    const name = `${student.first_name} ${student.last_name}`;
                    const result = examResults.find(r => r.student_name === name) || {} as Partial<ExamResult>;

                    // 🛡️ الحسابات بقات هي هي (ما تمسح والو)
                    const isTheory1Failed = result.theory_result === 'echoue';
                    const isTheory2Passed = result.theory_result_2 === 'admis';
                    const isTheory2Failed = result.theory_result_2 === 'echoue';
                    const isTheoryPassed = result.theory_result === 'admis' || isTheory2Passed;
                    const usedLifeInTheory = isTheory1Failed && isTheory2Passed;
                    const isEliminatedTheory = isTheory1Failed && isTheory2Failed;
                    const isEliminatedPractical = usedLifeInTheory && result.practical_result === 'echoue';
                    const isTotalFailure = isEliminatedTheory || isEliminatedPractical;
                    const isWinner = isTheoryPassed && (result.practical_result === 'admis' || result.practical_result_2 === 'admis');

                    const isHighlighted = highlightedName && (Date.now() < highlightExpiry) && (
                        name.toLowerCase().trim().includes(highlightedName.toLowerCase().trim())
                    );

                    return (
                        <div key={student.id}
                            className={`group relative border-2 transition-all duration-500 rounded-[35px] bg-white overflow-hidden 
                                    ${isHighlighted ? 'border-yellow-400 ring-4 ring-yellow-400/20' :
                                    isWinner ? 'border-emerald-500 shadow-xl' :
                                        isTotalFailure ? 'border-red-500 opacity-90' : 'border-slate-100 shadow-sm'}`}
                        >
                            {/* ── HEADER ── */}
                            <div className={`px-6 py-5 flex flex-col gap-2 border-b transition-colors 
                                    ${isWinner ? 'bg-emerald-50' : isTotalFailure ? 'bg-red-50' : 'bg-slate-50'}`}>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isWinner ? 'bg-emerald-500 text-white' : isTotalFailure ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            <User size={16} />
                                        </div>
                                        <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{name}</span>
                                    </div>

                                    {isWinner ? (
                                        <Trophy size={14} className="text-emerald-500 animate-pulse" />
                                    ) : isTotalFailure ? (
                                        <AlertCircle size={14} className="text-red-500" />
                                    ) : null}
                                </div>

                                {/* ✅ الإضافة الجديدة: تاريخ الامتحان تحت السمية بواضح */}
                                <div className="flex items-center gap-2 bg-white/60 w-fit px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                    <CalendarDays size={12} className="text-[#0F5A3E]" />
                                    <span className="text-[10px] font-black text-slate-700">موعد الامتحان: {student.exam_date}</span>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* 1. نتائج النظري (بقا كولشي هو هاداك) */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1 text-[9px] uppercase font-black text-slate-400 px-1">
                                        <History size={10} /> مسار النظري
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className={`p-2 rounded-2xl border text-center ${result.theory_result === 'admis' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : result.theory_result === 'echoue' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                            <p className="text-[10px] font-black">{result.theory_result === 'admis' ? 'ناجح' : result.theory_result === 'echoue' ? 'راسب' : '---'}</p>
                                        </div>
                                        <div className={`p-2 rounded-2xl border text-center ${result.theory_result_2 === 'admis' ? 'bg-blue-50 border-blue-200 text-blue-700' : result.theory_result_2 === 'echoue' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                            <p className="text-[10px] font-black">{result.theory_result_2 === 'admis' ? 'ناجح' : result.theory_result_2 === 'echoue' ? 'راسب' : '---'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. نتائج التطبيقي (بقا كولشي هو هاداك) */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1 text-[9px] uppercase font-black text-slate-400 px-1">
                                        <History size={10} /> مسار التطبيقي
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className={`p-2 rounded-2xl border text-center ${result.practical_result === 'admis' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : result.practical_result === 'echoue' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                            <p className="text-[10px] font-black">{result.practical_result === 'admis' ? 'ناجح' : result.practical_result === 'echoue' ? 'راسب' : '---'}</p>
                                        </div>
                                        <div className={`p-2 rounded-2xl border text-center ${result.practical_result_2 === 'admis' ? 'bg-blue-50 border-blue-200 text-blue-700' : result.practical_result_2 === 'echoue' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                            <p className="text-[10px] font-black">{result.practical_result_2 === 'admis' ? 'ناجح' : result.practical_result_2 === 'echoue' ? 'راسب' : '---'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. الخلاص (بقا كولشي هو هاداك) */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className={`h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${result.practical_paid === true ? 'bg-emerald-500 border-emerald-600 text-white' : result.practical_paid === false ? 'bg-red-500 border-red-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-300 border-dashed'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black">واجب الامتحان</span>
                                            {result.practical_paid === true ? <Check size={16} strokeWidth={4} /> : result.practical_paid === false ? <X size={16} strokeWidth={4} /> : <span className="text-[10px]">---</span>}
                                        </div>
                                    </div>

                                    <div className={`h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${result.is_dora === true ? 'bg-slate-900 border-slate-900 text-white' : result.is_dora === false ? 'bg-red-500 border-red-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-300 border-dashed'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black">الدورة الشرفية</span>
                                            {result.is_dora === true ? <Check size={16} strokeWidth={4} /> : result.is_dora === false ? <X size={16} strokeWidth={4} /> : <span className="text-[10px]">---</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* حالة إيلا ملقينا تا واحد مبرمج */}
                {filteredAndSortedStudents.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 italic">لا يوجد تلاميذ مبرمجون حالياً في هذه الوكالة</p>
                    </div>
                )}
            </div>
        </div>
    );
}