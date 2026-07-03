'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Car, Timer, Plus, Save, FileText,
    Trash2, Gauge, Loader2, CalendarDays, Edit3
} from 'lucide-react';
import { generateGprsPrint } from './PrintGprsReport';

import { Agency } from '@/types/dashboard';

interface Props {
    weekDate: string;
    selectedAgency?: Agency | null;
}

export default function ManagerGPRS({ weekDate, selectedAgency }: Props) {
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(weekDate || new Date().toISOString().split('T')[0]);
    const [selectedVehicle, setSelectedVehicle] = useState('Dacia Sandero');
    const [history, setHistory] = useState<any[]>([]);

    // 🔒 ساروت التحكم: كيشد الـ ID د الحصة لي مأذون ليها تتعدل دابا
    const [editingSessionId, setEditingSessionId] = useState<any>(null);

    const getMonday = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    };

    // الهيكلة ديال الحصص
    const [sessions, setSessions] = useState<{ morning: any[]; afternoon: any[] }>({
        morning: [{ id: Date.now(), in: '', out: '', type: 'hlabba', saved: false }],
        afternoon: [{ id: Date.now() + 1, in: '', out: '', type: 'dora', saved: false }]
    });

    // حساب المجاميع اليومية
    const totals = useMemo(() => {
        const morningMins = history.filter(h => h.period === 'morning').reduce((acc, curr) => acc + curr.duration_minutes, 0);
        const afternoonMins = history.filter(h => h.period === 'afternoon').reduce((acc, curr) => acc + curr.duration_minutes, 0);
        return {
            morning: morningMins,
            afternoon: afternoonMins,
            grandTotal: morningMins + afternoonMins
        };
    }, [history]);

    const formatTime = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}س ${m}د`;
    };

    // جلب البيانات
    const fetchDailyLogs = async () => {
        if (!selectedDate) return;
        const { data, error } = await supabase
            .from('vehicle_activity_logs')
            .select('*')
            .eq('log_date', selectedDate)
            .eq('vehicle_id', selectedVehicle)
            .eq('agence_id', selectedAgency?.id)
            .order('entry_time', { ascending: true });

        if (!error && data) {
            setHistory(data);
            const morningLogs = data.filter(d => d.period === 'morning').map(d => ({
                id: d.id, in: d.entry_time.slice(0, 5), out: d.exit_time.slice(0, 5), type: d.activity_type, saved: true
            }));
            const afternoonLogs = data.filter(d => d.period === 'afternoon').map(d => ({
                id: d.id, in: d.entry_time.slice(0, 5), out: d.exit_time.slice(0, 5), type: d.activity_type, saved: true
            }));

            setSessions({
                morning: morningLogs.length > 0 ? morningLogs : [{ id: Date.now(), in: '', out: '', type: 'hlabba', saved: false }],
                afternoon: afternoonLogs.length > 0 ? afternoonLogs : [{ id: Date.now() + 1, in: '', out: '', type: 'dora', saved: false }]
            });
            setEditingSessionId(null); // ريستارت للقفل عند تبديل التاريخ
        }
    };

    useEffect(() => {
        fetchDailyLogs();
    }, [selectedDate, selectedVehicle]);

    useEffect(() => {
        if (weekDate) setSelectedDate(weekDate);
    }, [weekDate]);

    const addSession = (period: 'morning' | 'afternoon') => {
        if (sessions[period].length < 6) {
            setSessions(prev => ({
                ...prev,
                [period]: [...prev[period], { id: Date.now(), in: '', out: '', type: 'hlabba', saved: false }]
            }));
        }
    };

    const removeSession = async (id: any, isSaved: boolean) => {
        if (isSaved) {
            const confirmDelete = window.confirm("🚨 واش بصح باغي تمسح هاد الحصة نهائياً من السيستم؟");
            if (!confirmDelete) return;
            try {
                setLoading(true);
                const { error } = await supabase.from('vehicle_activity_logs').delete().eq('id', id);
                if (error) throw error;
                alert("🗑️ تم الحذف بنجاح!");
                fetchDailyLogs();
            } catch (err: any) {
                alert("❌ خطأ أثناء الحذف: " + err.message);
            } finally {
                setLoading(false);
            }
        } else {
            setSessions(prev => ({
                morning: prev.morning.filter(s => s.id !== id),
                afternoon: prev.afternoon.filter(s => s.id !== id)
            }));
        }
    };

    const calculateDuration = (inTime: string, outTime: string) => {
        if (!inTime || !outTime) return 0;
        const [h1, m1] = inTime.split(':').map(Number);
        const [h2, m2] = outTime.split(':').map(Number);
        const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        return totalMinutes > 0 ? totalMinutes : 0;
    };

    // التحديث المحلي ف الواجهة
    const handleSessionUpdate = (period: 'morning' | 'afternoon', id: any, field: string, val: string) => {
        const newS = sessions[period].map(s => s.id === id ? { ...s, [field]: val } : s);
        setSessions(prev => ({ ...prev, [period]: newS }));

        setHistory(prevHistory => prevHistory.map(h => {
            if (h.id === id) {
                const updatedLog = { ...h };
                if (field === 'in') updatedLog.entry_time = val;
                if (field === 'out') updatedLog.exit_time = val;
                if (field === 'type') updatedLog.activity_type = val;
                updatedLog.duration_minutes = calculateDuration(
                    field === 'in' ? val : updatedLog.entry_time.slice(0, 5),
                    field === 'out' ? val : updatedLog.exit_time.slice(0, 5)
                );
                return updatedLog;
            }
            return h;
        }));
    };

    // 🚀 دالة الحفظ والتعديل القديم ف سوبابيز وإغلاق القفل فوراً
    const handleUpdateSavedSession = async (id: any, currentIn: string, currentOut: string, currentType: string) => {
        try {
            setLoading(true);
            const duration = calculateDuration(currentIn, currentOut);
            const { error } = await supabase
                .from('vehicle_activity_logs')
                .update({
                    entry_time: currentIn,
                    exit_time: currentOut,
                    activity_type: currentType,
                    duration_minutes: duration
                })
                .eq('id', id);

            if (error) throw error;
            alert("⚙️ تم تحديث بيانات الحصة وقفلها بنجاح!");
            setEditingSessionId(null); // 🔒 قفل الخانات أوتوماتيك مورا الحفظ!
            fetchDailyLogs();
        } catch (err: any) {
            alert("❌ خطأ أثناء التحديث: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const newSessions = [
                ...sessions.morning.map(s => ({ ...s, period: 'morning' })),
                ...sessions.afternoon.map(s => ({ ...s, period: 'afternoon' }))
            ].filter(s => s.in && s.out && !s.saved);

            if (newSessions.length === 0) {
                alert("⚠️ كولشي مسجل أولا الخانات خاويين!");
                return;
            }

            const logsToInsert = newSessions.map(s => ({
                vehicle_id: selectedVehicle,
                log_date: selectedDate,
                period: s.period,
                entry_time: s.in,
                exit_time: s.out,
                activity_type: s.type,
                duration_minutes: calculateDuration(s.in, s.out),
                agence_id: selectedAgency?.id
            }));

            const { error } = await supabase.from('vehicle_activity_logs').insert(logsToInsert);
            if (error) throw error;

            alert("✅ تـم الـتـسـجـيـل بـنـجـاح!");
            fetchDailyLogs();
        } catch (error: any) {
            alert("🚨 مـشكل: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        setLoading(true);
        const monday = getMonday(selectedDate);
        const sunday = new Date(new Date(monday).setDate(new Date(monday).getDate() + 6)).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('vehicle_activity_logs')
            .select('*')
            .eq('vehicle_id', selectedVehicle)
            .eq('agence_id', selectedAgency?.id)
            .gte('log_date', monday)
            .lte('log_date', sunday)
            .order('log_date', { ascending: true })
            .order('entry_time', { ascending: true });

        if (!error && data && data.length > 0) {
            generateGprsPrint(data, monday, selectedVehicle, selectedAgency?.name || 'Boudinar');
        } else {
            alert("⚠️ السيمانة مازال خاوية، ما كاين ما يتطبع!");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 pb-20 text-right italic font-black uppercase" dir="rtl">

            {/* 🔝 معلومات التاريخ */}
            <div className="bg-slate-900 text-white p-4 rounded-[25px] flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                    <CalendarDays className="text-[#1dbf73]" size={20} />
                    <span className="text-[10px]">الاسبوع {getMonday(selectedDate)}</span>
                </div>
                <div className="text-[9px] opacity-50 italic tracking-widest">GPRS LOGS</div>
            </div>

            {/* ⚙️ التحكم */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-[35px] border-2 border-slate-900 shadow-sm">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase pr-2 text-slate-400">تاريخ العملية</label>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-black text-sm outline-none focus:border-slate-900 transition-all" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase pr-2 text-slate-400">السيارة</label>
                    <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}
                        className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-black text-sm outline-none">
                        <option>Dacia Sandero</option>
                        <option>Peugeot 208</option>
                        <option>Clio4</option>
                        <option>Opel Corsa</option>
                    </select>
                </div>
            </div>

            {/* 🌅 حصص الصباح والعشية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PeriodCard title="الفترة الصباحية" icon={<Timer size={20} />} sessions={sessions.morning} period="morning" onAdd={() => addSession('morning')} 
                    onRemove={(id: any, isSaved: boolean) => removeSession(id, isSaved)}
                    onUpdate={(id: any, field: string, val: string) => handleSessionUpdate('morning', id, field, val)} 
                    calculateDuration={calculateDuration} 
                    editingSessionId={editingSessionId} setEditingSessionId={setEditingSessionId} handleUpdateSavedSession={handleUpdateSavedSession} />

                <PeriodCard title="الفترة المسائية" icon={<Gauge size={20} />} sessions={sessions.afternoon} period="afternoon" onAdd={() => addSession('afternoon')} 
                    onRemove={(id: any, isSaved: boolean) => removeSession(id, isSaved)}
                    onUpdate={(id: any, field: string, val: string) => handleSessionUpdate('afternoon', id, field, val)} 
                    calculateDuration={calculateDuration} 
                    editingSessionId={editingSessionId} setEditingSessionId={setEditingSessionId} handleUpdateSavedSession={handleUpdateSavedSession} />
            </div>

            {/* بوطونة الحفظ الحصص الجديدة */}
            <button onClick={handleSave} disabled={loading}
                className="w-full h-20 bg-slate-900 text-white rounded-[30px] font-black flex items-center justify-center gap-4 hover:bg-[#1dbf73] transition-all shadow-2xl disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                تـسـجـيـل الـحـصـص الـجـديـدة
            </button>

            {/* 📊 حصيلة اليوم */}
            <div className="bg-white p-6 rounded-[35px] border-2 border-slate-900 shadow-sm space-y-6">
                <h3 className="font-black flex items-center gap-2 italic border-b pb-4">
                    <FileText size={18} className="text-slate-400" /> حصيلة اليوم ({selectedDate})
                </h3>

                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[8px] text-slate-400 font-black">الصباح</p>
                        <p className="text-xs font-black text-blue-600">{formatTime(totals.morning)}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[8px] text-slate-400 font-black">المساء</p>
                        <p className="text-xs font-black text-orange-600">{formatTime(totals.afternoon)}</p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-2xl text-center shadow-lg">
                        <p className="text-[8px] text-white/50 font-black">المجموع</p>
                        <p className="text-xs font-black text-white">{formatTime(totals.grandTotal)}</p>
                    </div>
                </div>

                <div className="overflow-x-auto pt-2">
                    <table className="w-full text-[11px] font-black italic">
                        <tbody className="divide-y divide-slate-50">
                            {history.map((log, idx) => {
                                const isRowEditable = editingSessionId === log.id;
                                return (
                                    <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${isRowEditable ? 'bg-amber-50/40' : ''}`}>
                                        <td className="py-3 text-slate-400 text-[9px]">حصّة {idx + 1}</td>
                                        <td className="py-3 text-center">
                                            <input type="time" disabled={!isRowEditable} value={log.entry_time.slice(0, 5)} 
                                                onChange={(e) => handleSessionUpdate(log.period, log.id, 'in', e.target.value)}
                                                className={`bg-transparent border-none font-black text-xs outline-none text-center ${isRowEditable ? 'text-amber-600 font-bold border-b border-amber-400' : 'text-slate-800'}`} />
                                            <span> - </span>
                                            <input type="time" disabled={!isRowEditable} value={log.exit_time.slice(0, 5)} 
                                                onChange={(e) => handleSessionUpdate(log.period, log.id, 'out', e.target.value)}
                                                className={`bg-transparent border-none font-black text-xs outline-none text-center ${isRowEditable ? 'text-amber-600 font-bold border-b border-amber-400' : 'text-slate-800'}`} />
                                        </td>
                                        <td className="py-3 text-center">
                                            <select disabled={!isRowEditable} value={log.activity_type} 
                                                onChange={(e) => handleSessionUpdate(log.period, log.id, 'type', e.target.value)}
                                                className="bg-transparent border-none font-black text-[10px] outline-none text-slate-700">
                                                <option value="hlabba">حلبة</option>
                                                <option value="dora">دورة</option>
                                            </select>
                                        </td>
                                        <td className="py-3 text-center text-slate-700">{formatTime(log.duration_minutes)}</td>
                                        
                                        {/* زر الأكشن من التابلو التحتاني */}
                                        <td className="py-3 text-left flex items-center justify-end gap-2 pl-2">
                                            {isRowEditable ? (
                                                <button onClick={() => handleUpdateSavedSession(log.id, log.entry_time.slice(0, 5), log.exit_time.slice(0, 5), log.activity_type)} 
                                                    className="text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-none cursor-pointer">
                                                    <Save size={14} />
                                                </button>
                                            ) : (
                                                <button onClick={() => setEditingSessionId(log.id)} 
                                                    className="text-amber-500 hover:text-amber-700 transition-colors bg-transparent border-none cursor-pointer">
                                                    <Edit3 size={14} />
                                                </button>
                                            )}
                                            <button onClick={() => removeSession(log.id, true)} 
                                                className="text-rose-500 hover:text-rose-700 transition-colors bg-transparent border-none cursor-pointer">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-300 text-[10px]">-- لا توجد بيانات مسجلة لهذا التاريخ --</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <button onClick={handlePrint} disabled={loading}
                className="w-full h-16 bg-[#0f5a3e] text-white rounded-[25px] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg mt-4 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
                تـحـمـيـل تـقـريـر الاسبوع(PDF)
            </button>
        </div>
    );
}

