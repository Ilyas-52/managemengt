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
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const initialForm: TruckFormData = {
        firstName: '', lastName: '',
        registrationDate: new Date().toISOString().split('T')[0],
        examDate: '', licenseType: 'C', trainingLocation: 'lboubsi',
        totalPrice: '', paidTimbreIn: 0, paidMedicalIn: 0,
        notes: '',
        t1: '', t2: '', t3: '', t4: '', t5: '',
        t1_date: '', t2_date: '', t3_date: '', t4_date: '', t5_date: ''
    };

    const [formData, setFormData] = useState<TruckFormData>(initialForm);

    // 📥 1. جلب البيانات من Supabase
    const fetchStudents = async () => {
        setFetching(true);
        const { data, error } = await supabase
            .from('truck_students')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setStudents(data);
        setFetching(false);
    };

    useEffect(() => { fetchStudents(); }, []);

    // 🔄 2. تعمير الفورم أوتوماتيكياً عند اختيار تلميذ للبحث/التعديل
    useEffect(() => {
        if (selectedStudentId) {
            const student = students.find(s => s.id === selectedStudentId);
            if (student) {
                setFormData({
                    id: student.id,
                    firstName: student.first_name,
                    lastName: student.last_name,
                    // ✅ المسمار: جيب الملاحظة اللي مسجلة فـ الداتابيز، وإيلا كانت خاوية دير ''
                    notes: student.notes || '',
                    registrationDate: student.registration_date,
                    examDate: student.exam_date || '',
                    licenseType: student.license_type,
                    trainingLocation: student.training_location,
                    totalPrice: student.total_price,
                    paidTimbreIn: student.paid_timbre_in,
                    paidMedicalIn: student.paid_medical_in,
                    t1: student.t1, t2: student.t2, t3: student.t3, t4: student.t4, t5: student.t5,
                    t1_date: student.t1_date || '',
                    t2_date: student.t2_date || '',
                    t3_date: student.t3_date || '',
                    t4_date: student.t4_date || '',
                    t5_date: student.t5_date || ''
                });
            }
        } else {
            setFormData(initialForm);
        }
    }, [selectedStudentId, students]);

    // 📤 3. الحفظ (Insert) أو التعديل (Update)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.totalPrice) return alert("الاسم والثمن ضروريين")
        setLoading(true);

        const dataToSave = {
            agence_id: 'cad4abd4-9c56-4069-9348-c386e1889b6c',
            notes: formData.notes || '',
            first_name: formData.firstName,
            last_name: formData.lastName,
            registration_date: formData.registrationDate,
            exam_date: formData.examDate || null,
            license_type: formData.licenseType,
            training_location: formData.trainingLocation,
            total_price: Number(formData.totalPrice),
            paid_timbre_in: formData.paidTimbreIn,
            paid_medical_in: formData.paidMedicalIn,
            t1: Number(formData.t1) || 0, t2: Number(formData.t2) || 0,
            t3: Number(formData.t3) || 0, t4: Number(formData.t4) || 0, t5: Number(formData.t5) || 0,
            t1_date: formData.t1_date || null, t2_date: formData.t2_date || null, t3_date: formData.t3_date || null, t4_date: formData.t4_date || null, t5_date: formData.t5_date || null
        };

        const { error } = selectedStudentId
            ? await supabase.from('truck_students').update(dataToSave).eq('id', selectedStudentId)
            : await supabase.from('truck_students').insert([dataToSave]);

        if (!error) {
            alert(selectedStudentId ? "تم التعديل بنجاح! 🛰️" : "تم التسجيل بنجاح! 🛰️");
            fetchStudents();
            if (!selectedStudentId) setFormData(initialForm);
        } else {
            alert("وقع مشكل فـ السيرفر!");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("واش بصح باغي تمسح هاد التسجيل؟")) return;
        const { error } = await supabase.from('truck_students').delete().eq('id', id);
        if (!error) fetchStudents();
    };

    const handleInputChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;
        setFormData(prev => {
            const newData = { ...prev, [key]: value };
            if (['t1', 't2', 't3', 't4', 't5'].includes(key)) {
                newData[`${key}_date`] = value ? new Date().toISOString() : '';
            }
            return newData;
        });
    };

    // 📊 حساب الحصيلة
    const stats = students.reduce((acc, s) => {
        const total = Number(s.total_price) || 0;
        const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
        acc.exp += total; acc.coll += paid; acc.rem += (total - paid);
        return acc;
    }, { exp: 0, coll: 0, rem: 0 });

    const currentRest = (Number(formData.totalPrice) || 0) - (
        [1, 2, 3, 4, 5].reduce((acc, n) => acc + (Number(formData[`t${n}`]) || 0), 0)
    );

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
                        <select
                            value={selectedStudentId || ''}
                            onChange={(e) => setSelectedStudentId(e.target.value || null)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-100/50 border border-transparent rounded-full text-sm font-black outline-none appearance-none focus:bg-white focus:border-[#0F5A3E] transition-all cursor-pointer"
                        >
                            <option value="" className="text-emerald-600 font-black">➕ إضافة مترشح جديد</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>👤 {s.first_name} {s.last_name} ({s.license_type})</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={14} /></div>
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

            {/* 📝 FORMULAIRE DE REGISTRATION / MODIFICATION */}
            <form onSubmit={handleSubmit} className="bg-white rounded-[45px] p-10 border-2 border-slate-900 shadow-2xl space-y-12 relative overflow-hidden">
                {selectedStudentId && (
                    <div className="absolute top-0 left-0 right-0 bg-[#0F5A3E] text-white py-2 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-4">
                        <Activity size={12} className="animate-spin" /> وضع التعديل مـفـعـل <Activity size={12} className="animate-spin" />
                    </div>
                )}

                <div className="flex items-center gap-3 border-r-4 border-[#0F5A3E] pr-4 mt-4">
                    <UserPlus size={20} className="text-[#0F5A3E]" />
                    <h2 className="text-lg">{selectedStudentId ? 'تعديل بيانات مترشح' : 'تسجيل مترشح جديد (وزن ثقيل)'}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-2"><label className="text-xs px-2">الاسم الشخصي</label><input type="text" value={formData.firstName} onChange={handleInputChange('firstName')} className="w-full h-16 bg-slate-50 rounded-2xl px-6 outline-none border-2 border-transparent focus:border-slate-900 text-center text-lg font-black" /></div>
                    <div className="space-y-2"><label className="text-xs px-2">الاسم العائلي</label><input type="text" value={formData.lastName} onChange={handleInputChange('lastName')} className="w-full h-16 bg-slate-50 rounded-2xl px-6 outline-none border-2 border-transparent focus:border-slate-900 text-center text-lg font-black" /></div>
                    <div className="space-y-2"><label className="text-xs px-2 flex items-center gap-1"><Truck size={12} /> الصنف</label><select value={formData.licenseType} onChange={handleInputChange('licenseType')} className="w-full h-16 bg-slate-50 rounded-2xl px-6 outline-none border-2 border-transparent focus:border-slate-900 font-black px-4"><option value="C">Permis C</option><option value="D">Permis D</option><option value="E">Permis E</option><option value="A">Permis A</option></select></div>
                    <div className="space-y-2"><label className="text-xs px-2 flex items-center gap-1"><MapPin size={12} /> المكان</label><select value={formData.trainingLocation} onChange={handleInputChange('trainingLocation')} className="w-full h-16 bg-slate-50 rounded-2xl px-6 outline-none border-2 border-transparent focus:border-slate-900 font-black px-4"><option value="lboubsi">البوبسي</option><option value="sa3lity">السعليتي</option><option value="YOUNESS">مؤسسة يونس</option></select></div>
                    <div className="space-y-2"><label className="text-xs px-2 flex items-center gap-1"><Calendar size={12} /> تاريخ التسجيل</label><input type="date" value={formData.registrationDate} onChange={handleInputChange('registrationDate')} className="w-full h-16 bg-slate-50 rounded-2xl px-6 outline-none text-left font-black" dir="ltr" /></div>
                    <div className="space-y-2"><label className="text-xs px-2 flex items-center gap-1"><Timer size={12} /> تاريخ الامتحان</label><input type="date" value={formData.examDate} onChange={handleInputChange('examDate')} className="w-full h-16 bg-slate-50 rounded-2xl px-6 outline-none text-left font-black" dir="ltr" /></div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-xs px-2 text-emerald-600 font-black">الثمن المتفق عليه</label>
                        <div className="relative">
                            <input type="number" value={formData.totalPrice} onChange={handleInputChange('totalPrice')} className="w-full h-20 bg-emerald-50 rounded-3xl px-6 outline-none border-2 border-transparent focus:border-emerald-500 text-center text-3xl font-black text-emerald-700" placeholder="0" />
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] text-emerald-300 font-black">DH</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 pt-8 border-t-2 border-slate-50">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm text-slate-400 flex items-center gap-2"><CreditCard size={16} /> توزيع الدفعات (Tranches)</h3>
                        <div className={`px-6 py-2 rounded-full border-2 text-[11px] font-black ${currentRest === 0 ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'}`}>الباقي: {currentRest} DH</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} className="bg-slate-50 p-5 rounded-[30px] space-y-4 border-2 border-transparent hover:border-slate-900 transition-all">
                                <span className="text-[10px] text-slate-300 font-black uppercase">الدفعة {n}</span>
                                <input type="number" value={formData[`t${n}`] as number || ''} onChange={handleInputChange(`t${n}`)} className="w-full h-12 bg-white rounded-xl text-center font-black outline-none shadow-sm" placeholder="0" />
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, paidTimbreIn: prev.paidTimbreIn === n ? 0 : n }))} className={`flex-1 h-9 rounded-xl text-[10px] font-black border-2 transition-all ${formData.paidTimbreIn === n ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-slate-300'}`}>Tb</button>
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, paidMedicalIn: prev.paidMedicalIn === n ? 0 : n }))} className={`flex-1 h-9 rounded-xl text-[10px] font-black border-2 transition-all ${formData.paidMedicalIn === n ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-slate-300'}`}>Vm</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* 📝 خانة الملاحظات المصلحة */}
                <div className="flex flex-col gap-3">
                    <textarea
                        value={formData.notes || ''} // ✅ زدنا || '' باش إيلا كانت خاوية ما يعطيش Error
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} // ✅ رجعنا السمية notes باش تطابق الـ value
                        placeholder="مثال: التلميذ غايب هاد السيمانة، غايجي غير الثلاثاء مع 10:00..."
                        className="w-full min-h-[140px] p-6 bg-white border-2 border-amber-100 rounded-2xl outline-none focus:border-amber-400 text-slate-800 font-bold text-lg shadow-sm transition-all resize-none placeholder:text-slate-300 placeholder:font-normal"
                    />
                </div>

                <button disabled={loading} className={`w-full h-20 rounded-[35px] font-black text-xl transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${selectedStudentId ? 'bg-[#0F5A3E] hover:bg-emerald-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                    {loading ? <Activity className="animate-spin" /> : <Save size={24} />}
                    {loading ? '  جاري الحفظ...' : selectedStudentId ? 'تـحـديـث الـبـيـانـات 🛰️' : 'تأكيد تسجيل المترشح 🛰️'}
                </button>
            </form>

            {/* 📱 نسخة التليفون: Cards ناضيين */}
            <div className="grid grid-cols-1 gap-4 sm:hidden animate-in slide-in-from-bottom-4 duration-1000">
                {students.map(s => {
                    const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
                    const rest = (s.total_price || 0) - paid;

                    return (
                        <div key={s.id} className="bg-white border-2 border-slate-900 rounded-[35px] p-6 space-y-4 shadow-xl relative overflow-hidden" onClick={() => setSelectedStudentId(s.id)}>

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

                                    <div className="flex gap-2">
                                        <span className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded-lg font-black tracking-tighter uppercase italic">
                                            Permis {s.license_type || 'C'}
                                        </span>
                                        <span className="bg-[#0F5A3E] text-white text-[9px] px-2 py-1 rounded-md font-black shadow-sm">
                                            {s.training_location === 'lboubsi' ? 'البوبسي' :
                                                s.training_location === 'YOUNESS' ? 'مؤسسة يونس' :
                                                    s.training_location === 'sa3lity' ? 'السعليتي' :
                                                        (s.training_location || 'السعليتي')}
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
                            ) : students.map(s => {
                                const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
                                const rest = (s.total_price || 0) - paid;
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => setSelectedStudentId(s.id)}>

                                        {/* 👤 1. الاسم (بوحدو ناضي) */}
                                        {/* 👤 1. الاسم (مع مسمار الملاحظة الذكية) */}
                                        <td className="p-8 sticky right-0 bg-white z-20 group-hover:bg-slate-50 border-l-2 border-slate-100">
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