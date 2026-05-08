'use client';

import {
    Calendar, Plus, Clock, Activity, Save, ShieldCheck, X, Unlock, Lock, Trash2
} from 'lucide-react';

import { ScheduleData } from '@/types/dashboard';

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

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── CONTROL BAR ── */}
            <div className="flex flex-wrap justify-between items-center gap-6 bg-white p-6 rounded-[40px] border-2 border-slate-100 shadow-sm">

                {/* 🏷️ الحالة */}
                <div className={`px-6 py-3 rounded-2xl border-2 font-black flex items-center gap-3 transition-all ${isEditing ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-emerald-500 text-emerald-600 bg-emerald-50'}`}>
                    {isEditing ? <Unlock size={18} /> : <Lock size={18} />}
                    <span className="text-[11px] uppercase tracking-[0.2em]">{isEditing ? 'وضـع الـتـعـديـل' : 'وضـع الـنـشـر'}</span>
                </div>

                <div className="flex gap-4">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-slate-900 text-white px-8 h-14 rounded-2xl text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                            >
                                <Calendar size={16} /> تعديل البرنامج
                            </button>

                            {/* ✅ تبديل السمية لـ مسح البرنامج */}
                            <button
                                onClick={handleSmartReset}
                                className="bg-slate-900 text-white px-6 h-14 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg transition-all duration-300 hover:bg-red-500 hover:scale-105 active:scale-95"
                            >
                                <Trash2 size={16} className="text-white" />
                                مسح البرنامج
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-slate-900 text-white px-12 h-14 rounded-2xl text-xs font-black shadow-xl hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
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