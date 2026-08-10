'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Search, Trash2, RefreshCw, User, Coins } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Agency } from '@/types/dashboard';

interface ExtraHourRecord {
    id: string;
    student_name: string;
    start_time: string;
    end_time: string;
    hourly_rate: number;
    total_hours: number;
    total_amount: number;
    log_date: string;
    notes?: string;
    instructor_name: string;
    agency_name: string;
    created_at: string;
}

interface Props {
    selectedAgency?: Agency | null;
}

export default function ManagerExtraHours({ selectedAgency }: Props) {
    const [records, setRecords] = useState<ExtraHourRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedInstructor, setSelectedInstructor] = useState<string>('all');

    // 🚀 جلب البيانات من Supabase
    const fetchExtraHours = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('extra_hours')
                .select('*')
                .order('log_date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (err: any) {
            console.error("Error fetching extra hours:", err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExtraHours();
    }, [fetchExtraHours]);

    // 🚀 حذف سجل
    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا التسجيل؟")) return;
        try {
            const { error } = await supabase.from('extra_hours').delete().eq('id', id);
            if (error) throw error;
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
            alert("خطأ في الحذف: " + err.message);
        }
    };

    // 🔍 الفلترة الذكية المربوطة بـ المدربين والوكالات
    const filteredRecords = useMemo(() => {
        return records.filter(item => {
            const matchesSearch = item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesInstructor = true;
            if (selectedInstructor === 'Hamza') {
                matchesInstructor = item.instructor_name.toLowerCase().includes('hamza') || item.agency_name.toLowerCase().includes('boudinar');
            } else if (selectedInstructor === 'Bilal') {
                matchesInstructor = item.instructor_name.toLowerCase().includes('bilal') || item.agency_name.toLowerCase().includes('krona');
            } else if (selectedInstructor === 'Ismail') {
                matchesInstructor = item.instructor_name.toLowerCase().includes('ismail') || item.agency_name.toLowerCase().includes('azghar');
            } else if (selectedInstructor === 'Belkassmi') {
                matchesInstructor = item.instructor_name.toLowerCase().includes('belkassmi') || item.agency_name.toLowerCase().includes('tazaghine');
            }

            return matchesSearch && matchesInstructor;
        });
    }, [records, searchTerm, selectedInstructor]);

    // 📊 حساب المجموع الشامل للكروت العلوية (Totals)
    const totalHours = filteredRecords.reduce((acc, curr) => acc + (Number(curr.total_hours) || 0), 0);
    const totalAmount = filteredRecords.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 font-normal text-right" dir="rtl">
            
            {/* 🔝 1. الكروت العلوية للإحصائيات الشاملة (Totals) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* إجمالي الساعات */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-slate-400">إجمالي الساعات</span>
                        <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">ساعة</span></h3>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                </div>

                {/* إجمالي المبالغ */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-slate-400">إجمالي المبالغ المالية</span>
                        <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalAmount} <span className="text-xs font-normal text-slate-400">DH</span></h3>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Coins size={20} />
                    </div>
                </div>

                {/* عدد الحصص */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-slate-400">عدد الحصص المسجلة</span>
                        <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{filteredRecords.length} <span className="text-xs font-normal text-slate-400">حصة</span></h3>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                        <User size={20} />
                    </div>
                </div>
            </div>

            {/* 🔍 2. شريط البحث واختيار المدرب / الوكالة */}
            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                
                {/* خانة البحث */}
                <div className="relative w-full md:w-80">
                    <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="بحث باسم المترشح..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-300"
                    />
                </div>

                {/* فلتر المدربين */}
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <label className="text-xs text-slate-500 font-medium">عرض حسب المدرب:</label>
                    <select
                        value={selectedInstructor}
                        onChange={(e) => setSelectedInstructor(e.target.value)}
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer focus:border-emerald-500 font-medium"
                    >
                        <option value="all">🌐 كل المدربين (جميع الوكالات)</option>
                        <option value="Hamza">👤 Hamza — (Boudinar)</option>
                        <option value="Bilal">👤 Bilal — (Krona)</option>
                        <option value="Ismail">👤 Ismail — (Azghar)</option>
                        <option value="Belkassmi">👤 Belkassmi — (Tazaghine)</option>
                    </select>

                    <button
                        onClick={fetchExtraHours}
                        className="p-2 bg-slate-100 hover:bg-slate-200/70 text-slate-600 rounded-xl transition-colors border border-slate-200/60"
                        title="تحديث البيانات"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* 📜 3. جدول التفاصيل المقسم بوضوح */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 text-xs font-medium">
                                <th className="p-3.5">المترشح</th>
                                <th className="p-3.5">المدرب</th>
                                <th className="p-3.5">الوكالة</th>
                                <th className="p-3.5">البداية</th>
                                <th className="p-3.5">النهاية</th>
                                <th className="p-3.5">الساعات</th>
                                <th className="p-3.5">ثمن الساعة</th>
                                <th className="p-3.5">المبلغ الإجمالي</th>
                                <th className="p-3.5">التاريخ</th>
                                <th className="p-3.5 text-center">حذف</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-400 font-normal">جاري التحميل...</td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-400 font-normal">لا توجد ساعات إضافية مسجلة</td>
                                </tr>
                            ) : (
                                filteredRecords.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                        
                                        {/* اسم المترشح */}
                                        <td className="p-3.5 font-medium text-slate-800">
                                            {item.student_name}
                                            {item.notes && <p className="text-[10px] text-slate-400 font-normal mt-0.5">{item.notes}</p>}
                                        </td>

                                        {/* المدرب */}
                                        <td className="p-3.5 font-medium text-slate-700">{item.instructor_name}</td>

                                        {/* الوكالة */}
                                        <td className="p-3.5">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[11px]">
                                                {item.agency_name}
                                            </span>
                                        </td>

                                        {/* وقت البداية */}
                                        <td className="p-3.5 text-slate-600 font-medium dir-ltr text-right">
                                            {item.start_time}
                                        </td>

                                        {/* وقت النهاية */}
                                        <td className="p-3.5 text-slate-600 font-medium dir-ltr text-right">
                                            {item.end_time}
                                        </td>

                                        {/* مجموع ساعات الحصة */}
                                        <td className="p-3.5 font-semibold text-emerald-600">
                                            {item.total_hours} hr
                                        </td>

                                        {/* ثمن الساعة */}
                                        <td className="p-3.5 text-slate-500">
                                            {item.hourly_rate} DH
                                        </td>

                                        {/* المجموع المالي للحصة */}
                                        <td className="p-3.5 font-bold text-slate-900">
                                            {item.total_amount} DH
                                        </td>

                                        {/* التاريخ */}
                                        <td className="p-3.5 text-slate-400 font-normal">
                                            {item.log_date}
                                        </td>

                                        {/* زر الحذف */}
                                        <td className="p-3.5 text-center">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}