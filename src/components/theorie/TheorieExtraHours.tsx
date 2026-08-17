'use client';
import { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, User, Coins, Calendar, Trash2, Pencil, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types/dashboard';

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
    status?: string;
    created_at: string;
}

interface Props {
    selectedAgency?: any;
    instructorName?: string;
    agenceId?: string;
    agenceName?: string;
    students?: Student[];
}

export default function TheorieExtraHours({ selectedAgency, instructorName, agenceId, agenceName, students = [] }: Props) {
    const [loading, setLoading] = useState(false);
    const [fetchingLogs, setFetchingLogs] = useState(true);
    const [myLogs, setMyLogs] = useState<ExtraHourRecord[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        student_name: '',
        external_name: '',
        start_time: '18:00',
        end_time: '19:00',
        hourly_rate: '100',
        log_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const currentAgencyName = agenceName || selectedAgency?.name || 'Boudinar';
    const currentAgenceId = agenceId || selectedAgency?.id || null;
    const currentInstructor = instructorName || 'مدرس النظري';

    // 🚀 جلب الساعات الإضافية المسجلة الخاصة بـ مدرس النظري
    const fetchMyExtraHours = useCallback(async () => {
        setFetchingLogs(true);
        try {
            let query = supabase
                .from('extra_hours')
                .select('*')
                .order('log_date', { ascending: false })
                .order('created_at', { ascending: false });

            if (currentAgenceId) {
                query = query.eq('agence_id', currentAgenceId);
            } else if (currentAgencyName) {
                query = query.ilike('agency_name', `%${currentAgencyName}%`);
            }

            if (currentInstructor) {
                query = query.eq('instructor_name', currentInstructor);
            }

            const { data, error } = await query;
            if (error) throw error;
            setMyLogs(data || []);
        } catch (err: any) {
            console.error("Error fetching theorie extra hours logs:", err.message);
        } finally {
            setFetchingLogs(false);
        }
    }, [currentAgenceId, currentAgencyName, currentInstructor]);

    useEffect(() => {
        fetchMyExtraHours();
    }, [fetchMyExtraHours]);

    // ⏱️ حساب الدقائق بين البداية والنهاية
    const getDurationInMinutes = (start: string, end: string): number => {
        if (!start || !end) return 0;
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        return endMins > startMins ? endMins - startMins : 0;
    };

    // 🎯 تحويل الدقائق إلى صيغة واضحة (2h 05m)
    const formatDuration = (totalMins: number): string => {
        if (!totalMins || totalMins <= 0) return '0h 00m';
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins < 10 ? '0' : ''}${mins}m`;
    };

    const displayStoredHours = (hoursDecimal: number): string => {
        if (!hoursDecimal || hoursDecimal <= 0) return '0h 00m';
        const totalMinutes = Math.round(Number(hoursDecimal) * 60);
        return formatDuration(totalMinutes);
    };

    const handleEdit = (item: ExtraHourRecord) => {
        setEditingId(item.id);
        const isExternal = item.student_name.startsWith('👤 خارجي:');
        setFormData({
            student_name: isExternal ? 'EXTERNAL_CANDIDATE' : item.student_name,
            external_name: isExternal ? item.student_name.replace('👤 خارجي: ', '') : '',
            start_time: item.start_time.slice(0, 5),
            end_time: item.end_time.slice(0, 5),
            hourly_rate: String(item.hourly_rate) === '90' ? '90' : '100',
            log_date: item.log_date,
            notes: item.notes || ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const durationMinutes = getDurationInMinutes(formData.start_time, formData.end_time);

        if (durationMinutes <= 0) {
            alert('⚠️ وقت النهاية يجب أن يكون أكبر من وقت البداية');
            return;
        }

        if (!formData.student_name) {
            alert('⚠️ المرجو اختيار المترشح أو تحديد مترشح خارجي');
            return;
        }

        const totalHoursDecimal = Number((durationMinutes / 60).toFixed(4));
        const totalAmount = Math.round(totalHoursDecimal * (Number(formData.hourly_rate) || 0));
        const readableTime = formatDuration(durationMinutes);

        setLoading(true);

        try {
            const finalStudentName = formData.student_name === 'EXTERNAL_CANDIDATE' 
                ? `👤 خارجي: ${formData.external_name || 'بدون اسم'}`
                : formData.student_name;

            const payload: any = {
                student_name: finalStudentName,
                start_time: formData.start_time,
                end_time: formData.end_time,
                hourly_rate: Number(formData.hourly_rate),
                total_hours: totalHoursDecimal,
                total_amount: totalAmount,
                log_date: formData.log_date,
                notes: formData.notes,
                instructor_name: currentInstructor,
                agency_name: currentAgencyName,
                agence_id: currentAgenceId
            };

            if (editingId) {
                const { error } = await supabase.from('extra_hours').update(payload).eq('id', editingId);
                if (error) throw error;
                alert('✅ تم التعديل بنجاح');
            } else {
                payload.status = 'pending';
                const { error } = await supabase.from('extra_hours').insert([payload]);
                if (error) throw error;

                // 🔔 التنبيه للمانجر
                await supabase.from('notifications').insert([{
                    agence_id: currentAgenceId,
                    agency: currentAgencyName,
                    staff_name: currentInstructor,
                    message: `📝 ساعات إضافية نظري للمترشح: ${finalStudentName} (${readableTime} - ${totalAmount} DH)`,
                    type: 'EXTRA_HOURS',
                    category: 'extra_hours',
                    is_read: false
                }]);

                alert('✅ تم التسجيل بنجاح');
            }

            setEditingId(null);
            setFormData({
                student_name: '',
                external_name: '',
                start_time: '18:00',
                end_time: '19:00',
                hourly_rate: '100',
                log_date: new Date().toISOString().split('T')[0],
                notes: ''
            });

            fetchMyExtraHours();

        } catch (error: any) {
            alert('❌ خطأ في العملية: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا التسجيل؟")) return;
        try {
            const { error } = await supabase.from('extra_hours').delete().eq('id', id);
            if (error) throw error;
            setMyLogs(prev => prev.filter(item => item.id !== id));
            if (editingId === id) setEditingId(null);
        } catch (err: any) {
            alert("خطأ في الحذف: " + err.message);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 text-right font-medium" dir="rtl">
            
            {/* 📝 الفورم */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
                    <div className="w-10 h-10 bg-[#0F5A3E]/10 text-[#0F5A3E] rounded-xl flex items-center justify-center">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {editingId ? 'تعديل الساعات الإضافية (النظري)' : 'الساعات الإضافية (النظري)'}
                        </h2>
                        <p className="text-xs text-slate-400 font-normal">تسجيل حصص النظري الإضافية للمترشحين</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                            <User size={14} className="text-slate-400" /> اختيار المترشح
                        </label>
                        <select
                            value={formData.student_name}
                            onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-[#0F5A3E] focus:bg-white transition-all font-normal cursor-pointer"
                        >
                            <option value="">— اختر اسم المترشح —</option>
                            <option value="EXTERNAL_CANDIDATE" className="text-orange-600 font-bold">👤 مترشح خارجي (ساعات إضافية)</option>
                            <optgroup label="مترشحي المؤسسة">
                                {students.map(s => (
                                    <option key={s.id} value={`${s.first_name} ${s.last_name}`}>
                                        {s.first_name} {s.last_name}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {formData.student_name === 'EXTERNAL_CANDIDATE' && (
                        <div className="space-y-1.5 animate-in fade-in duration-300">
                            <label className="block text-xs font-semibold text-orange-600 flex items-center gap-1.5">
                                <User size={14} className="text-orange-500" /> اسم المترشح الخارجي
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.external_name}
                                onChange={(e) => setFormData({ ...formData, external_name: e.target.value })}
                                placeholder="اكتب اسم الشخص هنا..."
                                className="w-full bg-orange-50/40 border border-orange-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition-all font-normal"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                <Clock size={14} className="text-slate-400" /> البداية
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0F5A3E] focus:bg-white transition-all cursor-pointer font-normal"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                <Clock size={14} className="text-slate-400" /> النهاية
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0F5A3E] focus:bg-white transition-all cursor-pointer font-normal"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                <Coins size={14} className="text-slate-400" /> ثمن الساعة
                            </label>
                            <select
                                value={formData.hourly_rate}
                                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0F5A3E] focus:bg-white transition-all font-normal cursor-pointer"
                            >
                                <option value="90">90 DH</option>
                                <option value="100">100 DH</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" /> التاريخ
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.log_date}
                            onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-[#0F5A3E] focus:bg-white transition-all cursor-pointer font-normal"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-[#0F5A3E] hover:bg-[#0c4630] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus size={16} />
                                <span>{editingId ? 'تحديث الساعات الإضافية' : 'حفظ الساعات الإضافية'}</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* 📊 الجدول */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-1">
                    <h3 className="text-sm font-bold text-slate-800">سجل الساعات الإضافية المسجلة (النظري)</h3>
                    <span className="text-xs text-slate-400 font-normal">عدد الحصص: {myLogs.length}</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 text-xs font-medium">
                                <th className="p-3">المترشح</th>
                                <th className="p-3">البداية</th>
                                <th className="p-3">النهاية</th>
                                <th className="p-3">المدة</th>
                                <th className="p-3">المبلغ</th>
                                <th className="p-3 text-center">الحالة</th>
                                <th className="p-3">التاريخ</th>
                                <th className="p-3 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {fetchingLogs ? (
                                <tr>
                                    <td colSpan={8} className="p-6 text-center text-slate-400 font-normal">جاري تحميل السجل...</td>
                                </tr>
                            ) : myLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-6 text-center text-slate-400 font-normal">لم تقم بتسجيل أي ساعات إضافية بعد</td>
                                </tr>
                            ) : (
                                myLogs.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="p-3 font-medium text-slate-800">{item.student_name}</td>
                                        <td className="p-3 text-slate-600 font-normal dir-ltr text-right">{item.start_time.slice(0, 5)}</td>
                                        <td className="p-3 text-slate-600 font-normal dir-ltr text-right">{item.end_time.slice(0, 5)}</td>
                                        <td className="p-3 font-semibold text-[#0F5A3E]">
                                            {displayStoredHours(item.total_hours)}
                                        </td>
                                        <td className="p-3 font-bold text-slate-900">
                                            {Math.round(Number(item.total_amount))} DH
                                        </td>
                                        
                                        {/* 🏷️ عمود الحالة للعرض فقط (بدون أي أزرار تفاعلية) */}
                                        <td className="p-3 text-center">
                                            {item.status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-full text-[10px] font-bold select-none">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    تم الدفع ✅
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full text-[10px] font-bold select-none">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                    غير مدفوعة ⏳
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-3 text-slate-400 font-normal">{item.log_date}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLog(item.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
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