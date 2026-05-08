'use client';
import { AlertTriangle, Timer, Wallet, TrendingUp, UserCircle, CheckCircle2, Calendar } from 'lucide-react';

import { Student, Agency } from '@/types/dashboard';

interface Props {
    filteredStudents: Student[];
    financialStats: {
        totalRevenue: number;
        totalCollected: number;
        totalOutstanding: number;
    };
    highlightedName?: string | null;
    highlightExpiry?: number;
    selectedAgency?: Agency | null;
}

export default function ManagerFinance({
    filteredStudents,
    financialStats,
    highlightedName = null,
    highlightExpiry = 0,
    selectedAgency
}: Props) {
    return (
        <div className="px-2 lg:px-8 space-y-8 font-black italic uppercase tracking-tighter" dir="rtl">

            {/* 🔝 STATS - (بقا كيم كان بـ الضبط) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-slate-100 rounded-[25px] p-5 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[9px] text-slate-400">المداخيل الإجمالية</p>
                        <h2 className="text-xl text-slate-900 leading-none">{financialStats?.totalRevenue || 0} DH</h2>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-xl">
                        <TrendingUp size={20} className="text-slate-900" />
                    </div>
                </div>
                <div className="bg-white border-2 border-emerald-100 rounded-[25px] p-5 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[9px] text-emerald-600 uppercase tracking-widest">المبلغ المستخلص</p>
                        <h2 className="text-xl text-emerald-600 leading-none">{financialStats?.totalCollected || 0} DH</h2>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl">
                        <Wallet size={20} className="text-emerald-500" />
                    </div>
                </div>
                <div className="bg-white border-2 border-rose-100 rounded-[25px] p-5 flex items-center justify-between shadow-sm text-rose-600">
                    <div>
                        <p className="text-[9px] text-slate-400">الديون العالقة</p>
                        <h2 className="text-xl leading-none">{financialStats?.totalOutstanding || 0} DH</h2>
                    </div>
                    <div className="bg-rose-50 p-2 rounded-xl">
                        <AlertTriangle size={20} />
                    </div>
                </div>
            </div>

            {/* 📱 نسخة التليفون: Cards (معدلة بـ تواريخ الدفعات) */}
            <div className="grid grid-cols-1 gap-6 sm:hidden" dir="rtl">
                {filteredStudents.map(s => {
                    const paid = (s.tranche_1 || 0) + (s.tranche_2 || 0) + (s.tranche_3 || 0) + (s.tranche_4 || 0) + (s.tranche_5 || 0);
                    const rest = (s.total_price || 0) - paid;
                    const hasExam = s.exam_date && s.exam_date !== '';
                    const totalTimbre = (s.t1_timbre_amount || 0) + (s.t2_timbre_amount || 0) + (s.t3_timbre_amount || 0) + (s.t4_timbre_amount || 0) + (s.t5_timbre_amount || 0);
                    const isMedicalPaid = s.t1_medical_paid || s.t2_medical_paid || s.t3_medical_paid || s.t4_medical_paid || s.t5_medical_paid;

                    return (
                        <div key={s.id} className="bg-white border-2 border-slate-900 rounded-[35px] p-6 shadow-sm space-y-4 text-right">
                            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                                <div className="space-y-1">
                                    <p className="text-base text-slate-900 font-black leading-none mb-1">{s.first_name} {s.last_name}</p>
                                    {hasExam ? (
                                        <p className="text-[10px] text-blue-600 font-black flex items-center gap-1 mt-1">
                                            <Timer size={11} strokeWidth={3} /> موعد الامتحان: {new Date(s.exam_date).toLocaleDateString('fr-FR')}
                                        </p>
                                    ) : (
                                        <p className="text-[8px] text-slate-300 italic">-- لم يحدد موعد الامتحان --</p>
                                    )}
                                    {hasExam && rest > 0 && (
                                        <div className="mt-2 bg-rose-50 border border-rose-200 p-2 rounded-xl flex items-center gap-2 animate-pulse">
                                            <AlertTriangle size={14} className="text-rose-600 flex-shrink-0" />
                                            <p className="text-[10px] text-rose-600 font-black leading-tight">
                                                🚨 انتباه: المرشح عنده امتحان وباقي كيسالوه {rest} DH!
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-[8px] text-slate-400 flex items-center gap-1 italic">
                                        <Calendar size={10} /> سجل فـ: {
                                            s.registration_date
                                                ? new Date(s.registration_date).toLocaleDateString('fr-FR')
                                                : (s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '---')
                                        }
                                    </p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[14px] text-slate-900 font-black leading-none">{s.total_price} DH</p>
                                    <p className="text-[7px] text-slate-400 uppercase">الثمن الإجمالي</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className={`flex-1 py-2 rounded-xl border-2 text-center text-[10px] font-black ${totalTimbre > 0 ? 'bg-orange-500 text-white border-orange-600' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                    TB: {totalTimbre > 0 ? `${totalTimbre} DH` : '--'}
                                </div>
                                <div className={`flex-1 py-2 rounded-xl border-2 text-center text-[10px] font-black ${isMedicalPaid ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                    VM: {isMedicalPaid ? '✓ مدفوعة' : '--'}
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-1.5">
                                {[1, 2, 3, 4, 5].map(n => {
                                    const trancheAmount = s[`tranche_${n}`] || 0;
                                    const trancheDate = s[`t${n}_date`];
                                    const timbreInThisTranche = s[`t${n}_timbre_amount`] || 0;
                                    const medicalInThisTranche = s[`t${n}_medical_paid`] || false;

                                    return (
                                        <div key={n} className={`min-w-[60px] h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${trancheAmount > 0 ? 'bg-white border-emerald-500 shadow-sm' : 'bg-slate-50/50 border-slate-100 text-slate-200'}`}>
                                            <span className="text-[7px] uppercase opacity-60 font-black italic">T{n}</span>
                                            <span className="text-[9px] font-black text-slate-900 leading-none">{trancheAmount > 0 ? `${trancheAmount} DH` : '--'}</span>

                                            {/* 📅 مسمار التليفون: تاريخ الدفعة */}
                                            {trancheAmount > 0 && trancheDate && (
                                                <span className="text-[6px] text-emerald-600 font-black mt-0.5">
                                                    {new Date(trancheDate).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            )}

                                            <div className="flex gap-1 mt-0.5">
                                                {timbreInThisTranche > 0 && (
                                                    <span className="text-[6px] bg-orange-100 text-orange-600 px-0.5 rounded-sm font-bold">TB</span>
                                                )}
                                                {medicalInThisTranche && (
                                                    <span className="text-[6px] bg-blue-100 text-blue-600 px-0.5 rounded-sm font-bold">VM</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={`p-3 rounded-2xl text-center font-black text-[12px] ${rest === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                {rest === 0 ? '✓ حـساب خـالـص' : `الباقي : ${rest} DH`}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 💻 نسخة الـ PC: الجدول الكبـير (معدلة بـ الخانة الجديدة) */}
            <div className="hidden sm:block bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full min-w-[1400px] text-right border-separate border-spacing-0" dir="rtl">
                        <thead className="bg-slate-50/80 text-slate-500 text-[10px]">
                            <tr>
                                <th className="p-6 sticky right-0 bg-white z-40 border-l border-slate-100 w-[200px] text-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    المرشح / تاريخ التسجيل
                                </th>
                                <th className="text-center p-4">الثمن الكلي</th>
                                <th className="text-center p-4">الدفعات (T1-T5)</th>

                                {/* 🚀 المسمار: العمود الجديد لتواريخ الدفعات */}
                                <th className="text-center p-4 w-[150px] bg-slate-50/50">تواريخ الدفعات</th>

                                <th className="text-center w-[120px] p-4">التمبر (TB)</th>
                                <th className="text-center w-[100px] p-4">الفحص (VM)</th>
                                <th className="text-center p-4">تاريخ الامتحان</th>
                                <th className="text-left pl-8 p-4">الباقي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.map(s => {
                                const paid = (s.tranche_1 || 0) + (s.tranche_2 || 0) + (s.tranche_3 || 0) + (s.tranche_4 || 0) + (s.tranche_5 || 0);
                                const rest = (s.total_price || 0) - paid;
                                const needsWarning = s.exam_date && rest > 0;
                                const totalTimbre = (s.t1_timbre_amount || 0) + (s.t2_timbre_amount || 0) + (s.t3_timbre_amount || 0) + (s.t4_timbre_amount || 0) + (s.t5_timbre_amount || 0);
                                const isMedicalPaid = s.t1_medical_paid || s.t2_medical_paid || s.t3_medical_paid || s.t4_medical_paid || s.t5_medical_paid;

                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-6 sticky right-0 bg-white z-20 group-hover:bg-slate-50 border-l-2 border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                            <p className="font-black text-slate-900 leading-none">{s.first_name} {s.last_name}</p>
                                            <p className="text-[8px] text-slate-400 mt-2 font-normal italic">
                                                سجل فـ: {s.registration_date ? new Date(s.registration_date).toLocaleDateString() : '---'}
                                            </p>
                                        </td>
                                        <td className="text-center text-slate-900 font-black p-4">DH {s.total_price}</td>

                                        {/* الدفعات (بقات كيم كانت) */}
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                {[1, 2, 3, 4, 5].map(n => {
                                                    const trancheAmount = s[`tranche_${n}`] || 0;
                                                    const timbreInThisTranche = s[`t${n}_timbre_amount`] || 0;
                                                    const medicalInThisTranche = s[`t${n}_medical_paid`] || false;

                                                    return (
                                                        <div key={n} className={`min-w-[80px] h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-sm ${trancheAmount > 0 ? 'bg-white border-emerald-500 scale-105' : 'bg-slate-50/50 border-slate-100 text-slate-200 opacity-40'}`}>
                                                            <span className="text-[8px] uppercase font-black italic opacity-60">Tranche {n}</span>
                                                            <span className="text-[13px] font-black text-slate-900 leading-tight">{trancheAmount > 0 ? `${trancheAmount} DH` : '--'}</span>
                                                            <div className="flex flex-col gap-0.5 mt-1 w-full px-1">
                                                                {timbreInThisTranche > 0 && (
                                                                    <div className="bg-orange-500 text-white text-[9px] font-black py-0.5 px-1 rounded-md flex justify-between items-center">
                                                                        <span>TB:</span>
                                                                        <span>{timbreInThisTranche}DH</span>
                                                                    </div>
                                                                )}
                                                                {medicalInThisTranche && (
                                                                    <div className="bg-blue-600 text-white text-[9px] font-black py-0.5 px-1 rounded-md flex items-center justify-center gap-1">
                                                                        <CheckCircle2 size={10} />
                                                                        <span>VM</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        {/* 🚀 المسمار: العمود الجديد لتواريخ الدفعات */}
                                        <td className="p-4 bg-slate-50/30">
                                            <div className="flex flex-col gap-1.5 items-center">
                                                {[1, 2, 3, 4, 5].map(n => {
                                                    const tAmt = s[`tranche_${n}`] || 0;
                                                    const tDate = s[`t${n}_date`];
                                                    if (tAmt > 0 && tDate) {
                                                        return (
                                                            <div key={n} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm w-full max-w-[120px] justify-between">
                                                                <span className="text-[7px] font-black text-slate-400">T{n}</span>
                                                                <span className="text-[9px] font-black text-emerald-600">
                                                                    {new Date(tDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                                {paid === 0 && <span className="text-slate-200">-- --</span>}
                                            </div>
                                        </td>

                                        <td className="p-2 text-center">
                                            <div className={`px-3 py-1.5 rounded-full border-2 inline-flex flex-col items-center justify-center transition-all ${totalTimbre > 0 ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                <span className="text-[8px] font-black uppercase">Timbre</span>
                                                <span className="text-[10px] font-black leading-none">{totalTimbre > 0 ? `${totalTimbre} DH` : '--'}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-center">
                                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${isMedicalPaid ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                {isMedicalPaid ? <CheckCircle2 size={18} strokeWidth={3} /> : <span className="text-[9px] font-black opacity-30">VM</span>}
                                            </div>
                                        </td>
                                        <td className="text-center p-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-slate-900 font-black text-xs">{s.exam_date || '--'}</span>
                                                {needsWarning && (
                                                    <div className="bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                                                        <AlertTriangle size={8} className="text-rose-600 animate-pulse" />
                                                        <span className="text-[7px] text-rose-600 font-black">ناقص فـ الخلاص</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-left pl-8">
                                            <span className={`px-4 py-2 rounded-xl text-[12px] font-black shadow-sm border ${rest === 0 ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                {rest === 0 ? 'خالص ✓' : `${rest} DH`}
                                            </span>
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