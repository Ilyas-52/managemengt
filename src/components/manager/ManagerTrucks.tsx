'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    AlertTriangle, Timer, Wallet, TrendingUp, CheckCircle2,
    Calendar, Truck, MapPin, Trash2, Save, Activity, User, CreditCard,
    Search, ChevronDown, UserPlus, X
} from 'lucide-react';
import { generateWeeklyBilan } from './WeeklyTrucksReport';

import { Agency } from '@/types/dashboard';

// 🚀 المسمار 1: الـ Interface لضبط أنواع البيانات ومنع الأخطاء
interface TruckFormData {
    id?: string;
    firstName: string;
    lastName: string;
    registrationDate: string;
    examDate: string;
    licenseType: string;
    trainingLocation: string;
    totalPrice: string | number;
    paidTimbreIn: number;
    paidMedicalIn: number;
    // ✅ المسمار الجديد: الملاحظات
    notes: string;
    t1: string | number; t2: string | number; t3: string | number; t4: string | number; t5: string | number;
    t1_date: string; t2_date: string; t3_date: string; t4_date: string; t5_date: string;
    [key: string]: string | number | boolean | undefined;
}

interface Props {
    selectedAgency?: Agency | null;
}

export default function ManagerTrucks({ selectedAgency }: Props) {
    const [fetching, setFetching] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);

    // 📥 1. جلب البيانات من Supabase مع الفلترة حسب الوكالة النشطة
    const fetchStudents = async () => {
        if (!selectedAgency?.id) return;
        setFetching(true);

        let query = supabase.from('truck_students').select('*');

        // المقر الرئيسي (بودينار): تجاوز الفلترة الصارمة لرؤية جميع الطلبة من جميع الوكالات
        if (selectedAgency.name !== 'Boudinar') {
            query = query.eq('agence_id', selectedAgency.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) setStudents(data);
        setFetching(false);
    };

    useEffect(() => {
        const fetchAgencies = async () => {
            const { data, error } = await supabase.from('agencies').select('id, name');
            if (!error && data) setAgencies(data);
        };
        fetchAgencies();
    }, []);

    const getAgencyName = (agenceId: string | null) => {
        if (!agenceId) return 'المقر الرئيسي';
        const agency = agencies.find(a => a.id === agenceId);
        return agency ? agency.name : 'المقر الرئيسي';
    };

    useEffect(() => {
        if (selectedAgency?.id) {
            fetchStudents();
        }
    }, [selectedAgency]);

    const handleDelete = async (id: string) => {
        if (!confirm("واش بصح باغي تمسح هاد التسجيل؟")) return;
        const { error } = await supabase.from('truck_students').delete().eq('id', id);
        if (!error) fetchStudents();
    };

    // 📊 حساب الحصيلة
    const stats = students.reduce((acc, s) => {
        const total = Number(s.total_price) || 0;
        const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
        acc.exp += total; acc.coll += paid; acc.rem += (total - paid);
        return acc;
    }, { exp: 0, coll: 0, rem: 0 });

    const filteredStudents = students.filter(s => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;
        const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
        const licenseType = (s.license_type || '').toLowerCase();
        return fullName.includes(query) || licenseType.includes(query);
    });

    return (
        /* ✅ التعديل: نقصنا الـ Padding فـ الشاشات الكبيرة وزدنا max-w باش يبقى الوسط */
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-4 space-y-10 pb-40 font-black italic text-right uppercase tracking-tighter overflow-x-hidden" dir="rtl">
            {/* 🛰️ 4. الـ HEADER بـ الـ SEARCH النقي */}
            <div className="sticky top-0 z-[150] w-full pt-2">
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-[2.5rem] px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* 1. اللوغو والزر - مجموعين فـ صف واحد فـ الموبيل */}
                    <div className="flex items-center justify-between w-full md:w-auto gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
                                <Truck size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black italic uppercase leading-none">{selectedAgency?.name || 'وكالة'}</span>

                            </div>
                        </div>

                        <button
                            onClick={() => generateWeeklyBilan(students, selectedAgency?.name || 'Boudinar')}
                            className="bg-[#0F5A3E] hover:bg-emerald-800 text-white px-4 py-2.5 rounded-[15px] text-[10px] font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 border-b-2 border-emerald-900"
                        >
                            <Calendar size={14} className="text-emerald-300" />
                            <span>التقرير الأسبوعي</span>
                        </button>
                    </div>

                    {/* 2. البحث - كاياخد العرض كامل فـ الموبيل */}
                    <div className="w-full md:flex-1 md:max-w-md relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={16} /></div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="بحث عن مترشح (الاسم أو صنف الرخصة)..."
                            className="w-full pl-11 pr-10 py-3 bg-slate-100/50 border border-transparent rounded-full text-sm font-black outline-none focus:bg-white focus:border-[#0F5A3E] transition-all text-right"
                        />
                    </div>

                    {/* 3. پروفيل المستخدم - مخفي فـ الموبيل باش يخلي التيساع */}
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-[11px] font-black italic">يونس بودينار</span>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-sm"><User size={20} /></div>
                    </div>
                </div>
            </div>

            {/* 🔝 STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-700">
                <div className="bg-white border-2 border-slate-100 rounded-[25px] p-6 flex items-center justify-between shadow-sm">
                    <div><p className="text-[9px] text-slate-400">إجمالي المداخيل</p><h2 className="text-2xl text-slate-900 leading-none">{stats.exp} DH</h2></div>
                    <TrendingUp size={24} className="text-slate-200" />
                </div>
                <div className="bg-white border-2 border-emerald-100 rounded-[25px] p-6 flex items-center justify-between shadow-sm">
                    <div><p className="text-[9px] text-emerald-600">المبلغ المحصل عليه</p><h2 className="text-2xl text-emerald-600 leading-none">{stats.coll} DH</h2></div>
                    <Wallet size={24} className="text-emerald-500" />
                </div>
                <div className="bg-white border-2 border-rose-100 rounded-[25px] p-6 flex items-center justify-between shadow-sm">
                    <div><p className="text-[9px] text-rose-400">الديون العالقة</p><h2 className="text-2xl text-rose-600 leading-none">{stats.rem} DH</h2></div>
                    <AlertTriangle size={24} className="text-rose-500 animate-pulse" />
                </div>
            </div>

            {/* 📱 نسخة التليفون: Cards ناضيين */}
            <div className="grid grid-cols-1 gap-4 sm:hidden animate-in slide-in-from-bottom-4 duration-1000">
                {filteredStudents.map(s => {
                    const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
                    const rest = (s.total_price || 0) - paid;

                    return (
                        <div key={s.id} className="bg-white border-2 border-slate-900 rounded-[35px] p-6 space-y-4 shadow-xl relative overflow-hidden">

                            {/* 👤 الجزء العلوي */}
                            <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                                <div className="space-y-2">
                                    {/* ✅ السمية + أيقونة الملاحظة */}
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg text-slate-900 font-black leading-none uppercase italic">
                                            {s.first_name} {s.last_name}
                                        </p>

                                        {/* 💡 مسمار الملاحظة فـ التليفون */}
                                        {s.notes && (
                                            <div className="bg-emerald-100 text-emerald-700 p-1 rounded-lg animate-bounce">
                                                <Activity size={12} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        <span className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded-lg font-black tracking-tighter uppercase italic">
                                            Permis {s.license_type || 'C'}
                                        </span>
                                        <span className="bg-[#0F5A3E] text-white text-[9px] px-2 py-1 rounded-md font-black shadow-sm">
                                            {s.training_location === 'lboubsi' ? 'البوبسي' :
                                                s.training_location === 'YOUNESS' ? 'مؤسسة يونس' :
                                                    s.training_location === 'sa3lity' ? 'السعليتي' :
                                                        (s.training_location || 'السعليتي')}
                                        </span>
                                        <span className="bg-orange-500 text-white text-[9px] px-2 py-1 rounded-md font-black shadow-sm">
                                            الوكالة: {getAgencyName(s.agence_id)}
                                        </span>
                                    </div>
                                    {/* 📅 تواريخ التسجيل والامتحان فـ التليفون */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                                            <Calendar size={10} className="text-slate-500" />
                                            <span className="text-[9px] font-black text-slate-700 italic">سجل فـ: {s.registration_date}</span>
                                        </div>

                                        {s.exam_date && (
                                            <div className="flex items-center gap-1.5 bg-amber-100 px-2 py-1 rounded-lg border border-amber-200">
                                                <Timer size={10} className="text-amber-600" />
                                                <span className="text-[9px] font-black text-amber-800 italic">الامتحان: {s.exam_date}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-left font-black italic">
                                    <p className="text-[14px] text-slate-900 leading-none">{s.total_price} DH</p>
                                    <p className="text-[7px] text-slate-400 uppercase">الإجمالي</p>
                                </div>
                            </div>

                            {/* ✅ عرض الملاحظة إيلا كانت كاينة (كتطلع تحت السمية فـ التليفون) */}
                            {s.notes && (
                                <div className="mt-2 bg-slate-900 text-white p-3 rounded-[20px] border-b-4 border-emerald-500 shadow-lg animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity size={10} className="text-emerald-400" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">ملاحظة المدير يونس</span>
                                    </div>
                                    <p className="text-[10px] font-bold italic leading-tight text-slate-100">
                                        {s.notes}
                                    </p>
                                </div>
                            )}

                            {/* 💳 الدفعات (T1-T5) */}
                            <div className="grid grid-cols-5 gap-1.5">
                                {[1, 2, 3, 4, 5].map(n => {
                                    const amount = s[`t${n}`];
                                    const dateRaw = s[`t${n}_date`];
                                    const isPaid = Number(amount) > 0;

                                    // ✅ مسمار التفكيك الذكي
                                    let cleanDate = '';
                                    let cleanTime = '';
                                    if (isPaid && dateRaw) {
                                        const parts = dateRaw.split('T');
                                        cleanDate = parts[0].substring(5); // كياخد غير "الشهر-اليوم" (مثلا 05-07) باش يجي صغير
                                        if (parts[1]) cleanTime = parts[1].substring(0, 5); // كياخد "13:45"
                                    }

                                    return (
                                        <div key={n} className="flex flex-col gap-1">
                                            {/* 💰 مربع الدفعة (بقا صغير باش يقدنا السطر) */}
                                            <div className={`h-11 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${isPaid ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                <span className={`text-[6px] font-bold italic ${isPaid ? 'text-emerald-400' : ''}`}>T{n}</span>
                                                <span className="text-[9px] font-black">{amount || '--'}</span>
                                            </div>

                                            {/* 🕒 التاريخ والوقت (كيبانو غير إيلا كاين الخلاص) */}
                                            {isPaid && dateRaw && (
                                                <div className="flex flex-col items-center leading-none bg-slate-100/50 rounded-xl py-1.5 border border-slate-200 mt-1 shadow-sm">
                                                    {/* ✅ مسمار التاريخ الكامل: كيهز من 0 تال 10 يعني (2026-05-07) */}
                                                    <span className="text-[7.5px] font-black text-slate-900 mb-1 tracking-tighter">
                                                        {dateRaw.substring(0, 10)}
                                                    </span>

                                                    {/* ✅ الوقت بستايل نقي ومفصول */}
                                                    <div className="flex items-center gap-0.5">
                                                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                                        <span className="text-[7px] font-bold text-slate-500 tabular-nums uppercase">
                                                            {dateRaw.split('T')[1]?.substring(0, 5) || '--:--'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* الدوائر والوضعية المالية (بقا كولشي هو هاداك) */}
                            <div className="flex justify-between items-center mt-3 border-t border-slate-100 pt-3">
                                <div className="flex gap-2">
                                    <div className={`w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center ${s.paid_timbre_in ? 'bg-orange-500 border-orange-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                        <span className="text-[8px] font-black">TB</span>
                                        <span className="text-[6px]">{s.paid_timbre_in || ''}</span>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center ${s.paid_medical_in ? 'bg-blue-50 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                        <span className="text-[8px] font-black">VM</span>
                                        <span className="text-[6px]">{s.paid_medical_in || ''}</span>
                                    </div>
                                </div>

                                {/* 🚨 تنبيه الامتحان فـ التليفون */}
                                {(s.exam_date && rest > 0) && (
                                    <div className="bg-orange-500 text-white p-3 rounded-2xl flex items-center justify-center gap-3 shadow-lg border-b-4 border-orange-700 mb-2 animate-bounce">
                                        <AlertTriangle size={18} strokeWidth={3} />
                                        <p className="text-[11px] font-black italic uppercase">🚨 خطر: المترشح عندو امتحان ومازال ماتخلصناش!</p>
                                    </div>
                                )}

                                {/* 🚩 الوضعية المالية (اللي كانت عندك ديجا) */}
                                <div className={`p-4 rounded-2xl text-center font-black text-[13px] ${rest === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    {rest === 0 ? '✓ حساب خالص' : `الباقي : ${rest} DH`}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 💻 نسخة الـ PC: Tableau احترافي */}
            <div className="hidden sm:block bg-white border-2 border-slate-100 rounded-[45px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-right border-separate border-spacing-0">
                        <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase italic">
                            <tr>
                                {/* 👤 الاسم بوحدو */}
                                <th className="p-8 sticky right-0 bg-white z-40 border-l border-slate-100 w-[200px] text-slate-900 font-black">المترشح</th>
                                {/* 🚚 الصنف بوحدو */}
                                <th className="text-center font-black w-[150px]"> الصنف / المكان</th>
                                {/* 🏦 الوكالة */}
                                <th className="text-center font-black w-[130px]">الوكالة</th>
                                <th className="text-center font-black">الثمن الكلي</th>
                                <th className="text-center font-black">الدفعات (T1-T5)</th>
                                <th className="text-center w-[80px] font-black">TB</th>
                                <th className="text-center w-[80px] font-black">VM</th>
                                <th className="text-center font-black">التواريخ</th>
                                <th className="text-left pl-8 font-black">الوضعية المالية</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fetching ? (
                                <tr><td colSpan={8} className="p-20 text-center animate-pulse font-black text-slate-300">جاري جلب البيانات...</td></tr>
                            ) : filteredStudents.map(s => {
                                const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
                                const rest = (s.total_price || 0) - paid;
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer">

                                        {/* 👤 1. الاسم (بوحدو ناضي) */}
                                        {/* 👤 1. الاسم (مع مسمار الملاحظة الذكية) */}
                                        <td className="p-8 sticky right-0 bg-white group-hover:bg-slate-50 border-l-2 border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <p className="font-black text-slate-900 text-base leading-none uppercase italic">
                                                    {s.first_name} {s.last_name}
                                                </p>

                                                {/* 💡 مسمار الملاحظة بـ ديزاين جديد وهيبة */}
                                                {s.notes && (
                                                    <div className="relative group/note">
                                                        {/* الأيقونة بستايل زوين */}
                                                        <div className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center cursor-help hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm border border-amber-200">
                                                            <Activity size={12} strokeWidth={3} />
                                                        </div>

                                                        {/* 🎈 البلونة الذكية */}
                                                        <div className="absolute bottom-full right-0 mb-3 hidden group-hover/note:block z-[100] w-72 bg-white border-2 border-slate-900 rounded-[25px] shadow-2xl animate-in fade-in zoom-in duration-300">
                                                            <div className="p-4 relative">
                                                                {/* العنوان بـ هيبة المدير */}
                                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                                    <span className="text-[10px] font-black text-slate-900 uppercase">ملاحظات من يونس: مدير المؤسسة</span>
                                                                </div>

                                                                {/* النص ديال الملاحظة */}
                                                                <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed pr-2">
                                                                    "{s.notes}"
                                                                </p>

                                                                {/* مسمار المثلث */}
                                                                <div className="absolute top-[100%] right-5 w-4 h-4 bg-white border-r-2 border-b-2 border-slate-900 rotate-45 -translate-y-2"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {/* 🚚 2. الصنف والحالة (فـ خانة بوحدهم وبـ العربية) */}
                                        {/* 🚀 الترجمة الفورية للعربية فـ الجدول (PC) */}
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded-lg font-black tracking-tighter shadow-sm border border-slate-800 uppercase italic">
                                                    Permis {s.license_type || 'C'}
                                                </span>
                                                <span className="bg-[#0F5A3E] text-white text-[11px] px-3 py-1 rounded-lg font-black shadow-sm border border-emerald-900">
                                                    {s.training_location === 'lboubsi' ? 'البوبسي' :
                                                        s.training_location === 'YOUNESS' ? 'مؤسسة يونس' :
                                                            s.training_location === 'sa3lity' ? 'السعليتي' :
                                                                (s.training_location || 'السعليتي')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* 🏦 الوكالة */}
                                        <td className="p-4 text-center">
                                            <span className="bg-orange-500 text-white text-[10px] px-3 py-1 rounded-lg font-black tracking-tighter shadow-sm border border-orange-600">
                                                {getAgencyName(s.agence_id)}
                                            </span>
                                        </td>

                                        <td className="text-center text-slate-500 font-black italic">DH {s.total_price}</td>

                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {[1, 2, 3, 4, 5].map(n => {
                                                    const amount = s[`t${n}`];
                                                    const dateRaw = s[`t${n}_date`]; // التاريخ اللي جاي من Supabase

                                                    let cleanDate = '--';
                                                    let cleanTime = '';

                                                    if (dateRaw) {
                                                        // ✅ مسمار التفكيك: كنفرقو التاريخ على الوقت
                                                        const parts = dateRaw.split('T');
                                                        cleanDate = parts[0]; // كيهز: 2026-05-07
                                                        if (parts[1]) {
                                                            cleanTime = parts[1].substring(0, 5); // كيهز: 13:45 (كيطير الثواني و UTC)
                                                        }
                                                    }

                                                    const isPaid = Number(amount) > 0;

                                                    return (
                                                        <div key={n} className="flex flex-col items-center gap-1.5">
                                                            {/* 💰 مربع الدفعة */}
                                                            <div className={`w-16 h-14 rounded-[20px] border-2 flex flex-col items-center justify-center transition-all ${isPaid ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                                <span className={`text-[7px] font-black uppercase ${isPaid ? 'text-emerald-400' : 'text-slate-400'}`}>T{n}</span>
                                                                <span className="text-[12px] font-black italic">{amount || '--'}</span>
                                                            </div>

                                                            {/* 🕒 مسمار التاريخ والوقت الذكي */}
                                                            {isPaid && cleanDate !== '--' ? (
                                                                <div className="flex flex-col items-center leading-none">
                                                                    {/* التاريخ بالبونت العريض */}
                                                                    <span className="text-[10px] font-black text-slate-900 tracking-tighter mb-0.5">
                                                                        {cleanDate}
                                                                    </span>

                                                                    {/* الوقت بستايل خفيف (Minimalist) */}
                                                                    <div className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                                                        <span className="text-[8px] font-black text-slate-400 italic">T</span>
                                                                        <span className="text-[9px] font-black text-slate-500 tabular-nums">
                                                                            {cleanTime}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-[30px]"></div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        <td className="p-2 text-center italic">
                                            <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center mx-auto transition-all ${s.paid_timbre_in ? 'bg-orange-500 border-orange-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                <span className="text-[10px] font-black">TB</span>
                                                <span className="text-[7px]">{s.paid_timbre_in || ''}</span>
                                            </div>
                                        </td>

                                        <td className="p-2 text-center italic">
                                            <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center mx-auto transition-all ${s.paid_medical_in ? 'bg-blue-500 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                <span className="text-[10px] font-black">VM</span>
                                                <span className="text-[7px]">{s.paid_medical_in || ''}</span>
                                            </div>
                                        </td>

                                        <td className="text-center text-[11px]">
                                            <div className="flex flex-col items-center gap-2 py-2">
                                                {/* 📅 تاريخ التسجيل */}
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                                    <span className="text-[8px] text-slate-400 font-black uppercase italic">سجل في:</span>
                                                    <span className="text-slate-900 font-black">{s.registration_date || '--/--/--'}</span>
                                                </div>

                                                {/* 🏁 تاريخ الامتحان */}
                                                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                                    <span className="text-[8px] text-amber-600 font-black uppercase italic">الامتحان:</span>
                                                    <span className="text-amber-900 font-black">{s.exam_date || '--/--/--'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-8 text-left pl-8">
                                            <div className="flex items-center gap-3 justify-end">
                                                {/* 🚨 مسمار التنبيه الذكي */}
                                                {(s.exam_date && rest > 0) && (
                                                    <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-xl border border-orange-200 animate-pulse">
                                                        <AlertTriangle size={14} strokeWidth={3} />
                                                        <span className="text-[9px] font-black uppercase italic">رد البال: امتحان بلا خلاص!</span>
                                                    </div>
                                                )}

                                                <span className={`px-5 py-2.5 rounded-2xl text-[12px] font-black shadow-sm ${rest === 0 ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-50 text-rose-600 border-2 border-rose-100'}`}>
                                                    {rest === 0 ? 'خالص ✓' : `${rest} DH`}
                                                </span>

                                                {/* بوطون الحذف */}
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-3 bg-rose-50 text-rose-300 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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