'use client';
import { useState } from 'react';
import { MessageSquareWarning, CarFront, GraduationCap, ChevronRight, CheckCircle2, Bike, Clock } from 'lucide-react';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    pratique_note?: string;
    registration_date?: string;
    created_at?: string; // 🚀 المسمار: رجعناها _date باش تطابق الداتابيز
}

interface ModalProps {
    showModal: { day: string; type: string; index?: number } | null;
    setShowModal: (val: null) => void;
    students: Student[];
    addOrUpdateStudent: (name: string) => void;
}

export default function HamzaPlanningModal({
    showModal,
    setShowModal,
    students,
    addOrUpdateStudent
}: ModalProps) {
    const [step, setStep] = useState<'list' | 'reason' | 'count'>('list');
    const [selectedReason, setSelectedReason] = useState('');

    if (!showModal) return null;

    const handleClose = () => {
        setStep('list');
        setSelectedReason('');
        setShowModal(null);
    };

    // 🕵️‍♂️ مسمار حساب "الجديد" بناءً على تاريخ الداتابيز (registration_date)
    const isNewStudent = (dateStr?: string) => {
        if (!dateStr) return false;
        const regDate = new Date(dateStr);
        const today = new Date();

        // مقارنة اليوم والشهر والسنة
        return regDate.getDate() === today.getDate() &&
            regDate.getMonth() === today.getMonth() &&
            regDate.getFullYear() === today.getFullYear();
    };

    return (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-xl flex items-center justify-center z-[300] p-4 animate-in fade-in zoom-in duration-300 text-right" dir="rtl">
            <div className="bg-white border border-slate-200 rounded-[50px] w-full max-w-xl overflow-hidden shadow-2xl">

                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-black text-slate-800 italic uppercase">
                        {step === 'list' && 'اختر المرشح'}
                        {step === 'reason' && 'سبب الغياب؟'}
                        {step === 'count' && 'عدد التلاميذ '}
                    </h3>
                    <button onClick={handleClose} className="text-slate-400 text-4xl hover:text-red-500 transition-colors">
                        &times;
                    </button>
                </div>

                <div className="p-8 max-h-[500px] overflow-y-auto no-scrollbar italic font-black uppercase">

                    {step === 'list' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setStep('reason')}
                                className="col-span-1 sm:col-span-2 h-20 bg-rose-500 text-white rounded-3xl font-black text-lg mb-4 shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <CarFront size={24} /> ⚠️ غياب السيارة
                            </button>

                            {students.map(s => (
                                <div key={s.id} className="relative group">
                                    <button
                                        onClick={() => {
                                            if (s.pratique_note && s.pratique_note.trim() !== '') {
                                                if (window.confirm(`📢 تنبيه المدير يونس: "${s.pratique_note}"`)) {
                                                    addOrUpdateStudent(`${s.first_name} ${s.last_name}`);
                                                    handleClose();
                                                }
                                                return;
                                            }
                                            addOrUpdateStudent(`${s.first_name} ${s.last_name}`);
                                            handleClose();
                                        }}
                                        className="w-full min-h-[95px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 font-black hover:bg-[#04b55f] hover:text-white transition-all shadow-sm flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px]">{s.first_name} {s.last_name}</span>
                                            {/* 🆕 مسمار الجديد بناءً على تاريخ التسجيل الفعلي */}
                                            {isNewStudent(s.registration_date) && (
                                                <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse shadow-sm border border-white">
                                                    جديد
                                                </span>
                                            )}
                                        </div>

                                        {/* 🕒 مسمار التاريخ والوقت الكامل (يوم/شهر/سنة ساعة:دقيقة) */}
                                        {s.registration_date && (
                                            <div className="flex items-center gap-1.5 text-[10px] opacity-70 font-bold bg-white/50 px-2 py-1 rounded-lg group-hover:bg-black/10 group-hover:text-white transition-colors" dir="ltr">
                                                <Clock size={12} />
                                                <span>
                                                    {/* 1. كناخدو النهار والشهر والسنة من تاريخ يوسف */}
                                                    {new Date(s.registration_date).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}

                                                    {' - '}

                                                    {/* 2. كناخدو الساعة والدقيقة من created_at (ديال السيرفر) */}
                                                    {s.created_at ? new Date(s.created_at).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : '00:00'}
                                                </span>
                                            </div>
                                        )}
                                    </button>

                                    {s.pratique_note && (
                                        <div className="absolute -top-2 -right-1 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-lg animate-bounce border-2 border-white uppercase z-10 shadow-md">
                                            تنبيه!
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 'reason' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                            <button
                                onClick={() => { setSelectedReason('بسبب امتحان 🎓'); setStep('count'); }}
                                className="w-full p-6 bg-amber-50 border-2 border-amber-100 rounded-[30px] flex items-center justify-between text-amber-700 hover:bg-amber-100 transition-all"
                            >
                                <div className="flex items-center gap-4 text-lg">
                                    <GraduationCap size={28} /> بسبب امتحان
                                </div>
                                <ChevronRight className="rotate-180" />
                            </button>

                            <button
                                onClick={() => { addOrUpdateStudent("غياب السيارة ⚠️"); handleClose(); }}
                                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] flex items-center justify-between text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <div className="flex items-center gap-4 text-lg">
                                    <CarFront size={28} /> غياب السيارة
                                </div>
                                <CheckCircle2 className="text-emerald-500" />
                            </button>

                            <button
                                onClick={() => {
                                    addOrUpdateStudent("غياب السيارة بسبب الحصة التطبيقية صنف A 🏍️");
                                    handleClose();
                                }}
                                className="w-full p-6 bg-blue-50 border-2 border-blue-100 rounded-[30px] flex items-center justify-between text-blue-700 hover:bg-blue-100 transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-4 text-lg font-black italic">
                                    <Bike size={28} className="animate-pulse" />
                                    <span>الحصة التطبيقية صنف A</span>
                                </div>
                                <div className="bg-blue-500 text-white p-2 rounded-full">
                                    <ChevronRight size={20} className="rotate-180" />
                                </div>
                            </button>
                        </div>
                    )}

                    {step === 'count' && (
                        <div className="grid grid-cols-3 gap-4 animate-in zoom-in duration-300">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        addOrUpdateStudent(`غياب السيارة ${selectedReason} (${num} تلاميد) ⚠️`);
                                        handleClose();
                                    }}
                                    className="h-20 bg-white border-2 border-amber-100 rounded-[30px] text-amber-600 text-2xl font-black hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-90"
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}