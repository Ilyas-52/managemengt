'use client';
import { useState, useMemo } from 'react';
import {
    User, CheckCircle2, Save, Check, X,
    GraduationCap, Car, BadgeDollarSign, Flag, LockIcon,
    AlertCircle, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Student, ExamResult } from '@/types/dashboard';
import { generateDetailedExamsPrint } from '@/components/manager/PrintDetailedResults';

interface Props {
    students: Student[];
    examResults: ExamResult[];
    updateResult: (studentId: string, studentName: string, field: string, value: any) => Promise<void>;
    selectedAgency: any;
}

export default function HamzaResults({ students, examResults, updateResult, selectedAgency }: Props) {
    const [localChanges, setLocalChanges] = useState<Record<string, Partial<ExamResult>>>({});
    const [loading, setLoading] = useState<string | null>(null); // كايشد الـ ID ديال التلميذ اللي كيتحفظ دابا

    const handleLocalUpdate = (studentId: string, field: string, value: any) => {
        setLocalChanges((prev) => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [field]: value
            }
        }));
    };

    // 🚀 المسمار: ترتيب الطلبة حسب التاريخ للطباعة
    const sortedStudentsForPrint = useMemo(() => {
        return students
            .filter(student =>
                (student.exam_date && student.exam_date.trim() !== '') &&
                (student.agence_id === selectedAgency?.id)
            )
            .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime());
    }, [students, selectedAgency]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-24 italic text-right" dir="rtl">

            {/* 🔝 بوطون استخراج النتائج (جديد عند حمزة) */}
            <div className="flex justify-start px-2 no-print">
                <button
                    onClick={() => generateDetailedExamsPrint(sortedStudentsForPrint, examResults, selectedAgency?.name)}
                    className="bg-slate-900 text-white px-8 py-4 rounded-3xl text-[11px] font-black shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Printer size={16} /> استخراج تقرير النتائج الشهري (PDF)
                </button>
            </div>

            {students
                .filter(student =>
                    // ✅ الشرط 1: يكون عندو تاريخ امتحان مبرمج
                    (student.exam_date && student.exam_date.trim() !== '') &&
                    // ✅ الشرط 2: يكون تابع لهاد الوكالة
                    (student.agence_id === selectedAgency?.id)
                )
                .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime())
                .map((student) => {
                    const name = `${student.first_name} ${student.last_name}`;
                    const dbRecord = examResults.find(r => r.student_id === student.id) || {} as Partial<ExamResult>;
                    const currentChanges = localChanges[student.id] || {} as Partial<ExamResult>;
                    const record = { ...dbRecord, ...currentChanges };

                    // 🛡️ حساب قوانين الإقصاء
                    const isTheory1Failed = record.theory_result === 'echoue';
                    const isTheory2Passed = record.theory_result_2 === 'admis';
                    const isTheory2Failed = record.theory_result_2 === 'echoue';

                    // 1. واش مقصي نهائياً فـ النظري؟ (سقط فـ 1 و 2)
                    const isEliminatedTheory = isTheory1Failed && isTheory2Failed;

                    // 2. واش استهلك حق الخطأ فـ النظري؟ (سقط فـ 1 ونجح فـ 2)
                    const usedLifeInTheory = isTheory1Failed && isTheory2Passed;

                    // 3. واش مقصي نهائياً فـ التطبيقي؟ (نجح فـ النظري بـ صعوبة وسقط فـ أول تطبيق)
                    const isEliminatedPractical = usedLifeInTheory && record.practical_result === 'echoue';

                    // الوضعية النهائية (راسب نهائياً)
                    const isTotalFailure = isEliminatedTheory || isEliminatedPractical;

                    const isTheoryPassed = record.theory_result === 'admis' || isTheory2Passed;
                    const isPracticalPassed = record.practical_result === 'admis' || record.practical_result_2 === 'admis';
                    const isWinner = isTheoryPassed && isPracticalPassed;

                    const isLocked = (field: string) => !!dbRecord[field];

                    return (
                        <div key={student.id}
                            className={`bg-white border-2 rounded-[35px] overflow-hidden transition-all duration-500 
                        ${isWinner ? 'border-emerald-500 shadow-xl' : isTotalFailure ? 'border-red-500 opacity-90' : 'border-slate-100 shadow-sm'}`}>

                            {/* ── HEADER ── */}
                            <div className={`px-6 py-5 flex justify-between items-center ${isWinner ? 'bg-emerald-50' : isTotalFailure ? 'bg-red-50' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isWinner ? 'bg-emerald-500 text-white' : isTotalFailure ? 'bg-red-500 text-white' : 'bg-white text-slate-400'}`}>
                                        <User size={18} />
                                    </div>
                                    <div className="flex flex-col text-right">
                                        {/* 👤 الاسم الكامل للمترشح */}
                                        <span className="text-base font-black text-slate-800 tracking-tight uppercase leading-none mb-1">
                                            {name}
                                        </span>

                                        {/* 📅 تاريخ الامتحان (المسمار الجديد) */}
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <span className="text-[10px] font-bold italic text-slate-500">
                                                موعد الامتحان: {student.exam_date}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {isWinner ? (
                                    <div className="bg-emerald-500 text-white px-5 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                                        <span className="text-[11px] font-black italic">نـاجـح نـهـائـيـاً</span>
                                        <CheckCircle2 size={18} className="animate-pulse" />
                                    </div>
                                ) : isTotalFailure ? (
                                    <div className="bg-red-500 text-white px-5 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                                        <span className="text-[11px] font-black italic">راسب نهائياً</span>
                                        <AlertCircle size={18} />
                                    </div>
                                ) : null}
                            </div>

                            <div className="p-6 space-y-10">
                                {/* ── 🎓 SECTION 01: THEORY ── */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 bg-slate-100/80 w-fit px-4 py-1.5 rounded-full border border-slate-200/50">
                                        <GraduationCap size={14} className="text-slate-600" />
                                        <span className="text-[11px] text-slate-700 font-black uppercase tracking-wider">الامتحان النظري</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        {['theory_result', 'theory_result_2'].map((field, i) => (
                                            <div key={field} className={`space-y-3 ${(i === 1 && record.theory_result !== 'echoue') ? 'opacity-30' : ''}`}>
                                                <span className="text-[10px] text-slate-400 font-black uppercase pr-2">الدورة 0{i + 1}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleLocalUpdate(student.id, field, 'admis')} disabled={isLocked(field) || (i === 1 && record.theory_result !== 'echoue') || (i === 1 && isLocked('theory_result_2'))}
                                                        className={`flex-1 h-12 rounded-2xl text-[11px] font-black transition-all border-2 ${record[field] === 'admis' ? 'bg-[#1dbf73] border-[#1dbf73] text-white' : 'bg-white border-slate-100 text-slate-300'}`}>ناجح</button>
                                                    <button onClick={() => handleLocalUpdate(student.id, field, 'echoue')} disabled={isLocked(field) || (i === 1 && record.theory_result !== 'echoue') || (i === 1 && isLocked('theory_result_2'))}
                                                        className={`flex-1 h-12 rounded-2xl text-[11px] font-black transition-all border-2 ${record[field] === 'echoue' ? 'bg-[#ef4444] border-[#ef4444] text-white' : 'bg-white border-slate-100 text-slate-300'}`}>راسب</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 🛡️ القفل 1: فتح التطبيقي */}
                                <AnimatePresence mode="wait">
                                    {!isTheoryPassed || isEliminatedTheory ? (
                                        <motion.div key="lock1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center justify-center gap-3">
                                            <LockIcon size={20} className="text-slate-300" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                                {isEliminatedTheory ? "المرشح رسب نهائياً في النظري" : "في انتظار النجاح في النظري لفتح التطبيقي"}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="section2" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-10">

                                            {/* ── 🚗 SECTION 02: PRACTICAL ── */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 bg-slate-100/80 w-fit px-4 py-1.5 rounded-full border border-slate-200/50">
                                                    <Car size={14} className="text-slate-600" />
                                                    <span className="text-[11px] text-slate-700 font-black uppercase tracking-wider">الامتحان التطبيقي</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    {/* الدورة 01 تطبيقي */}
                                                    <div className="space-y-3">
                                                        <span className="text-[10px] text-slate-400 font-black uppercase pr-2">الدورة 01</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleLocalUpdate(student.id, 'practical_result', 'admis')} disabled={isLocked('practical_result')}
                                                                className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${record.practical_result === 'admis' ? 'bg-[#1dbf73] border-[#1dbf73] text-white' : 'bg-white border-slate-100 text-slate-300'}`}>ناجح</button>
                                                            <button onClick={() => handleLocalUpdate(student.id, 'practical_result', 'echoue')} disabled={isLocked('practical_result')}
                                                                className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${record.practical_result === 'echoue' ? 'bg-[#ef4444] border-[#ef4444] text-white' : 'bg-white border-slate-100 text-slate-300'}`}>راسب</button>
                                                        </div>
                                                    </div>

                                                    {/* الدورة 02 تطبيقي (الممنوعة إلا سقط فـ النظري 1) */}
                                                    <div className={`space-y-3 ${(record.practical_result !== 'echoue' || usedLifeInTheory) ? 'opacity-30' : ''}`}>
                                                        <span className="text-[10px] text-slate-400 font-black uppercase pr-2">الدورة 02</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleLocalUpdate(student.id, 'practical_result_2', 'admis')} disabled={isLocked('practical_result_2') || record.practical_result !== 'echoue' || usedLifeInTheory}
                                                                className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${record.practical_result_2 === 'admis' ? 'bg-[#1dbf73] border-[#1dbf73] text-white' : 'bg-white border-slate-100 text-slate-300'}`}>ناجح</button>
                                                            <button onClick={() => handleLocalUpdate(student.id, 'practical_result_2', 'echoue')} disabled={isLocked('practical_result_2') || record.practical_result !== 'echoue' || usedLifeInTheory}
                                                                className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${record.practical_result_2 === 'echoue' ? 'bg-[#ef4444] border-[#ef4444] text-white' : 'bg-white border-slate-100 text-slate-300'}`}>راسب</button>
                                                        </div>
                                                        {usedLifeInTheory && record.practical_result === 'echoue' && (
                                                            <p className="text-[9px] text-red-500 font-bold mt-1 text-center">⚠️ مقصي نهائياً</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 🛡️ القفل 2: فتح الخلاص */}
                                            <AnimatePresence mode="wait">
                                                {(!isPracticalPassed || isEliminatedPractical) ? (
                                                    <motion.div key="lock2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-6 border-2 border-dashed rounded-[30px] flex flex-col items-center justify-center gap-3 ${isEliminatedPractical ? 'bg-red-50 border-red-100' : 'bg-emerald-50/30 border-emerald-100'}`}>
                                                        <BadgeDollarSign size={20} className={isEliminatedPractical ? 'text-red-300' : 'text-emerald-200'} />
                                                        <p className={`text-[10px] font-black uppercase tracking-widest text-center ${isEliminatedPractical ? 'text-red-400' : 'text-emerald-300'}`}>
                                                            {isEliminatedPractical ? " المرشح مقصي نهائياً" : "بانتظار النجاح في التطبيقي"}
                                                        </p>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div key="section3" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pt-8 border-t-2 border-slate-50 grid grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 bg-emerald-100/50 w-fit px-4 py-1.5 rounded-full border border-emerald-200/50">
                                                                <BadgeDollarSign size={14} className="text-emerald-600" />
                                                                <span className="text-[11px] text-emerald-700 font-black uppercase tracking-wider">واجب الامتحان</span>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <button onClick={() => handleLocalUpdate(student.id, 'practical_paid', true)} className={`flex-1 h-12 rounded-[20px] flex items-center justify-center transition-all ${record.practical_paid === true ? 'bg-emerald-500 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-300'}`}><Check size={20} strokeWidth={4} /></button>
                                                                <button onClick={() => handleLocalUpdate(student.id, 'practical_paid', false)} className={`flex-1 h-12 rounded-[20px] flex items-center justify-center transition-all ${record.practical_paid === false ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-300'}`}><X size={20} strokeWidth={4} /></button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 bg-slate-100/80 w-fit px-4 py-1.5 rounded-full border border-slate-200/50">
                                                                <Flag size={14} className="text-slate-600" />
                                                                <span className="text-[11px] text-slate-700 font-black uppercase tracking-wider">الدورة الشرفية</span>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <button onClick={() => handleLocalUpdate(student.id, 'is_dora', true)} className={`flex-1 h-12 rounded-[20px] flex items-center justify-center transition-all ${record.is_dora === true ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-300'}`}><Check size={20} strokeWidth={4} /></button>
                                                                <button onClick={() => handleLocalUpdate(student.id, 'is_dora', false)} className={`flex-1 h-12 rounded-[20px] flex items-center justify-center transition-all ${record.is_dora === false ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-300'}`}><X size={20} strokeWidth={4} /></button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {localChanges[student.id] && (
                                    <motion.button
                                        disabled={loading === student.id}
                                        onClick={async () => {
                                            setLoading(student.id);
                                            try {
                                                // 1️⃣ كناخدو نسخة من التغييرات اللي دار حمزة
                                                const rawData = { ...localChanges[student.id] };

                                                // 2️⃣ 🚀 المسمار: كنحيدو التاريخ من البيانات قبل ما نصيفطوها للحفظ
                                                // هاد السطر كيعزل التاريخ بوحدو وكيخلي "dataToSave" فيها غير النتائج
                                                const { exam_date, ...dataToSave } = rawData;

                                                // 3️⃣ دبا صيفط "dataToSave" وبلا ما تبدل والو فـ Supabase
                                                await updateResult(
                                                    student.id,
                                                    name,
                                                    'bulk_update',
                                                    dataToSave // ✅ هادي هي اللي غاتحفظ دابا بلا Error
                                                );

                                                setLocalChanges(prev => {
                                                    const newChanges = { ...prev };
                                                    delete newChanges[student.id];
                                                    return newChanges;
                                                });
                                            } catch (err: any) {
                                                console.error("❌ Error:", err.message);
                                            } finally {
                                                setLoading(null);
                                            }
                                        }}
                                        className={`w-full h-16 rounded-[25px] font-black text-sm flex items-center justify-center gap-3 shadow-2xl transition-all
            ${loading === student.id ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-[#1dbf73]'}`}
                                    >
                                        {loading === student.id ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        {loading === student.id ? 'جـاري الـحـفـظ...' : 'تـأكـيـد وحـفـظ الـنـتـائـج'}
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    );
                })}
        </motion.div>
    );
}