interface PeriodCardProps {
    title: string;
    icon: React.ReactNode;
    sessions: any[];
    period: 'morning' | 'afternoon';
    onAdd: () => void;
    onRemove: (id: number | string, isSaved: boolean) => void;
    onUpdate: (id: number | string, field: string, val: string) => void;
    calculateDuration: (inTime: string, outTime: string) => number;
    editingSessionId: any;
    setEditingSessionId: (id: any) => void;
    handleUpdateSavedSession: (id: any, currentIn: string, currentOut: string, currentType: string) => Promise<void>;
}

function PeriodCard({ title, icon, sessions, period, onAdd, onRemove, onUpdate, calculateDuration, editingSessionId, setEditingSessionId, handleUpdateSavedSession }: PeriodCardProps) {
    return (
        <div className="bg-white p-6 rounded-[35px] border-2 border-slate-100 space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3 font-black text-slate-800 italic">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center">{icon}</div>
                    <h3>{title}</h3>
                </div>
                <button onClick={onAdd} className="bg-slate-100 p-2 rounded-xl hover:bg-slate-200 transition-all shadow-sm border-none cursor-pointer"><Plus size={20} /></button>
            </div>
            {sessions.map((s: any, idx: number) => {
                // الخانة مسموح نعدلوها غي إيلا كانت عاد كتكتب أولا بركنا على زر التعديل ديالها بـ الـ ID
                const isCurrentlyEditable = !s.saved || editingSessionId === s.id;
                
                return (
                    <div key={s.id} className={`relative p-5 rounded-[25px] border space-y-4 transition-all ${s.saved && editingSessionId !== s.id ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-900 italic">الـدخول {idx + 1}</span>
                            
                            <div className="flex items-center gap-2">
                                {/* بوطون التعديل والحفظ الذكي حسب حالة القفل الصارم */}
                                {s.saved && (
                                    editingSessionId === s.id ? (
                                        <button 
                                            type="button"
                                            onClick={() => handleUpdateSavedSession(s.id, s.in, s.out, s.type)}
                                            className="bg-emerald-500 text-white p-1 rounded-md hover:bg-emerald-600 transition-colors border-none cursor-pointer"
                                            title="حفظ التعديل"
                                        >
                                            <Save size={12} />
                                        </button>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={() => setEditingSessionId(s.id)}
                                            className="bg-amber-500 text-white p-1 rounded-md hover:bg-amber-600 transition-colors border-none cursor-pointer"
                                            title="تعديل الحصة"
                                        >
                                            <Edit3 size={12} />
                                        </button>
                                    )
                                )}

                                {/* بوطون الحذف */}
                                <button onClick={() => onRemove(s.id, s.saved)} className="text-rose-500 hover:scale-110 transition-all bg-transparent border-none cursor-pointer">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 text-right">
                                <span className="text-[8px] font-black text-slate-400 italic">البدء</span>
                                <input type="time" disabled={!isCurrentlyEditable} value={s.in} onChange={(e) => onUpdate(s.id, 'in', e.target.value)} className="w-full h-10 bg-slate-50 rounded-xl border border-slate-100 px-2 font-black text-xs outline-none focus:border-slate-900 disabled:opacity-50" />
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-[8px] font-black text-slate-400 italic">الانتهاء</span>
                                <input type="time" disabled={!isCurrentlyEditable} value={s.out} onChange={(e) => onUpdate(s.id, 'out', e.target.value)} className="w-full h-10 bg-slate-50 rounded-xl border border-slate-100 px-2 font-black text-xs outline-none focus:border-slate-900 disabled:opacity-50" />
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <select disabled={!isCurrentlyEditable} value={s.type} onChange={(e) => onUpdate(s.id, 'type', e.target.value)} className="flex-1 h-10 bg-slate-50 border border-slate-100 rounded-xl px-2 font-black text-[10px] outline-none disabled:opacity-50">
                                <option value="hlabba">الحلابة (Parking)</option>
                                <option value="dora">الدورة (Circuit)</option>
                            </select>
                            <div className="bg-slate-900 text-white px-4 rounded-xl flex items-center font-black text-[10px] italic">
                                {formatDurationInternal(calculateDuration(s.in, s.out))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function formatDurationInternal(totalMinutes: number) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}س ${m}د`;
}