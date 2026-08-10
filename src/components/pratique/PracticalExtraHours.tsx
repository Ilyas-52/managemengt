'use client';
import { useState } from 'react';
import { Clock, Plus, User, Coins, Calendar, AlignRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types/dashboard';

interface Props {
    selectedAgency?: any;
    instructorName?: string;
    agenceId?: string;
    agenceName?: string;
    students?: Student[]; // 👈 استقبال قائمة تلاميذ الوكالة
}

export default function PracticalExtraHours({ selectedAgency, instructorName, agenceId, agenceName, students = [] }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        student_name: '',
        external_name: '',
        start_time: '18:00',
        end_time: '19:00',
        hourly_rate: '100',
        log_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const calculateHours = (start: string, end: string): number => {
        if (!start || !end) return 0;
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        const diffMins = endMins - startMins;
        return diffMins > 0 ? Number((diffMins / 60).toFixed(2)) : 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const totalHours = calculateHours(formData.start_time, formData.end_time);
        const totalAmount = totalHours * (Number(formData.hourly_rate) || 0);

        if (totalHours <= 0) {
            alert('⚠️ وقت النهاية يجب أن يكون أكبر من وقت البداية');
            return;
        }

        if (!formData.student_name) {
            alert('⚠️ المرجو اختيار المترشح أو تحديد مترشح خارجي');
            return;
        }

        setLoading(true);

        try {
            const currentAgencyName = agenceName || selectedAgency?.name || 'Boudinar';
            const currentAgenceId = agenceId || selectedAgency?.id || null;

            // تحديد الاسم النهائي للمترشح
            const finalStudentName = formData.student_name === 'EXTERNAL_CANDIDATE' 
                ? `👤 خارجي: ${formData.external_name || 'بدون اسم'}`
                : formData.student_name;

            // 📥 1. الحفظ فـ Supabase
            const { error } = await supabase.from('extra_hours').insert([{
                student_name: finalStudentName,
                start_time: formData.start_time,
                end_time: formData.end_time,
                hourly_rate: Number(formData.hourly_rate),
                total_hours: totalHours,
                total_amount: totalAmount,
                log_date: formData.log_date,
                notes: formData.notes,
                instructor_name: instructorName || 'المدرب',
                agency_name: currentAgencyName,
                agence_id: currentAgenceId,
                status: 'pending'
            }]);

            if (error) throw error;

            // 🔔 2. التنبيه للمانجر
            await supabase.from('notifications').insert([{
                agence_id: currentAgenceId,
                agency: currentAgencyName,
                staff_name: instructorName || 'التطبيقي',
                message: `⏰ تسجيل ساعات إضافية للمترشح: ${finalStudentName} (${totalHours} ساعة - ${totalAmount} DH)`,
                type: 'EXTRA_HOURS',
                category: 'extra_hours',
                is_read: false
            }]);

            alert('✅ تم تسجيل الساعات الإضافية بنجاح');

            // Reset
            setFormData({
                student_name: '',
                external_name: '',
                start_time: '18:00',
                end_time: '19:00',
                hourly_rate: '100',
                log_date: new Date().toISOString().split('T')[0],
                notes: ''
            });

        } catch (error: any) {
            alert('❌ خطأ في التسجيل: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm text-right font-medium" dir="rtl">
            
            {/* Header */}
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Clock size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">الساعات الإضافية</h2>
                    <p className="text-xs text-slate-400 font-normal">تسجيل حصص المترشحين الإضافية</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 🎯 1. اختيار اسم المترشح (نفس لوجيك الصندوق) */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" /> اختيار المترشح
                    </label>
                    <select
                        value={formData.student_name}
                        onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all font-normal cursor-pointer"
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

                {/* 🎯 2. خانة كتابة اسم المترشح الخارجي (تظهر فقط عند اختيار EXTERNAL_CANDIDATE) */}
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

                {/* التوقيت وثمن الساعة */}
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
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer font-normal"
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
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer font-normal"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                            <Coins size={14} className="text-slate-400" /> ثمن الساعة (DH)
                        </label>
                        <input
                            type="number"
                            required
                            value={formData.hourly_rate}
                            onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                            placeholder="100"
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all font-normal"
                        />
                    </div>
                </div>

                {/* التاريخ */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" /> التاريخ
                    </label>
                    <input
                        type="date"
                        required
                        value={formData.log_date}
                        onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer font-normal"
                    />
                </div>

                
                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Plus size={16} />
                            <span>حفظ الساعات الإضافية</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}