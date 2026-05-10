'use client';

import { Clock, Calendar, Wallet, PlusCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


import { Student, CashRecord } from '@/types/dashboard';

interface FinancialsProps {
    ledger: CashRecord[];
    newEntry: {
        type: string;
        category: string;
        amount: number | string;
        student_name: string;
        external_name?: string;
    };
    setNewEntry: (val: any) => void;
    addLedgerEntry: () => Promise<void>;
    loading: boolean;
    students: Student[];
    totalBalance: number;
    previousBalance: number;
}

export default function HamzaFinancials({
    ledger, newEntry, setNewEntry, addLedgerEntry, loading, students, totalBalance, previousBalance
}: FinancialsProps) {

    const safeLedger = ledger || [];

    const translateCategory = (cat: string) => {
        const mapping: { [key: string]: string } = {
            'transport_exam': 'نقل الامتحان',
            'heures_supp': 'ساعات إضافية',
            'younnes_zeriah': 'يونس زرياح', // 🚀 المسمار الجديد: يونس زرياح بالعربية
            'fuel': 'بنزين',
            'wash': 'غسيل السيارة',
            'repair': 'إصلاح / صيانة'
        };
        return mapping[cat] || cat;
    };

    // 🎯 1. تقسيم الاختيارات على حساب النوع
    const categories = {
        // 🚀 المسمار المعدل: إضافة يونس زرياح للمداخيل
        recette: [
            { value: 'transport_exam', label: '🚗 نقل الامتحان', icon: '🚗' },
            { value: 'heures_supp', label: '⏰ ساعات إضافية', icon: '⏰' },
            // ✅ الزيادة الجديدة هنا
            { value: 'younnes_zeriah', label: '👤 Younnes Zeriah', icon: '👤' }
        ],
        depense: [
            { value: 'fuel', label: '⛽ بنزين', icon: '⛽' },
            { value: 'wash', label: '🧼 غسيل السيارة', icon: '🧼' },
            { value: 'repair', label: '🔧 إصلاح / صيانة', icon: '🔧' }
        ]
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto space-y-8 pb-32 italic font-black uppercase"
        >

            {/* ── 1. HEADER (الرصيد) ── */}
            <div className="bg-white border-2 border-slate-100 rounded-[40px] p-8 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-900 rounded-[22px] flex items-center justify-center text-[#1dbf73] shadow-xl">
                        <Wallet size={30} />
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">الرصيد الإجمالي الحالي</p>
                        <h2 className="text-5xl text-slate-900 tabular-nums font-black mt-1">
                            {totalBalance} <span className="text-xl text-[#1dbf73] font-black">DH</span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* ── 2. TWO COLUMNS LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start text-right" dir="rtl">

                {/* ── الجهة 1: إضافة عملية (Form) ── */}
                <div className="bg-white border-2 border-slate-100 rounded-[40px] p-8 space-y-6 shadow-sm">
                    <div className="flex gap-4 font-black uppercase italic">
                        {['recette', 'depense'].map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    // 🔄 ملي كيبدل النوع، كنعطيوه أول اختيار فـ القائمة الجديدة أوتوماتيكياً
                                    const firstCat = t === 'recette' ? 'transport_exam' : 'fuel';
                                    setNewEntry({ ...newEntry, type: t, category: firstCat });
                                }}
                                className={`flex-1 h-16 rounded-2xl text-sm border-4 transition-all active:scale-95 flex items-center justify-center gap-2 ${newEntry.type === t
                                    ? t === 'recette'
                                        ? 'bg-[#1dbf73] text-white border-[#1dbf73] shadow-lg shadow-[#1dbf73]/20'
                                        : 'bg-[#ef4444] text-white border-[#ef4444] shadow-lg shadow-[#ef4444]/20'
                                    : 'bg-white text-slate-400 border-slate-50'
                                    }`}
                            >
                                {t === 'recette' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                {t === 'recette' ? 'مدخول' : 'مصروف'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4 text-right">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-black px-2 uppercase italic">نوع العملية</label>
                            <select
                                value={newEntry.category}
                                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                                className={`w-full h-14 bg-slate-50 border-2 rounded-2xl px-5 font-black text-slate-800 text-sm outline-none transition-all ${newEntry.type === 'recette' ? 'focus:border-[#1dbf73]' : 'focus:border-[#ef4444]'
                                    }`}
                            >
                                {/* 💡 هنا كيتم عرض الاختيارات على حساب واش recette ولا depense */}
                                {(newEntry.type === 'recette' ? categories.recette : categories.depense).map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <AnimatePresence mode="wait">
                            {/* 🚀 المسمار: اختيار المترشح يبان غير فـ نقل الامتحان والساعات الإضافية */}
                            {newEntry.type === 'recette' && (newEntry.category === 'transport_exam' || newEntry.category === 'heures_supp') && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 font-black px-2 uppercase italic">المرشح المعني</label>
                                        <select
                                            value={newEntry.student_name || ''}
                                            onChange={(e) => setNewEntry({ ...newEntry, student_name: e.target.value })}
                                            className="w-full h-14 bg-white border-2 border-[#1dbf73]/30 rounded-2xl px-5 font-black text-slate-800 text-sm outline-none focus:border-[#1dbf73] shadow-sm"
                                        >
                                            <option value="">— اختر اسم المرشح —</option>


                                            {/* 🚀 خيار المترشح الخارجي */}
                                            <option value="EXTERNAL_CANDIDATE" className="text-orange-600 font-black">👤 مترشح خارجي (ساعات إضافية)</option>

                                            <optgroup label="مترشحي المؤسسة">
                                                {students.map(s => (
                                                    <option key={s.id} value={`${s.first_name} ${s.last_name}`}>
                                                        {s.first_name} {s.last_name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>

                                    {/* ✍️ إيلا عزل "خارجي"، كايطلع هاد الـ input */}
                                    {newEntry.student_name === 'EXTERNAL_CANDIDATE' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
                                            <label className="text-[10px] text-orange-500 font-black px-2 uppercase italic">اسم المترشح الخارجي</label>
                                            <input
                                                type="text"
                                                placeholder="اكتب اسم الشخص هنا..."
                                                onChange={(e) => setNewEntry({ ...newEntry, external_name: e.target.value })}
                                                className="w-full h-12 bg-orange-50/50 border-2 border-orange-200 rounded-xl px-5 font-black text-slate-800 text-sm outline-none focus:border-orange-500 shadow-inner"
                                            />
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-black px-2 uppercase italic">المبلغ (DH)</label>
                            <input
                                type="number"
                                value={newEntry.amount === 0 ? '' : newEntry.amount}
                                onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value === '' ? 0 : Number(e.target.value) })}
                                className={`w-full h-16 bg-slate-50 border-2 rounded-2xl px-6 text-3xl font-black text-slate-900 text-center outline-none transition-all italic ${newEntry.type === 'recette' ? 'focus:border-[#1dbf73]' : 'focus:border-[#ef4444]'
                                    }`}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={addLedgerEntry}
                                disabled={loading}
                                className={`w-full h-16 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:bg-slate-300 ${newEntry.type === 'recette' ? 'bg-[#1dbf73] shadow-[#1dbf73]/30' : 'bg-[#ef4444] shadow-[#ef4444]/30'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><PlusCircle size={22} /><span className="italic uppercase">حـفـظ الـعـمـلـيـة</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── الجهة 2: سجل الحركات ── */}
                <div className="bg-white border-2 border-slate-100 rounded-[40px] p-8 space-y-6 shadow-sm min-h-[600px]">
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em] px-2">تقرير المداخيل و المصاريف</p>
                    <div className="space-y-3 max-h-[650px] overflow-y-auto no-scrollbar pr-1">
                        {/* 🚀 المسمار: سطر "الرصيد السابق" (Virtual Row) */}
                        {previousBalance !== 0 && (
                            <div className="bg-slate-900 border-2 border-slate-900 rounded-[25px] p-5 flex items-center justify-between shadow-lg">
                                <div className="flex items-center gap-4 text-white">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#1dbf73] text-white shadow-md">
                                        <Wallet size={24} strokeWidth={4} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-medium text-white/90">
                                            📦 رصيد من الأسابيع السابقة
                                        </p>
                                    </div>
                                </div>
                                <div className={`text-2xl font-black tabular-nums ${previousBalance >= 0 ? 'text-[#1dbf73]' : 'text-red-400'}`}>
                                    {previousBalance >= 0 ? '+' : ''}{previousBalance}<span className="text-[10px] ml-1 uppercase">DH</span>
                                </div>
                            </div>
                        )}

                        {safeLedger.map((entry, idx) => {
                            const isRecette = entry.type === 'recette';
                            return (
                                <div key={idx} className={`bg-white border-2 rounded-[25px] p-5 flex items-center justify-between shadow-sm transition-all ${isRecette ? 'border-emerald-50 hover:border-[#1dbf73]' : 'border-red-50 hover:border-[#ef4444]'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: isRecette ? '#1dbf73' : '#ef4444' }}>
                                            {isRecette ? <ArrowUpRight size={24} strokeWidth={4} /> : <ArrowDownRight size={24} strokeWidth={4} />}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[15px] font-black text-slate-900 leading-tight">
                                                {isRecette ? (
                                                    /* 🚀 المسمار: كنشوفو واش المترشح خارجي ولا داخلي */
                                                    entry.student_name === 'EXTERNAL_CANDIDATE'
                                                        ? `👤 ${entry.external_name || 'مترشح خارجي'}`
                                                        : (entry.student_name || 'مدخول عام')
                                                ) : (
                                                    translateCategory(entry.category)
                                                )}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {isRecette && <span className="text-[10px] font-black text-[#1dbf73] italic uppercase">{translateCategory(entry.category)}</span>}
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    {new Date(entry.created_at).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })} - {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-2xl font-black tabular-nums ${isRecette ? 'text-[#1dbf73]' : 'text-[#ef4444]'}`}>
                                        {isRecette ? '+' : '-'}{entry.amount}<span className="text-[10px] ml-1 uppercase">DH</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </motion.div>
    );
}