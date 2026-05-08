'use client';
import { useState } from 'react';
import { MessageSquareWarning, CarFront, GraduationCap, ChevronRight, CheckCircle2, Bike } from 'lucide-react'; // زدنا أيقونات للتنبيه

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    pratique_note?: string; // 🚀 زدناها هنا باش السيستيم يقرأ الميساج
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
    const [isCarAbsent, setIsCarAbsent] = useState(false);
    const [studentCount, setStudentCount] = useState(4);
    const [step, setStep] = useState<'list' | 'reason' | 'count'>('list');
    const [selectedReason, setSelectedReason] = useState('');

    if (!showModal) return null;

    const handleClose = () => {
        setIsCarAbsent(false);
        setStep('list');
        setSelectedReason('');
        setShowModal(null);
    };

    return (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-xl flex items-center justify-center z-[300] p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-white border border-slate-200 rounded-[50px] w-full max-w-xl overflow-hidden shadow-2xl">

                {/* Header ذكي كيتبدل على حساب الخطوة */}
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

                    {/* 🟢 المرحلة 1: قائمة التلاميذ العادية */}
                    {step === 'list' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setStep('reason')}
                                className="col-span-1 sm:col-span-2 h-20 bg-rose-500 text-white rounded-3xl font-black text-lg mb-4 shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <CarFront size={24} /> ⚠️ غياب السيارة
                            </button>

                            {students.map(s => (
                                <div key={s.id} className="relative">
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
                                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 font-black text-[11px] hover:bg-[#04b55f] hover:text-white transition-all shadow-sm"
                                    >
                                        {s.first_name} {s.last_name}
                                    </button>
                                    {s.pratique_note && <div className="absolute -top-2 -right-1 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-lg animate-bounce border-2 border-white uppercase">تنبيه!</div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🟡 المرحلة 2: اختيار سبب الغياب */}
                    {step === 'reason' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                            {/* خيار 1: امتحان (كيدوز لعدد التلاميذ) */}
                            <button
                                onClick={() => { setSelectedReason('بسبب امتحان 🎓'); setStep('count'); }}
                                className="w-full p-6 bg-amber-50 border-2 border-amber-100 rounded-[30px] flex items-center justify-between text-amber-700 hover:bg-amber-100 transition-all"
                            >
                                <div className="flex items-center gap-4 text-lg">
                                    <GraduationCap size={28} /> بسبب امتحان
                                </div>
                                <ChevronRight />
                            </button>

                            {/* خيار 2: غياب عادي (كيتسجل نيشان) */}
                            <button
                                onClick={() => { addOrUpdateStudent("غياب السيارة ⚠️"); handleClose(); }}
                                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] flex items-center justify-between text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <div className="flex items-center gap-4 text-lg">
                                    <CarFront size={28} /> غياب السيارة
                                </div>
                                <CheckCircle2 className="text-emerald-500" />
                            </button>

                            {/* خيار 3: صنف A (كيتسجل نيشان) */}
                            {/* خيار 3: صنف A (الميساج اللي بغيتي) */}
                            <button
                                onClick={() => {
                                    // 🚀 هاد الجملة هي اللي غاتطلع فـ الجدول (Emploi)
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
                                    <ChevronRight size={20} />
                                </div>
                            </button>
                        </div>
                    )}

                    {/* 🔴 المرحلة 3: عدد التلاميذ (كتطلع غير فاش كيكون الامتحان) */}
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