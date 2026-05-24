'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Wallet, Calendar, FileText, Plus, Trash2, Settings, ShieldX, MapPin, ShieldAlert } from 'lucide-react';

const VALID_VEHICLES = ['Clio 4', 'Peugeot 208', 'Opel Corsa', 'Dacia Sandero'];

interface AlertItem {
    vehicle: string;
    type: 'warning' | 'danger';
    msg: string;
}

interface TabStatus {
    status: 'normal' | 'warning' | 'danger';
    list: AlertItem[];
}

export default function ManagerFleet() {
    const [loading, setLoading] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState('Peugeot 208');
    const [activeFleetTab, setActiveFleetTab] = useState<'expenses' | 'vidange' | 'documents'>('expenses');

    // States د المصاريف
    const [expenses, setExpenses] = useState<any[]>([]);
    const [expenseType, setExpenseType] = useState('');
    const [expenseLocation, setExpenseLocation] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));

    // States د الأوراق والـ Vidange
    const [documents, setDocuments] = useState<any[]>([]);
    const [vidanges, setVidanges] = useState<any[]>([]);

    // States د الإدخال للوثائق
    const [docType, setDocType] = useState('assurance');
    const [startDate, setStartDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    // States د الإدخال للفيدونج
    const [vidangeKm, setVidangeKm] = useState('');
    const [vidangeTargetInput, setVidangeTargetInput] = useState('');

    // كاشف الكيلومتراج ف الخلفية
    const [currentMileages, setCurrentMileages] = useState<Record<string, number>>({
        'Clio 4': 0, 'Peugeot 208': 0, 'Opel Corsa': 0, 'Dacia Sandero': 0
    });

    const fetchCurrentMileagesFromLogs = async () => {
        try {
            const { data: dbAgencies } = await supabase.from('agencies').select('*');
            const { data: logs = [] } = await supabase.from('vehicle_logs').select('*');

            if (dbAgencies && logs) {
                const mileages: Record<string, number> = {
                    'Clio 4': 0, 'Peugeot 208': 0, 'Opel Corsa': 0, 'Dacia Sandero': 0
                };

                VALID_VEHICLES.forEach(vName => {
                    let targetAgencyName = 'Boudinar';
                    if (vName === 'Clio 4') targetAgencyName = 'Krona';
                    if (vName === 'Opel Corsa') targetAgencyName = 'Tazaghine';
                    if (vName === 'Dacia Sandero') targetAgencyName = 'Azghar';

                    const agencyMatch = dbAgencies.find(a =>
                        a.name.toLowerCase().trim() === targetAgencyName.toLowerCase() ||
                        a.name.includes(targetAgencyName)
                    );

                    if (agencyMatch) {
                        const logsForAgency = logs.filter(l => l.agence_id === agencyMatch.id);
                        if (logsForAgency.length > 0) {
                            const maxKm = Math.max(...logsForAgency.map(l =>
                                Math.max(Number(l.mileage_end || 0), Number(l.mileage_start || 0))
                            ));
                            mileages[vName] = maxKm;
                        }
                    }
                });
                setCurrentMileages(mileages);
            }
        } catch (err) { console.error("Error fetching mileages:", err); }
    };

    const fetchFleetData = async () => {
        setLoading(true);
        try {
            await fetchCurrentMileagesFromLogs();

            const startOfMonth = `${selectedMonth}-01`;
            const endOfMonth = `${selectedMonth}-31`;
            const { data: exp } = await supabase
                .from('vehicle_expenses')
                .select('*')
                .gte('expense_date', startOfMonth)
                .lte('expense_date', endOfMonth)
                .order('expense_date', { ascending: false });
            if (exp) setExpenses(exp);

            const { data: docs } = await supabase.from('vehicle_documents').select('*');
            if (docs) setDocuments(docs);

            const { data: vids } = await supabase.from('vehicle_vidange').select('*');
            if (vids) setVidanges(vids);

        } catch (err) { console.error("Error fetching fleet data:", err); }
        setLoading(false);
    };

    useEffect(() => {
        fetchFleetData();
    }, [selectedMonth]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseType || !expenseAmount) return;

        const { error } = await supabase.from('vehicle_expenses').insert([{
            vehicle_name: selectedVehicle,
            expense_type: `${expenseType} | 📍 المكان: ${expenseLocation || 'غير محدد'}`,
            amount: Number(expenseAmount),
            expense_date: new Date().toISOString().split('T')[0]
        }]);

        if (!error) {
            setExpenseType('');
            setExpenseLocation('');
            setExpenseAmount('');
            fetchFleetData();
        }
    };

    const handleDeleteExpense = async (id: string) => {
        const { error } = await supabase.from('vehicle_expenses').delete().eq('id', id);
        if (!error) fetchFleetData();
    };

    const handleUpdateDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expiryDate || !selectedVehicle || !startDate) return;

        const { error } = await supabase.from('vehicle_documents').upsert({
            vehicle_name: selectedVehicle,
            document_type: docType,
            start_date: startDate,
            expiry_date: expiryDate
        }, { onConflict: 'vehicle_name,document_type' });

        if (!error) {
            setStartDate('');
            setExpiryDate('');
            fetchFleetData();
        }
    };

    const handleDeleteDocument = async (id: string) => {
        const { error } = await supabase.from('vehicle_documents').delete().eq('id', id);
        if (!error) fetchFleetData();
    };

    const handleUpdateVidange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vidangeKm || !vidangeTargetInput) return;

        const { error } = await supabase.from('vehicle_vidange').upsert({
            vehicle_name: selectedVehicle,
            last_vidange_km: Number(vidangeKm),
            interval_km: 0,
            target_km: Number(vidangeTargetInput)
        }, { onConflict: 'vehicle_name' });

        if (!error) {
            setVidangeKm('');
            setVidangeTargetInput('');
            fetchFleetData();
        }
    };

    const handleDeleteVidange = async (id: string) => {
        const { error } = await supabase.from('vehicle_vidange').delete().eq('id', id);
        if (!error) fetchFleetData();
    };

    // 🚀 مسمار حساب الـ Warnings وتحديد حالة الألوان المجهدة للـ Nav Bar والـ Alerts لداخل
    const tabsAlertsStatus = useMemo(() => {
        const result: { vidange: TabStatus; documents: TabStatus } = {
            vidange: { status: 'normal', list: [] },
            documents: { status: 'normal', list: [] }
        };

        const today = new Date();

        VALID_VEHICLES.forEach(vName => {
            // أ) جلب وتحديد أخطار الـ Vidange المستهدفة للرادار الحالي
            const vid = vidanges.find(v => v.vehicle_name === vName);
            const currentKm = currentMileages[vName] || 0;
            if (vid && currentKm > 0) {
                const remainingKm = Number(vid.target_km) - currentKm;
                if (remainingKm <= 500 && remainingKm > 0) {
                    if (result.vidange.status !== 'danger') result.vidange.status = 'warning';
                    result.vidange.list.push({ vehicle: vName, type: 'warning', msg: `السيارة 🚗 ${vName}: المسافة المتبقية أقل من ${remainingKm.toFixed(0)} كم على موعد تغيير الزيت المستهدف!` });
                } else if (remainingKm <= 0) {
                    result.vidange.status = 'danger';
                    result.vidange.list.push({ vehicle: vName, type: 'danger', msg: `السيارة 🚗 ${vName}: تم تجاوز المسافة المحددة لتغيير الزيت بـ ${Math.abs(remainingKm).toFixed(0)} كم! السيارة في خطر!` });
                }
            }

            // ب) جلب وتحديد أخطار التنبيهات د الـ 10 أيام للوثائق
            const vehicleDocs = documents.filter(d => d.vehicle_name === vName);
            vehicleDocs.forEach(d => {
                const expDate = new Date(d.expiry_date);
                const diffTime = expDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                let docLabel = d.document_type === 'assurance' ? 'التأمين' : d.document_type === 'vignette' ? 'الضريبة السنوية' : 'الفحص التقني';

                if (diffDays <= 0) {
                    result.documents.status = 'danger';
                    result.documents.list.push({ vehicle: vName, type: 'danger', msg: `السيارة 🚗 ${vName}: انتهت صلاحية وثيقة ${docLabel} تماماً! يجب التجديد فوراً!` });
                } else if (diffDays <= 10) {
                    if (result.documents.status !== 'danger') result.documents.status = 'danger'; // إرجاع بوطون الوثائق أحمر حار
                    result.documents.list.push({ vehicle: vName, type: 'danger', msg: `السيارة 🚗 ${vName}: متبقي ${diffDays} أيام فقط على انتهاء صلاحية وثيقة ${docLabel}!` });
                }
            });
        });

        return result;
    }, [vidanges, documents, currentMileages]);

    const handlePrintPDF = () => { window.print(); };

    const totalCurrentMonthExpenses = useMemo(() => {
        return expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    }, [expenses]);

    const filteredDocumentsByVehicle = useMemo(() => {
        return documents.filter(d => d.vehicle_name === selectedVehicle);
    }, [documents, selectedVehicle]);

    return (
        <div className="space-y-6 bg-[#F3F4F6]/60 p-4 rounded-[35px] font-black tracking-tighter uppercase selection:bg-[#1dbf73] selection:text-white print:bg-white print:p-0 w-full" dir="rtl">

            <style jsx global>{`
                @media print {
                    header, aside, footer, nav, .print\\:hidden, button, select, input {
                        display: none !important;
                        height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    body, html, main, div {
                        background: white !important;
                        background-color: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    table {
                        border: 2px solid #000000 !important;
                        border-collapse: collapse !important;
                        width: 100% !important;
                        margin-top: 20px !important;
                    }
                    th, td {
                        border: 1px solid #000000 !important;
                        padding: 12px 8px !important;
                        color: #000000 !important;
                    }
                    th {
                        background-color: #f2f2f2 !important;
                    }
                }
            `}</style>

            {/* 🚀 الـ Nav Bar الداخلي المطور - الأنوار الملونة والـ Badges رجعوا يشعلو للأمان */}
            <div className="flex flex-row items-center gap-3 border-b border-slate-200 pb-2 print:hidden overflow-x-auto">
                <button onClick={() => setActiveFleetTab('expenses')} className={`h-14 px-6 text-xs font-black italic transition-all rounded-2xl border-2 flex items-center justify-center gap-2 ${activeFleetTab === 'expenses' ? 'bg-[#1dbf73] text-white border-[#1dbf73] shadow-md' : 'bg-white border-transparent text-slate-500 hover:bg-slate-100'}`}>
                    📊 كشف ومصاريف الصيانة
                </button>

                {/* بوطون الـ Vidange شاعل باللون المطلوب عند التحذير */}
                <button
                    onClick={() => setActiveFleetTab('vidange')}
                    className={`h-14 px-6 text-xs font-black italic transition-all rounded-2xl border-2 flex items-center justify-center gap-2 relative 
                        ${activeFleetTab === 'vidange'
                            ? 'bg-[#1dbf73] text-white border-[#1dbf73] shadow-md'
                            : tabsAlertsStatus.vidange.status === 'danger'
                                ? 'bg-rose-50 text-rose-600 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse font-extrabold'
                                : tabsAlertsStatus.vidange.status === 'warning'
                                    ? 'bg-amber-50 text-amber-600 border-amber-500 font-extrabold'
                                    : 'bg-white border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                    🔄 Le Vidange
                    {tabsAlertsStatus.vidange.list.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] text-white font-black ${tabsAlertsStatus.vidange.status === 'danger' ? 'bg-rose-600' : 'bg-amber-500'}`}>{tabsAlertsStatus.vidange.list.length}</span>
                    )}
                </button>

                {/* بوطون وثائق السيارات شاعل بالأحمر عند اقتراب الـ 10 أيام أو انتهاء الصلاحية */}
                <button
                    onClick={() => setActiveFleetTab('documents')}
                    className={`h-14 px-6 text-xs font-black italic transition-all rounded-2xl border-2 flex items-center justify-center gap-2 relative 
                        ${activeFleetTab === 'documents'
                            ? 'bg-[#1dbf73] text-white border-[#1dbf73] shadow-md'
                            : tabsAlertsStatus.documents.status === 'danger'
                                ? 'bg-rose-50 text-rose-600 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)] font-extrabold animate-bounce'
                                : tabsAlertsStatus.documents.status === 'warning'
                                    ? 'bg-amber-50 text-amber-600 border-amber-500 font-extrabold'
                                    : 'bg-white border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                    🛡️ وثائق السيارات
                    {tabsAlertsStatus.documents.list.length > 0 && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] text-white font-black bg-rose-600 animate-pulse">{tabsAlertsStatus.documents.list.length}</span>
                    )}
                </button>
            </div>

            {/* الـ Selector المشترك */}
            <div className="bg-white p-4 rounded-[25px] border border-slate-100 shadow-sm flex items-center justify-between print:hidden">
                <span className="text-xs font-black text-slate-900 pr-2">اختيار السيارة الحالية:</span>
                <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="w-72 h-12 pr-4 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none text-slate-900 font-black text-xs transition-all cursor-pointer focus:border-[#1dbf73] text-center">
                    {VALID_VEHICLES.map(v => (
                        <option key={v} value={v}>
                            🚗 {v} {activeFleetTab === 'vidange' ? `(الحالي: ${(currentMileages[v] || 0).toFixed(0)} km)` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* 📊 التاب 1: كشف ومصاريف الصيانة */}
            {activeFleetTab === 'expenses' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block w-full">
                    <div className="print:hidden">
                        <form onSubmit={handleAddExpense} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
                            <header className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-[#1dbf73] text-white rounded-lg flex items-center justify-center rotate-3 shadow-md"><Wallet size={16} /></div>
                                <h4 className="font-black text-xs text-slate-900">تسجيل صيانة جديدة</h4>
                            </header>
                            <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 pr-3 block font-black">نوع الصيانة</label>
                                <input type="text" placeholder="نوع الصيانة..." value={expenseType} onChange={(e) => setExpenseType(e.target.value)} className="w-full h-16 pr-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-[#1dbf73]" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 pr-3 block font-black">مكان الصيانة</label>
                                <input type="text" placeholder="مكان الصيانة..." value={expenseLocation} onChange={(e) => setExpenseLocation(e.target.value)} className="w-full h-16 pr-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-[#1dbf73]" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 pr-3 block font-black">ثمن الصيانة</label>
                                <input type="number" placeholder="الثمن..." value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full h-16 pr-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-[#1dbf73]" required />
                            </div>
                            <button type="submit" className="w-full h-14 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center shadow-lg border-none">حفظ</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 print:w-full">
                        <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
                            <div className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 print:hidden">
                                <span className="font-black text-xs text-slate-400">أرشيف الكشف</span>
                                <div className="flex items-center gap-2">
                                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="h-11 bg-slate-50 border-2 border-slate-50 rounded-xl px-3 outline-none text-xs font-black text-slate-900 cursor-pointer focus:border-[#1dbf73]" />
                                    <button onClick={handlePrintPDF} className="h-11 px-4 bg-[#1dbf73] text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all hover:bg-[#16965b] border-none shadow-md"><FileText size={13} /> طباعة PDF 📄</button>
                                </div>
                            </div>
                            <div className="hidden print:block text-center pb-6 w-full">
                                <h2 className="text-2xl font-black tracking-tight mb-1">تقرير مصاريف وصيانة السيارات لشهر: {selectedMonth}</h2>
                            </div>
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-950 text-slate-400 text-[10px] font-black uppercase bg-slate-50/60">
                                            <th className="p-3">السيارة</th>
                                            <th className="p-3">نوع الصيانة</th>
                                            <th className="p-3">مكان الصيانة</th>
                                            <th className="p-3">التاريخ</th>
                                            <th className="p-3 text-left">الثمن</th>
                                            <th className="p-3 text-left print:hidden">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-black text-slate-800">
                                        {expenses.length === 0 ? (
                                            <tr><td colSpan={6} className="p-8 text-center text-slate-300 font-bold italic">لا توجد مصاريف مسجلة فـ هاد الشهر.</td></tr>
                                        ) : (
                                            expenses.map(e => {
                                                const constLocation = e.expense_type.includes(' | 📍 المكان: ');
                                                const typeDisplay = constLocation ? e.expense_type.split(' | 📍 المكان: ')[0] : e.expense_type;
                                                const locationDisplay = constLocation ? e.expense_type.split(' | 📍 المكان: ')[1] : 'غير حدد';
                                                return (
                                                    <tr key={e.id} className="hover:bg-slate-50/50">
                                                        <td className="p-3 text-slate-900">🚗 {e.vehicle_name}</td>
                                                        <td className="p-3 text-slate-700 font-black">{typeDisplay}</td>
                                                        <td className="p-3 text-[#1dbf73] font-bold print:text-black">📍 {locationDisplay}</td>
                                                        <td className="p-3 text-slate-400 text-[10px]">{e.expense_date}</td>
                                                        <td className="p-3 text-left font-black text-slate-900">{Number(e.amount).toFixed(2)} DH</td>
                                                        <td className="p-3 text-left print:hidden"><button onClick={() => handleDeleteExpense(e.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"><Trash2 size={13} /></button></td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-[#1dbf73] text-white font-black text-xs shadow-md">
                                            <td colSpan={4} className="p-4 rounded-r-2xl print:rounded-none">مجموع المصاريف الإجمالي:</td>
                                            <td colSpan={2} className="p-4 text-left rounded-l-2xl print:rounded-none">{totalCurrentMonthExpenses.toFixed(2)} DH</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔄 التاب 2: Le Vidange (مطور بـ التنبيهات المباشرة لداخل بـ الفصحى) */}
            {activeFleetTab === 'vidange' && (
                <div className="space-y-4 max-w-4xl mx-auto print:hidden">

                    {/* بلاصة التحذيرات الخاصة بالفيدونج الصافية لداخل */}
                    {tabsAlertsStatus.vidange.list.length > 0 && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                            {tabsAlertsStatus.vidange.list.map((alert, i) => (
                                <div key={i} className={`p-4 rounded-2xl border-2 text-xs font-black flex items-center gap-3 ${alert.type === 'danger' ? 'bg-rose-50 text-rose-900 border-rose-300 shadow-[0_4px_12px_rgba(244,63,94,0.1)]' : 'bg-amber-50 text-amber-900 border-amber-300'}`}>
                                    <ShieldX size={18} className="text-rose-600 animate-bounce flex-shrink-0" />
                                    <div>{alert.msg}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <form onSubmit={handleUpdateVidange} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
                            <header className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-[#1dbf73] text-white rounded-lg flex items-center justify-center rotate-3 shadow-md"><Settings size={16} /></div>
                                <h4 className="font-black text-xs text-slate-900">معلومات الـ Vidange</h4>
                            </header>
                            <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 pr-3 block font-black">السيارة المستهدفة بالتحديث</label>
                                <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-[#1dbf73]">
                                    {VALID_VEHICLES.map(v => <option key={v} value={v}>🚗 {v}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 pr-3 block font-black">الـ KM الحالي لتغيير الزيت</label>
                                <input type="number" placeholder="أدخل الكيلومتر الحالي" value={vidangeKm} onChange={(e) => setVidangeKm(e.target.value)} className="w-full h-16 pr-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-[#1dbf73]" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 pr-3 block font-black">الـ KM القادم المستهدف</label>
                                <input type="number" placeholder="أدخل الكيلومتر القادم" value={vidangeTargetInput} onChange={(e) => setVidangeTargetInput(e.target.value)} className="w-full h-16 pr-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-[#1dbf73]" required />
                            </div>
                            <button type="submit" className="w-full h-14 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center shadow-lg border-none">حفظ</button>
                        </form>

                        <div className="md:col-span-2 bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm overflow-x-auto">
                            <h4 className="text-xs font-black text-slate-900 mb-3 uppercase tracking-wider">جدول المراقبة</h4>
                            <table className="w-full text-right border-collapse text-xs font-black text-slate-800">
                                <thead>
                                    <tr className="border-b-2 border-slate-950 bg-slate-50 text-[10px] text-slate-400">
                                        <th className="p-3">السيارة</th>
                                        <th className="p-3">الـ KM المسجل</th>
                                        <th className="p-3 text-[#1dbf73]">الـ KM القادم المستهدف</th>
                                        <th className="p-3">الـ KM الحالي (اللوغز)</th>
                                        <th className="p-3 text-left">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {VALID_VEHICLES.map(vName => {
                                        const record = vidanges.find(v => v.vehicle_name === vName);
                                        return (
                                            <tr key={vName} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3 text-slate-900">🚗 {vName}</td>
                                                <td className="p-3 text-slate-500">{record ? `${Number(record.last_vidange_km).toFixed(0)} كم` : '---'}</td>
                                                <td className="p-3 text-[#1dbf73] font-black">{record ? `${Number(record.target_km).toFixed(0)} كم` : '---'}</td>
                                                <td className="p-3 text-slate-900 font-bold">{(currentMileages[vName] || 0).toFixed(0)} كم</td>
                                                <td className="p-3 text-left">
                                                    {record ? <button onClick={() => handleDeleteVidange(record.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><Trash2 size={13} /></button> : '---'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 🛡️ التاب 3: وثائق السيارات (مطور بـ التنبيهات المباشرة لداخل بـ الفصحى د الـ 10 أيام) */}
            {activeFleetTab === 'documents' && (
                <div className="space-y-6 max-w-4xl mx-auto print:hidden">

                    {/* بلاصة التحذيرات الخاصة بالوثائق والـ 10 أيام لداخل */}
                    {tabsAlertsStatus.documents.list.length > 0 && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                            {tabsAlertsStatus.documents.list.map((alert, i) => (
                                <div key={i} className="p-4 rounded-2xl border-2 text-xs font-black flex items-center gap-3 bg-rose-50 text-rose-900 border-rose-300 shadow-[0_4px_12px_rgba(244,63,94,0.1)]">
                                    <ShieldAlert size={18} className="text-rose-600 animate-pulse flex-shrink-0" />
                                    <div>{alert.msg}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <form onSubmit={handleUpdateDocument} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
                            <header className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-[#1dbf73] text-white rounded-lg flex items-center justify-center rotate-3 shadow-md"><ShieldAlert size={16} /></div>
                                <h4 className="font-black text-xs text-slate-900">تحديث وثائق السيارة</h4>
                            </header>

                            <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 pr-3 block font-black">نوع الوثيقة المستهدفة</label>
                                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full h-16 px-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-[#1dbf73] cursor-pointer">
                                    <option value="assurance">🛡️ التأمين  (Assurance)</option>
                                    <option value="vignette">💰 الضريبة السنوية (Vignette)</option>
                                    <option value="visite">🔍 الفحص التقني  (Visite Technique)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 pr-3 block font-black">تاريخ بداية صلاحية الوثيقة</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-16 pr-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-[#1dbf73]" required />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 pr-3 block font-black">تاريخ نهاية صلاحية الوثيقة</label>
                                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full h-16 pr-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 text-xs font-black focus:border-[#1dbf73]" required />
                            </div>

                            <button type="submit" className="w-full h-14 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center shadow-lg border-none">حفظ</button>
                        </form>

                        <div className="md:col-span-2 bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm overflow-x-auto">
                            <h4 className="text-xs font-black text-slate-900 mb-3 uppercase tracking-wider">سجل  وثائق السيارة: <span className="text-[#1dbf73]">{selectedVehicle}</span></h4>
                            <table className="w-full text-right border-collapse text-xs font-black text-slate-800">
                                <thead>
                                    <tr className="border-b-2 border-slate-950 bg-slate-50 text-[10px] text-slate-400">
                                        <th className="p-3">نوع الوثيقة</th>
                                        <th className="p-3 text-emerald-600 font-bold">تاريخ البداية</th>
                                        <th className="p-3 text-rose-600 font-bold">تاريخ انتهاء الصلاحية</th>
                                        <th className="p-3 text-left print:hidden">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDocumentsByVehicle.length === 0 ? (
                                        <tr><td colSpan={4} className="p-6 text-center text-slate-300 font-bold italic">لا توجد وثائق مسجلة لـ هاته السيارة حالياً.</td></tr>
                                    ) : (
                                        filteredDocumentsByVehicle.map(d => {
                                            let docLabel = d.document_type === 'assurance' ? '🛡️ التأمين' : d.document_type === 'vignette' ? '💰 الضريبة' : '🔍 الفحص التقني';
                                            return (
                                                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3 text-slate-700 font-black">{docLabel}</td>
                                                    <td className="p-3 text-emerald-600 font-bold">{d.start_date || '---'}</td>
                                                    <td className="p-3 text-rose-600 font-bold">{d.expiry_date}</td>
                                                    <td className="p-3 text-left print:hidden">
                                                        <button onClick={() => handleDeleteDocument(d.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"><Trash2 size={13} /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}