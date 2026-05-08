'use client';
import React, { useState, useEffect } from 'react'; // ✅ زدنا useEffect للمراقبة
import { supabase } from '@/lib/supabase';
import { Search, Users, Wallet, Printer, Calendar } from 'lucide-react';
import { Agency, Student } from '@/types/dashboard';

interface Props {
    selectedAgency?: Agency | null;
}

export default function GlobalReports({ selectedAgency }: Props) {
    const [fetching, setFetching] = useState(false);
    const [allData, setAllData] = useState<Student[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportType, setReportType] = useState('B');

    // 🚀 مسمار 1: مراقبة الوكالة - إيلا تبدلات وكنا فـ شي وكالة من غير بودينار، كنرجعو لـ Permis B
    useEffect(() => {
        if (selectedAgency?.name !== 'Boudinar') {
            setReportType('B');
        }
    }, [selectedAgency]);

    const fetchGlobalReport = async () => {
        if (!startDate || !endDate) return alert("حدد التاريخ أولاً أ با يونس!");
        setFetching(true);
        setAllData([]);

        // ✅ مسمار 1: توحيد عمود البحث (ديما تاريخ الامتحان)
        const currentType = reportType;
        const tableName = currentType === 'B' ? 'students' : 'truck_students';
        const dateColumn = 'exam_date'; // 🚀 رجعناها موحدة لجميع الأصناف

        console.log(`🚀 جاري البحث في ${tableName} عن الصنف ${currentType} بـ تاريخ الامتحان`);

        try {
            let query = supabase.from(tableName).select('*');

            // ✅ مسمار 2: منطق الوكالة (بودينار كتشوف حتى اللي عندهم ID خاوي فـ الشاحنات)
            if (currentType === 'B') {
                query = query.eq('agence_id', selectedAgency?.id);
            } else {
                if (selectedAgency?.name === 'Boudinar') {
                    // كنجيبو اللي ID ديالهم بودينار + اللي ID ديالهم NULL (للأرشيف القديم)
                    query = query.or(`agence_id.eq.${selectedAgency.id},agence_id.is.null`);
                } else {
                    query = query.eq('agence_id', selectedAgency?.id);
                }
                query = query.ilike('license_type', currentType);
            }

            // تصفية بـ تاريخ الامتحان حصراً
            query = query
                .gte(dateColumn, startDate)
                .lte(dateColumn, endDate)
                .not(dateColumn, 'is', null); // 🛡️ كنجيبو غير اللي عندهم تاريخ امتحان عامر

            const { data, error } = await query.order(dateColumn, { ascending: true });

            if (error) throw error;

            console.log(`✅ النتيجة: ${data?.length || 0} مترشح عندهم امتحان.`);
            setAllData(data || []);

        } catch (err: any) {
            console.error(err);
            alert("وقع مشكل فـ جلب الأرشيف!");
        } finally {
            setFetching(false);
        }
    };

    const stats = allData.reduce((acc, s) => {
        acc.count += 1;
        acc.money += (Number(s.total_price) || 0);
        return acc;
    }, { count: 0, money: 0 });

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 40px; color: #1e293b;">
                <div style="text-align: center; border-bottom: 4px solid #0f5a3e; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="margin: 0; color: #0f5a3e;">أرشيف الحسابات - ${selectedAgency?.name || 'Boudinar'}</h1>
                    <p style="margin: 5px 0; font-weight: bold;">الصنف: Permis ${reportType} | من: ${startDate} إلى: ${endDate}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #0f5a3e; color: white;">
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">المترشح</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">تاريخ الامتحان</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">الثمن</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allData.map(s => `
                            <tr>
                                <td style="padding: 12px; border: 1px solid #ddd;">${s.first_name} ${s.last_name}</td>
                                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${s.exam_date || '--'}</td>
                                <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${s.total_price} DH</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f8fafc; font-weight: bold;">
                            <td colspan="2" style="padding: 12px; border: 1px solid #ddd; text-align: right;">المجموع الكلي (${stats.count} ملف)</td>
                            <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${stats.money} DH</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
        printWindow.document.write(`<html><head><title>Archive</title></head><body onload="window.print()">${htmlContent}</body></html>`);
        printWindow.document.close();
    };

    return (
        <div className="space-y-8 font-black italic text-right uppercase tracking-tighter" dir="rtl">
            <div className="border-r-8 border-slate-900 pr-4">
                <h1 className="text-2xl text-slate-900 leading-none"> الأرشيف </h1>
            </div>

            <div className="bg-white border-4 border-slate-900 rounded-[35px] p-6 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-xl">
                <div className="space-y-1">
                    <label className="text-[9px] pr-2">صنف الرخص:</label>
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full h-14 bg-slate-50 rounded-2xl px-4 outline-none border-2 border-transparent focus:border-slate-900 font-black"
                    >
                        <option value="B">السيارات (Permis B)</option>

                        {/* ✅ مسمار 4: الشاحنات كيطلعو غير إيلا كانت وكالة بودينار */}
                        {selectedAgency?.name === 'Boudinar' && (
                            <>
                                <option value="C">الشاحنات (Permis C)</option>
                                <option value="D">الحافلات (Permis D)</option>
                                <option value="E">الرموك (Permis E)</option>
                                <option value="A">الدراجات (Permis A)</option>
                            </>
                        )}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] pr-2">من تاريخ:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-14 bg-slate-50 rounded-2xl px-4 outline-none border-2 border-transparent focus:border-slate-900 text-center font-black" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] pr-2">إلى تاريخ:</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-14 bg-slate-50 rounded-2xl px-4 outline-none border-2 border-transparent focus:border-slate-900 text-center font-black" />
                </div>
                <div className="flex items-end">
                    <button onClick={fetchGlobalReport} disabled={fetching} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg active:scale-95">
                        {fetching ? <span className="animate-spin text-lg italic">🛰️</span> : <Search size={18} />} جلب الأرشيف
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 text-white p-7 rounded-[30px] flex justify-between items-center shadow-lg">
                    <div><p className="text-[9px] opacity-60 italic uppercase">عدد الملفات ({reportType})</p><h2 className="text-3xl tracking-tighter">{stats.count} مترشح</h2></div>
                    <Users size={28} className="opacity-20" />
                </div>
                <div className="bg-emerald-500 text-white p-7 rounded-[30px] flex justify-between items-center shadow-lg border-b-4 border-emerald-700">
                    <div><p className="text-[9px] opacity-60 italic uppercase">مجموع المداخيل</p><h2 className="text-3xl tracking-tighter">{stats.money} DH</h2></div>
                    <Wallet size={28} className="opacity-20" />
                </div>
            </div>

            {allData.length > 0 && (
                <div className="bg-white border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
                    <div className="p-6 bg-slate-50 flex justify-between items-center border-b-2">
                        <span className="text-sm font-black italic"> تفاصيل أرشيف صنف {reportType} </span>
                        <button onClick={handlePrint} className="bg-[#0F5A3E] text-white px-6 py-3 rounded-full text-[11px] font-black flex items-center gap-2 hover:scale-105 transition-all shadow-md active:scale-95">
                            <Printer size={16} /> استخراج PDF
                        </button>
                    </div>
                    <table className="w-full text-right">
                        <thead className="text-[10px] text-slate-400 border-b italic uppercase font-black">
                            <tr className="bg-slate-50/50">
                                <th className="p-6">المترشح</th>
                                <th className="p-6 text-center">تاريخ الامتحان</th>
                                <th className="p-6 text-left pl-10">الثمن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allData.map((s, idx) => (
                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all font-black italic">
                                    <td className="p-6 text-slate-900">{s.first_name} {s.last_name}</td>
                                    <td className="p-6 text-center text-slate-500">{s.exam_date || '--'}</td>
                                    <td className="p-6 text-left pl-10 text-emerald-600">DH {s.total_price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}