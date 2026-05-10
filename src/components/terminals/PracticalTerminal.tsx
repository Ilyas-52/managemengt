'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Fuel, Car, TrendingUp, CheckCircle2, FileText, UserCircle } from 'lucide-react';

// Shared Components
import PracticalPlanning from '@/components/pratique/HamzaPlanning';
import PracticalPlanningModal from '@/components/pratique/HamzaPlanningModal';
import PracticalAttendance from '@/components/pratique/HamzaAttendance';
import PracticalLogistics from '@/components/pratique/HamzaLogistics';
import PracticalFinancials from '@/components/pratique/HamzaFinancials';
import PracticalResults from '@/components/pratique/HamzaResults';

import { Student, ScheduleData, AttendanceRecord, CashRecord, ExamResult, VehicleLog } from '@/types/dashboard';

interface PracticalTerminalProps {
    instructorName: string;
    agenceId: string;
    agenceName: string;
    selectedAgency?: any;

}
//exports
export default function PracticalTerminal({ instructorName, agenceId, agenceName, selectedAgency: providedAgency }: PracticalTerminalProps) {
    const selectedAgency = providedAgency || { id: agenceId, name: agenceName };
    const [loading, setLoading] = useState(true);
    const [weekDate, setWeekDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('planning');

    // Data states
    const [students, setStudents] = useState<Student[]>([]);
    const [schedule, setSchedule] = useState<ScheduleData>({
        monday: { morning: [], evening: [] },
        tuesday: { morning: [], evening: [] },
        wednesday: { morning: [], evening: [] },
        thursday: { morning: [], evening: [] },
        friday: { morning: [], evening: [] }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState<{ day: string; type: string; index?: number } | null>(null);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [ledger, setLedger] = useState<CashRecord[]>([]);
    const [totalCash, setTotalCash] = useState<number>(0);
    const [previousBalance, setPreviousBalance] = useState<number>(0);
    const [vehicleLog, setVehicleLog] = useState<Partial<VehicleLog>>({ mileage_start: 0, mileage_end: 0, fuel_expense: 0 });
    const [newEntry, setNewEntry] = useState({ type: 'recette', category: 'transport_exam', amount: 0, student_name: '', external_name: '' });
    const [examResults, setExamResults] = useState<ExamResult[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);

    const getMonday = (d: string): Date => {
        const [year, month, day] = d.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dow = date.getDay(); // 0 للأحد، 6 للسبت

        // 🚀 المسمار المعدل: الأحد بوحدو اللي كيزيد سيمانة لـ القدام
        if (dow === 0) {
            // إيلا كان الأحد، كنزيدو نهار باش نمشيو للاثنين ديال السيمانة الجديدة
            date.setDate(date.getDate() + 1);
        } else {
            // إيلا كان السبت (6) أو أي يوم آخر، كنرجعو للاثنين ديال هاد السيمانة
            // اللوجيك: نهار السبت غايعطيك الاثنين اللي فات (نفس السيمانة)
            const diff = date.getDate() - dow + 1;
            date.setDate(diff);
        }

        return date;
    };

    const getMondayString = (d: string): string => {
        const date = getMonday(d);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        const savedTab = localStorage.getItem(`${instructorName}_tab`);
        if (savedTab) setActiveTab(savedTab);
    }, [instructorName]);

    const initData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const mondayStr = getMondayString(weekDate);
            const [stRes, attRes, logRes, ledgRes, examRes, vehRes] = await Promise.all([
                supabase.from('students').select('*').eq('agence_id', agenceId).order('created_at', { ascending: false }),
                supabase.from('lesson_attendance').select('*').eq('agence_id', agenceId).eq('instructor_name', instructorName),
                supabase.from('vehicle_logs').select('*').eq('staff_name', instructorName).eq('agence_id', agenceId).eq('week_start_date', mondayStr).maybeSingle(),

                // 💰 المسمار 1: حيدنا الفلتر ديال week_start_date باش نجيبو كاع الداتا ديال الصندوق
                supabase.from('petty_cash_ledger')
                    .select('*')
                    .eq('staff_name', instructorName)
                    .eq('agence_id', agenceId)
                    .order('created_at', { ascending: false }),

                supabase.from('exam_results').select('*').eq('agence_id', agenceId).eq('staff_name', instructorName),
                supabase.from('vehicles').select('*').eq('agence_id', agenceId).order('created_at', { ascending: false }),
            ]);

            setStudents(stRes.data || []);
            setAttendanceData(attRes.data || []);
            setVehicles(vehRes.data || []);
            setVehicleLog(logRes.data || { mileage_start: 0, mileage_end: 0, fuel_expense: 0 });
            setExamResults(examRes.data || []);

            // 💰 المسمار 2: معالجة بيانات الصندوق (الرصيد التراكمي + العرض الأسبوعي)
            if (ledgRes.data) {
                const allEntries = ledgRes.data;

                // 1. حساب الرصيد التراكمي (كاع السيمانات)
                const cumulativeBalance = allEntries.reduce((acc, entry) => {
                    return entry.type === 'recette' ? acc + entry.amount : acc - entry.amount;
                }, 0);

                // هاد الـ cumulativeBalance هو اللي خاصك تعرضو فـ التليفون الفوق كـ "رصيد الصندوق"
                setTotalCash(cumulativeBalance);

                // 2. حساب الرصيد السابق (كاع العمليات اللي قبل من هاد السيمانة)
                const prevBal = allEntries
                    .filter(e => e.week_start_date && e.week_start_date < mondayStr)
                    .reduce((acc, entry) => entry.type === 'recette' ? acc + entry.amount : acc - entry.amount, 0);
                setPreviousBalance(prevBal);

                // 3. فلترة العمليات باش يبانو فـ الجدول غير ديال هاد السيمانة
                const currentWeekEntries = allEntries.filter(e => e.week_start_date === mondayStr);
                setLedger(currentWeekEntries);
            } else {
                setLedger([]);
                setTotalCash(0);
                setPreviousBalance(0);
            }

            // 3. جلب الجدول الزمني (النسخة القارة Master Template)
            const { data: schData } = await supabase
                .from('weekly_schedules')
                .select('*')
                .eq('instructor_name', instructorName)
                .eq('agence_id', agenceId)
                .eq('week_start_date', '2000-01-01')
                .maybeSingle();

            if (schData && (schData as any).schedule_data) {
                setSchedule((schData as any).schedule_data);
                setIsEditing(false);
            } else {
                // 🚀 مسمار الانتقال: إيلا مالقيناش النسخة القارة، كنجيبو آخر نسخة تسجلات كيفما كان تاريخها
                const { data: lastSch } = await supabase
                    .from('weekly_schedules')
                    .select('*')
                    .eq('instructor_name', instructorName)
                    .eq('agence_id', agenceId)
                    .order('week_start_date', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (lastSch && (lastSch as any).schedule_data) {
                    setSchedule((lastSch as any).schedule_data);
                } else {
                    setSchedule({
                        monday: { morning: [], evening: [] },
                        tuesday: { morning: [], evening: [] },
                        wednesday: { morning: [], evening: [] },
                        thursday: { morning: [], evening: [] },
                        friday: { morning: [], evening: [] },
                        saturday: { morning: [], evening: [] }
                    });
                }
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [weekDate, agenceId, instructorName]);

    useEffect(() => {
        initData();
    }, [weekDate, initData]);

    const toggleLesson = async (studentId: string, studentName: string, lessonNum: number, currentStatus: boolean) => {
        if (currentStatus) {
            alert("⚠️ هاد الحصة مسجلة مسبقاً، ميمكنش تبدلها.");
            return;
        }

        if (lessonNum > 1) {
            const record = attendanceData.find(a => a.student_id === studentId);
            const prevLessonNum = lessonNum - 1;
            let isPrevDone = false;
            if (prevLessonNum <= 12) {
                isPrevDone = !!record?.[`s${prevLessonNum}`];
            } else {
                isPrevDone = Array.isArray(record?.extra_lessons) && record.extra_lessons.includes(prevLessonNum);
            }
            if (!isPrevDone) {
                alert(` يجب تسجيل الحصة التي قبلها اولا`);
                return;
            }
        }

        setLoading(true);
        const newStatusDate = new Date().toISOString();
        const isExtra = lessonNum > 12;

        setAttendanceData(prev => {
            const record = prev.find(a => a.student_id === studentId);
            if (record) {
                return prev.map(a => {
                    if (a.student_id === studentId) {
                        if (isExtra) {
                            const oldExtras = Array.isArray(a.extra_lessons) ? a.extra_lessons : [];
                            return { ...a, extra_lessons: [...oldExtras, lessonNum] };
                        } else {
                            return { ...a, [`s${lessonNum}`]: newStatusDate };
                        }
                    }
                    return a;
                });
            }
            return [...prev, {
                id: `temp-${Date.now()}`,
                student_id: studentId,
                student_name: studentName,
                ...(isExtra ? { extra_lessons: [lessonNum] } : { [`s${lessonNum}`]: newStatusDate }),
                agence_id: agenceId,
                instructor_name: instructorName,
                lesson_date: newStatusDate
            } as AttendanceRecord];
        });

        try {
            let updateData: any = {
                student_id: studentId,
                student_name: studentName,
                agence_id: agenceId,
                agency: agenceName,
                instructor_name: instructorName,
                updated_at: newStatusDate
            };

            if (isExtra) {
                const { data: currentRecord } = await supabase
                    .from('lesson_attendance')
                    .select('extra_lessons')
                    .eq('student_id', studentId)
                    .maybeSingle();
                const currentExtras = Array.isArray(currentRecord?.extra_lessons) ? currentRecord.extra_lessons : [];
                updateData.extra_lessons = [...currentExtras, lessonNum];
            } else {
                updateData[`s${lessonNum}`] = newStatusDate;
            }

            const { error } = await supabase.from('lesson_attendance').upsert(updateData, { onConflict: 'student_id' });
            if (error) throw error;

            await supabase.from('notifications').insert([{
                agence_id: agenceId,
                agency: agenceName,
                staff_name: instructorName,
                message: `المدرب ${instructorName} سجل الحصة رقم ${lessonNum} للمرشح: ${studentName}`,
                type: 'ATTENDANCE_MARK',
                category: 'attendance',
                is_read: false
            }]);

        } catch (err: any) {
            console.error("❌ مشكل فـ التتبع:", err.message);
            initData(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchedule = async () => {
        setLoading(true);
        // 🚀 مسمار النسخة القارة: ديما كنسجلو فـ التاريخ 2000-01-01
        const masterDate = '2000-01-01';
        try {
            const { data: existingPlan } = await supabase.from('weekly_schedules')
                .select('id')
                .eq('instructor_name', instructorName)
                .eq('agence_id', agenceId)
                .eq('week_start_date', masterDate)
                .maybeSingle();

            const { error: scheduleError } = await supabase.from('weekly_schedules').upsert({
                instructor_name: instructorName,
                week_start_date: masterDate,
                schedule_data: schedule,
                agence_id: agenceId,
                agency: agenceName
            }, { onConflict: 'instructor_name,week_start_date' });

            if (scheduleError) throw scheduleError;

            // 🚀 مسمار التنبيهات: حيدنا التاريخ باش تبان بلي التعديل عام
            const notifMsg = `📝 قام المدرب ${instructorName} بتعديل برنامج العمل`;

            await supabase.from('notifications').insert([{
                agence_id: agenceId,
                agency: agenceName,
                staff_name: instructorName,
                message: notifMsg,
                type: 'PLANNING_UPDATE',
                category: 'planning',
                is_read: false,
                created_at: new Date().toISOString()
            }]);

            alert("✅ تم ارسال البرنامج الى مدير المؤسسة");
            setIsEditing(false);
            initData(false);
        } catch (err: any) {
            console.error("❌ مشكل فـ العملية:", err.message);
            alert("وقع مشكل: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSmartReset = async () => {
        if (confirm("هل انت متأكد!؟ سيتم حذف البرنامج نهائياً من قاعدة البيانات")) {
            setLoading(true);
            const masterDate = '2000-01-01';
            const { error: deleteError } = await supabase.from('weekly_schedules')
                .delete()
                .eq('instructor_name', instructorName)
                .eq('week_start_date', masterDate)
                .eq('agence_id', agenceId);

            if (!deleteError) {
                await supabase.from('notifications').insert([{
                    agence_id: agenceId,
                    agency: agenceName,
                    staff_name: instructorName,
                    message: `🗑️ قام المدرب ${instructorName} بمسح برنامج العمل`,
                    type: 'PLANNING_DELETE',
                    category: 'planning',
                    is_read: false,
                    created_at: new Date().toISOString()
                }]);
                setSchedule({
                    monday: { morning: [], evening: [] },
                    tuesday: { morning: [], evening: [] },
                    wednesday: { morning: [], evening: [] },
                    thursday: { morning: [], evening: [] },
                    friday: { morning: [], evening: [] }
                });
                setIsEditing(true);
                alert("🗑️ تم المسح بنجاح وإبلاغ الإدارة");
            } else {
                alert("وقع مشكل فـ المسح: " + deleteError.message);
            }
            setLoading(false);
        }
    };

    const saveVehicleLog = async () => {
        setLoading(true);
        const mondayDate = getMondayString(weekDate);
        try {
            const { error } = await supabase.from('vehicle_logs').upsert({
                staff_name: instructorName,
                week_start_date: mondayDate,
                mileage_start: Number(vehicleLog.mileage_start),
                mileage_end: Number(vehicleLog.mileage_end),
                fuel_expense: Number(vehicleLog.fuel_expense),
                agence_id: agenceId,
                agency: agenceName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'staff_name,week_start_date' });

            if (error) throw error;

            if (Number(vehicleLog.mileage_start) > 0 && Number(vehicleLog.mileage_end) === 0) {
                await supabase.from('notifications').insert([{
                    agence_id: agenceId,
                    agency: agenceName,
                    staff_name: instructorName,
                    message: `المدرب ${instructorName} سجل كيلومتراج بداية الأسبوع: ${vehicleLog.mileage_start} KM`,
                    type: 'VEHICLE_START',
                    category: 'vehicle',
                    is_read: false
                }]);
            }
            if (Number(vehicleLog.mileage_end) > 0) {
                await supabase.from('notifications').insert([{
                    agence_id: agenceId,
                    agency: agenceName,
                    staff_name: instructorName,
                    message: `نهاية الأسبوع: ${instructorName} سجل كيلومتراج النهاية ${vehicleLog.mileage_end} KM ومصاريف المازوط: ${vehicleLog.fuel_expense} DH`,
                    type: 'VEHICLE_END',
                    category: 'vehicle',
                    is_read: false
                }]);
            }
            alert("⛽ تم ارسال بيانات السيارة لمدير المؤسسة");
        } catch (err: any) {
            alert("وقع مشكل فـ الحفظ: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const addLedgerEntry = async () => {
        if (newEntry.amount <= 0) return alert("المرجو ادخال جميع المعلومات");
        setLoading(true);
        try {
            let studentId = null;
            let finalStudentName = newEntry.student_name;
            if (newEntry.type === 'recette' && newEntry.student_name) {
                if (newEntry.student_name === 'EXTERNAL_CANDIDATE') {
                    studentId = null;
                    finalStudentName = `👤 خارجي: ${newEntry.external_name || 'بدون اسم'}`;
                } else {
                    const foundStudent = students.find(s => `${s.first_name} ${s.last_name}` === newEntry.student_name);
                    studentId = foundStudent?.id || null;
                }
            }
            const { error } = await supabase.from('petty_cash_ledger').insert({
                ...newEntry,
                student_name: finalStudentName,
                student_id: studentId,
                external_name: newEntry.student_name === 'EXTERNAL_CANDIDATE' ? newEntry.external_name : null,
                week_start_date: getMondayString(weekDate),
                staff_name: instructorName,
                agence_id: agenceId,
                agency: agenceName,
                created_at: new Date().toISOString()
            });
            if (error) throw error;

            const isRecette = newEntry.type === 'recette';
            const icon = isRecette ? '💰' : '💸';
            const typeLabel = isRecette ? 'مدخول جديد' : 'مصروف جديد';
            let finalDetailMsg = "";
            if (isRecette) {
                if (newEntry.student_name === 'EXTERNAL_CANDIDATE') {
                    finalDetailMsg = `من عند مترشح خارجي: ${newEntry.external_name || 'بدون اسم'}`;
                } else if (newEntry.student_name) {
                    finalDetailMsg = `من عند المرشح: ${newEntry.student_name}`;
                } else {
                    finalDetailMsg = `(مدخول عام)`;
                }
            } else {
                const catLabels: Record<string, string> = { transport_exam: 'نقل الامتحان', heures_supp: 'ساعات إضافية', fuel: 'بنزين', wash: 'غسيل السيارة', repair: 'إصلاح / صيانة' };
                finalDetailMsg = `(الفئة: ${catLabels[newEntry.category] || newEntry.category})`;
            }

            await supabase.from('notifications').insert([{
                agence_id: agenceId,
                agency: agenceName,
                staff_name: instructorName,
                message: `${typeLabel} ${icon}: ${instructorName} سجل مبلغ ${newEntry.amount} DH ${finalDetailMsg}`,
                type: isRecette ? 'CASH_IN' : 'CASH_OUT',
                category: 'financial',
                is_read: false
            }]);

            await initData(false);
            setNewEntry({ type: 'recette', category: 'transport_exam', amount: 0, student_name: '', external_name: '' });
            alert("💰 تم تسجيل العملية و ارسالها لرئيس المؤسسة");
        } catch (err: any) {
            alert("وقع مشكل فـ التسجيل: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateResult = async (studentId: string, studentName: string, field: string, value: any) => {
        setLoading(true);
        try {
            // 1️⃣ إعداد البيانات الأساسية (بدون exam_date باش ما يوقعش Error)
            let dataToSave: any = {
                student_id: studentId,
                student_name: studentName,
                agence_id: agenceId,
                staff_name: instructorName,
                updated_at: new Date().toISOString()
            };

            // 2️⃣ دمج التعديلات الجديدة
            if (field === 'bulk_update') {
                dataToSave = { ...dataToSave, ...value };
                // 🚀 المسمار اللخر: مسح أي تاريخ تسرب فـ الـ value باش الداتابيز تبقى ناضية
                delete dataToSave.exam_date;
            } else {
                dataToSave[field] = value;
            }

            // 3️⃣ الحفظ فـ Supabase (Upsert)
            const { error: upsertError } = await supabase
                .from('exam_results')
                .upsert(dataToSave, { onConflict: 'student_id' });

            if (upsertError) throw upsertError;

            // 4️⃣ لوجيك الإشعارات (Notifications)
            if (field === 'bulk_update') {
                const notifs = [];
                const checkList = [
                    { key: 'theory_result', name: 'الكود (1)' },
                    { key: 'theory_result_2', name: 'الكود (2)' },
                    { key: 'practical_result', name: 'التطبيقي (1)' },
                    { key: 'practical_result_2', name: 'التطبيقي (2)' },
                ];

                for (const item of checkList) {
                    const res = value[item.key];
                    if (res === 'admis') {
                        notifs.push({
                            message: `🎉 المرشح ${studentName} نجح فـ ${item.name}!`,
                            type: 'EXAM_SUCCESS'
                        });
                    } else if (res === 'echoue') {
                        notifs.push({
                            message: `❌ المرشح ${studentName} سقط فـ ${item.name}.`,
                            type: 'EXAM_FAILED'
                        });
                    }
                }

                if (notifs.length > 0) {
                    await supabase.from('notifications').insert(notifs.map(n => ({
                        agence_id: agenceId,
                        agency: agenceName,
                        staff_name: instructorName,
                        message: n.message,
                        type: n.type,
                        category: 'exams',
                        is_read: false
                    })));
                }
            }

            // 5️⃣ تحديث البيانات فـ الواجهة
            await initData(false);

        } catch (err: any) {
            // إظهار الخطأ بـ التفصيل فـ الكونسول باش نعرفو شنو كاين
            console.error("❌ Error Updating Result:", err.message);
            alert("وقع مشكل فـ الحفظ: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const addOrUpdateStudent = (name: string) => {
        if (showModal) {
            const { day, type, index } = showModal;
            const newItems = [...(schedule[day][type] || [])];
            if (index !== undefined) newItems[index] = name; else newItems.push(name);
            setSchedule({ ...schedule, [day]: { ...schedule[day], [type]: newItems } });
            setShowModal(null);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#F8FAFB] p-2 sm:p-8 lg:p-12 font-black italic uppercase tracking-tighter" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">
                <div className="bg-white border-2 border-slate-100 p-4 sm:p-8 rounded-[25px] sm:rounded-[40px] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="p-3 sm:p-4 bg-emerald-50 rounded-2xl sm:rounded-3xl border-2 border-emerald-100 text-emerald-600">
                            <UserCircle size={24} className="sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-none">الشق التطبيقي</h1>
                            <span className="text-[10px] sm:text-xs font-black text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full inline-block mt-1 uppercase italic">
                                وكالة: {agenceName} | المدرب: {instructorName}
                            </span>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto flex items-center gap-3 px-4 py-2.5 border-2 border-slate-900 rounded-2xl transition-all bg-white">
                        <Calendar size={18} className="text-emerald-500 shrink-0" />
                        <input
                            type="date"
                            value={weekDate}
                            onChange={(e) => setWeekDate(e.target.value)}
                            className="bg-transparent text-slate-900 font-black outline-none text-sm sm:text-lg cursor-pointer flex-1 text-right"
                            style={{ direction: 'ltr', textAlign: 'right' }}
                        />
                    </div>
                </div>

                <div className="flex w-full overflow-x-auto bg-slate-100/50 p-2 sm:p-3 rounded-2xl sm:rounded-[2.5rem] border-2 border-slate-100 gap-2 sm:gap-3 no-scrollbar scroll-smooth">
                    {[
                        { id: 'planning', label: 'البرنامج', icon: Calendar },
                        { id: 'attendance', label: 'التتبع', icon: CheckCircle2 },
                        { id: 'vehicle', label: 'السيارة', icon: Fuel },
                        { id: 'financial', label: 'الصندوق', icon: TrendingUp },
                        { id: 'results', label: 'الامتحانات', icon: FileText },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); localStorage.setItem(`${instructorName}_tab`, tab.id); }}
                            className={`px-5 py-3.5 sm:px-8 sm:py-5 rounded-xl sm:rounded-[2rem] text-[11px] sm:text-[13px] font-black flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-md border-2 border-slate-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-emerald-500' : ''} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="w-full relative min-h-[400px]">
                    <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'planning' && <PracticalPlanning schedule={schedule} setSchedule={setSchedule} isEditing={isEditing} setIsEditing={setIsEditing} handleSave={handleSaveSchedule} handleSmartReset={handleSmartReset} setShowModal={setShowModal} loading={loading} />}
                        {activeTab === 'attendance' && <PracticalAttendance students={students} attendanceData={attendanceData} toggleLesson={toggleLesson} />}
                        {activeTab === 'vehicle' && <PracticalLogistics vehicleLog={vehicleLog} setVehicleLog={setVehicleLog} saveVehicleLog={saveVehicleLog} loading={loading} />}
                        {activeTab === 'financial' && <PracticalFinancials ledger={ledger} totalBalance={totalCash} previousBalance={previousBalance} newEntry={newEntry} setNewEntry={setNewEntry} addLedgerEntry={addLedgerEntry} loading={loading} students={students} />}
                        {activeTab === 'results' && (
                            <PracticalResults
                                students={students}
                                examResults={examResults}
                                updateResult={updateResult}
                                selectedAgency={selectedAgency}
                            />
                        )}                    </div>
                </div>

                <PracticalPlanningModal showModal={showModal} setShowModal={setShowModal} students={students} addOrUpdateStudent={addOrUpdateStudent} />
            </div>
            <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
}
