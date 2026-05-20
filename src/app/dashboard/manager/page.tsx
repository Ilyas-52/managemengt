'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import NotificationDropdown, { Notification } from '@/components/NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';
import ManagerGPRS from '@/components/manager/ManagerGPRS';
import ManagerTrucks from '@/components/manager/ManagerTrucks';
import { Search, ShieldCheck, Truck, Menu, X, Calendar, ClipboardCheck, Wallet, Car, GraduationCap, Coins, ChevronDown, Gauge, FileText } from 'lucide-react';

// استيراد الشقوف
import ManagerFinance from '@/components/manager/ManagerFinance';
import ManagerSuivi from '@/components/manager/ManagerSuivi';
import ManagerPlanning from '@/components/manager/ManagerPlanning';
import ManagerVehicle from '@/components/manager/ManagerVehicle';
import ManagerCash from '@/components/manager/ManagerCash';
import ManagerExams from '@/components/manager/ManagerExams';
import HolidaysTracker from '@/components/manager/HolidaysTracker';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { Agency, Student, ScheduleData, ExamResult, AttendanceRecord, CashRecord, VehicleLog } from '@/types/dashboard';

// ✅ المسمار الحقيقي: شحن الصفحة فقط فالمتصفح وبلا SSR
const GlobalReports = dynamic(() => import('@/components/manager/GlobalReports'), {
    ssr: false,
    loading: () => <div className="p-20 text-center font-black animate-pulse text-slate-300">جاري تحميل نظام الأرشيف...</div>
});

const getMonday = (date: string | Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 للأحد، 1 للاثنين ... 6 للسبت

    // 🚀 اللوجيك الجديد: السبت كيرجع لور، والأحد كيزيد لـ القدام
    if (day === 0) {
        // الأحد بوحدو اللي كيزيد نهار باش يبدأ سيمانة جديدة (الاثنين الجاي)
        d.setDate(d.getDate() + 1);
    } else {
        // السبت (6) ووسط السيمانة (1-5) كيرجعوا للاثنين ديال هاد السيمانة
        const diff = d.getDate() - day + 1;
        d.setDate(diff);
    }

    return d.toISOString().split('T')[0];
};

const days = [
    { id: 'monday', label: 'الاثنين' },
    { id: 'tuesday', label: 'الثلاثاء' },
    { id: 'wednesday', label: 'الأربعاء' },
    { id: 'thursday', label: 'الخميس' },
    { id: 'friday', label: 'الجمعة' },
    { id: 'saturday', label: 'السبت' }
];

export default function ManagerTerminal() {
    const [loading, setLoading] = useState(false);
    const [activeStaff, setActiveStaff] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState('emploi');
    const [isIntroLoading, setIsIntroLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showHamzaSub, setShowHamzaSub] = useState(false);
    const [activeNathariTab, setActiveNathariTab] = useState('auto');
    const [showNathariSub, setShowNathariSub] = useState(false);
    const [showExamsSubMenu, setShowExamsSubMenu] = useState(false); // 🚀 مسمار الامتحانات الجديد

    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [hamzaSchedule, setHamzaSchedule] = useState<ScheduleData | null>(null);
    const [examResults, setExamResults] = useState<ExamResult[]>([]);
    const [hamzaAttendance, setHamzaAttendance] = useState<AttendanceRecord[]>([]);
    const [hamzaLedger, setHamzaLedger] = useState<CashRecord[]>([]);
    const [previousBalance, setPreviousBalance] = useState<number>(0);
    const [hamzaLogistics, setHamzaLogistics] = useState<Partial<VehicleLog>>({ mileage_start: 0, mileage_end: 0, fuel_expense: 0 });
    const lastFetchedAgencyId = useRef<string | null>(null);

    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

    // ✅ مسمار 01: منطق المدرسين ديال التطبيقي (Pratique)
    const practicalInstructor = useMemo(() => {
        const agencyName = (selectedAgency?.name || '').toUpperCase();
        if (agencyName === 'KRONA') return 'Bilal';
        if (agencyName === 'AZGHAR') return 'Ismail';
        if (agencyName === 'TAZAGHINE') return 'Belkassmi';
        return 'Hamza'; // Default لـ Boudinar وأي وكالة أخرى
    }, [selectedAgency]);

    // ✅ مسمار 02: منطق المدرسين ديال النظري (Théorie)
    const theoreticalInstructor = useMemo(() => {
        const agencyName = (selectedAgency?.name || '').toUpperCase();
        if (agencyName === 'KRONA') return 'Mohammed';
        if (agencyName === 'AZGHAR') return 'Brahim';
        if (agencyName === 'TAZAGHINE') return 'Zakaria/Wafae'; // ركز فـ هاد السمية خاصها تكون مطابقة للي فـ الداتابيز
        return 'Youssef'; // Default لـ Boudinar
    }, [selectedAgency]);

    const { notifications, unreadCount, markAllAsRead, markSingleAsRead, deleteNotification } = useNotifications(selectedAgency?.name || 'Boudinar');

    const fetchData = async () => {
        if (!selectedAgency) return;
        try {
            setLoading(true);
            const mondayStr = getMonday(selectedDate);

            // 1️⃣ جلب التلاميذ - هادي ناضية
            const { data: st, error: stErr } = await supabase
                .from('students')
                .select('*')
                .eq('agence_id', selectedAgency.id)
                .order('created_at', { ascending: false });

            if (stErr) throw stErr;
            if (st) setStudents(st);

            // 🚀 مسمار التغيير: حيدنا شرط (activeStaff === practicalInstructor) 
            // باش الداتا تحمل بمجرد اختيار الوكالة

            // 2️⃣ جلب الجدول الزمني (النسخة القارة Master Template)
            // ✅ مسمار الذكاء: كنجيبو السكاجول غير إيلا تبدلات الوكالة نيشـان
            if (lastFetchedAgencyId.current !== selectedAgency.id) {
                const { data: sched } = await supabase
                    .from('weekly_schedules')
                    .select('*')
                    .eq('agence_id', selectedAgency.id)
                    .eq('week_start_date', '2000-01-01')
                    .maybeSingle();

                let finalSchedule = sched?.schedule_data || null;

                if (!finalSchedule) {
                    const { data: lastSch } = await supabase
                        .from('weekly_schedules')
                        .select('*')
                        .eq('agence_id', selectedAgency.id)
                        .order('week_start_date', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    finalSchedule = lastSch?.schedule_data || null;
                }
                setHamzaSchedule(finalSchedule);
                lastFetchedAgencyId.current = selectedAgency.id;
            }

            // 3️⃣ جلب نتائج الامتحانات - (حيدنا staff_name)
            const { data: res } = await supabase
                .from('exam_results')
                .select('*')
                .eq('agence_id', selectedAgency.id);

            // 4️⃣ جلب الحضور - (حيدنا instructor_name)
            const { data: att } = await supabase
                .from('lesson_attendance')
                .select('*')
                .eq('agence_id', selectedAgency.id);

            // 5️⃣ جلب مصاريف السيارة
            const { data: vLog } = await supabase
                .from('vehicle_logs')
                .select('*')
                .eq('agence_id', selectedAgency.id)
                .eq('week_start_date', mondayStr)
                .maybeSingle();

            // 6️⃣ جلب الكاش (Petty Cash) - (حيدنا staff_name)
            const { data: pCash } = await supabase
                .from('petty_cash_ledger')
                .select('*')
                .eq('agence_id', selectedAgency.id)
                .order('created_at', { ascending: false });

            // 7️⃣ تحديث الـ State (كولشي كيعمر دقة وحدة)
            if (pCash) {
                const currentWeekEntries = pCash.filter(e => e.week_start_date === mondayStr);
                setHamzaLedger(currentWeekEntries);

                // 🚀 المسمار: حساب الرصيد السابق
                const prevBal = pCash
                    .filter(e => e.week_start_date && e.week_start_date < mondayStr)
                    .reduce((acc, entry) => entry.type === 'recette' ? acc + entry.amount : acc - entry.amount, 0);
                setPreviousBalance(prevBal);

                const bal = pCash.reduce((acc: number, curr: CashRecord) =>
                    curr.type === 'recette' ? acc + curr.amount : acc - curr.amount, 0
                ) || 0;

                setHamzaLogistics({
                    balance: bal,
                    mileage_start: vLog?.mileage_start || 0,
                    mileage_end: vLog?.mileage_end || 0,
                    fuel_expense: vLog?.fuel_expense || 0
                });
            } else {
                setHamzaLedger([]);
                setPreviousBalance(0);
                setHamzaLogistics({
                    balance: 0,
                    mileage_start: vLog?.mileage_start || 0,
                    mileage_end: vLog?.mileage_end || 0,
                    fuel_expense: vLog?.fuel_expense || 0
                });
            }

            setExamResults(res || []);
            setHamzaAttendance(att || []);

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("❌ Error fetching:", error.message);
            }
        } finally {
            setLoading(false);
        }
    };
    // 1️⃣ المسمار الأول: جلب الوكالات (هادي ناضية)
    useEffect(() => {
        const fetchAgencies = async () => {
            const { data } = await supabase.from('agencies').select('*');
            if (data && data.length > 0) {
                setAgencies(data);
                // نصيحة: بلاش ما تفرض عليه الوكالة الأولى أوتوماتيكياً إيلا بغيتي 
                // المانجر يعزل هو راسو، ولكن إيلا مولفها خليها.
                setSelectedAgency(data[0]);
            }
            setIsIntroLoading(false);
        };
        fetchAgencies();
    }, []);

    // 2️⃣ المسمار الثاني: جلب الداتا (التحكم الذكي)
    useEffect(() => {
        // ✅ كنخدمو fetchData غير إيلا كانت الوكالة معزولة والصفحة واجدة
        if (!isIntroLoading && selectedAgency) {
            fetchData();
        }
        // 🚀 المسمار المطرّق: حيدنا activeStaff من هنا!
        // دبا fetchData غاتخدم غير فاش يتبدل التاريخ (selectedDate) 
        // أو فاش يعزل المانجر وكالة أخرى (selectedAgency).
    }, [selectedDate, isIntroLoading, selectedAgency]);

    const financialStats = useMemo(() => {
        return students.reduce((acc, s) => {
            const totalPrice = Number(s.total_price || 0);
            const paid = Number(s.tranche_1 || 0) + Number(s.tranche_2 || 0) + Number(s.tranche_3 || 0) + Number(s.tranche_4 || 0);
            return {
                totalRevenue: acc.totalRevenue + totalPrice,
                totalCollected: acc.totalCollected + paid,
                totalOutstanding: acc.totalOutstanding + (totalPrice - paid),
            };
        }, { totalRevenue: 0, totalCollected: 0, totalOutstanding: 0 });
    }, [students]);

    const filteredStudents = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return students;
        return students.filter(s => {
            const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
            return fullName.includes(term);
        });
    }, [students, searchTerm]);

    return (
        <div className="min-h-screen !w-screen !flex bg-[#F3F4F6] font-black italic uppercase tracking-tighter overflow-x-hidden" dir="rtl">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed right-0 top-0 w-[280px] h-full bg-white border-l border-slate-200 flex-col p-8 z-[50] overflow-y-auto custom-scrollbar">
                <h1 className="text-3xl text-[#0F5A3E] mb-6 italic font-black tracking-tighter leading-none">Younnes<br />.BO</h1>

                <div className="mb-8 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        {agencies.map(agency => (
                            <button
                                key={agency.id}
                                onClick={() => {
                                    setStudents([]); setHamzaLedger([]); setHamzaSchedule(null);
                                    setHamzaAttendance([]); setExamResults([]);
                                    setHamzaLogistics({ balance: 0, mileage_start: 0, mileage_end: 0, fuel_expense: 0 });
                                    setSelectedAgency(agency);
                                    setActiveStaff(null); setShowNathariSub(false); setShowHamzaSub(false);
                                }}
                                className={`p-3 rounded-xl border-2 text-[11px] font-black italic transition-all ${selectedAgency?.id === agency.id ? 'bg-[#1dbf73] text-white border-[#1dbf73] shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                            >
                                {agency.name}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedAgency && (
                    <nav className="space-y-4">
                        {/* Theory Menu */}
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    // ✅ دبا كنخدمو بـ المتغير اللي صلحنا فيه السميات قبيلة
                                    setActiveStaff(theoreticalInstructor);
                                    setShowNathariSub(!showNathariSub);
                                    setShowHamzaSub(false);
                                    // حيدنا setActiveSubTab('theorie') باش ما يتبلوكاوش تابات التطبيقي
                                }}
                                className={`w-full text-right p-5 rounded-[25px] border-2 font-black italic transition-all flex items-center justify-between
            ${(activeStaff?.trim().toLowerCase() === theoreticalInstructor.toLowerCase()) ? 'bg-[#0F5A3E] text-white border-[#0F5A3E] shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent'}`}
                            >
                                <span className="flex items-center gap-2">💼 الـنظري</span>
                                <ChevronDown size={16} className={`transition-transform duration-300 ${showNathariSub ? 'rotate-180' : ''}`} />
                            </button>

                            {showNathariSub && (
                                <div className="mr-4 pr-4 border-r-2 border-emerald-100 flex flex-col gap-1 py-2">
                                    <button
                                        onClick={() => {
                                            setActiveNathariTab('auto');
                                            setActiveStaff(theoreticalInstructor); // تأكيد
                                        }}
                                        className={`flex items-center gap-3 p-4 rounded-xl text-[11px] font-black ${activeNathariTab === 'auto' ? 'bg-[#0F5A3E]/10 text-[#0F5A3E]' : 'text-slate-400'}`}
                                    >
                                        <Car size={14} /> السيارات
                                    </button>

                                    {/* عرض الشاحنة فقط في بودينار */}
                                    {selectedAgency?.name === 'Boudinar' && (
                                        <button
                                            onClick={() => {
                                                setActiveNathariTab('truck');
                                                setActiveStaff(theoreticalInstructor);
                                            }}
                                            className={`flex items-center gap-3 p-4 rounded-xl text-[11px] font-black ${activeNathariTab === 'truck' ? 'bg-[#0F5A3E]/10 text-[#0F5A3E]' : 'text-slate-400'}`}
                                        >
                                            <Truck size={14} /> الشاحنة
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            setActiveNathariTab('archive');
                                            setActiveStaff(theoreticalInstructor);
                                        }}
                                        className={`flex items-center gap-3 p-4 rounded-xl text-[11px] font-black ${activeNathariTab === 'archive' ? 'bg-[#0F5A3E]/10 text-[#0F5A3E]' : 'text-slate-400'}`}
                                    >
                                        <FileText size={14} /> الأرشيف
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Practical Menu */}
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    setActiveStaff(practicalInstructor);
                                    setShowHamzaSub(!showHamzaSub);
                                    setShowNathariSub(false);
                                    // ✅ مسمار: كنعطيو emploi كـ default باش ما تبقاش الباج بيضاء
                                    const allowedTabs = selectedAgency?.name === 'Boudinar'
                                        ? ['emploi', 'suivi', 'vehicule', 'cash', 'exams-car', 'exams-truck', 'gprs']
                                        : ['emploi', 'suivi', 'vehicule', 'cash', 'exams'];
                                    if (activeSubTab === 'theorie' || !allowedTabs.includes(activeSubTab)) {
                                        setActiveSubTab('emploi');
                                    }
                                }}
                                className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
                                    ${(activeStaff?.trim().toLowerCase() === practicalInstructor.toLowerCase()) ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent'}`}
                            >
                                <span className="flex items-center gap-2">🛰️ الـتطبيقي</span>
                                <ChevronDown size={16} className={`transition-transform duration-300 ${showHamzaSub ? 'rotate-180' : ''}`} />
                            </button>
                            {showHamzaSub && (
                                <div className="mr-4 pr-4 border-r-2 border-slate-100 flex flex-col gap-1 py-2">
                                    {[
                                        { id: 'emploi', label: '📅 البرنامج', icon: Calendar },
                                        { id: 'suivi', label: '✅ التتبع', icon: ClipboardCheck },
                                        { id: 'vehicule', label: '🚗 السيارة', icon: Car },
                                        { id: 'cash', label: '💰 الصندوق', icon: Coins },
                                        { id: 'exams', label: '🎓 الامتحانات', icon: GraduationCap },
                                        ...(selectedAgency?.name === 'Boudinar' ? [{ id: 'gprs', label: '🛰️ GPRS', icon: Gauge }] : [])
                                    ].map(item => {
                                        if (item.id === 'exams') {
                                            if (selectedAgency?.name === 'Boudinar') {
                                                const isExamsActive = activeSubTab === 'exams-car' || activeSubTab === 'exams-truck';
                                                return (
                                                    <div key={item.id} className="w-full space-y-1">
                                                        <button
                                                            onClick={() => {
                                                                setShowExamsSubMenu(!showExamsSubMenu);
                                                                if (!isExamsActive) {
                                                                    setActiveSubTab('exams-car'); // default to B
                                                                }
                                                            }}
                                                            className={`w-full flex items-center justify-between p-3 rounded-xl text-[11px] font-black transition-all ${isExamsActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                                        >
                                                            <span className="flex items-center gap-3">
                                                                <GraduationCap size={14} /> {item.label}
                                                            </span>
                                                            <ChevronDown size={12} className={`transition-transform duration-300 ${showExamsSubMenu ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {showExamsSubMenu && (
                                                            <div className="mr-3 pr-3 border-r border-slate-200 flex flex-col gap-1.5 py-1">
                                                                <button
                                                                    onClick={() => setActiveSubTab('exams-car')}
                                                                    className={`w-full text-right p-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${activeSubTab === 'exams-car'
                                                                            ? 'bg-slate-100 text-slate-800'
                                                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    <span>🚗 امتحانات السيارات (Permis B)</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => setActiveSubTab('exams-truck')}
                                                                    className={`w-full text-right p-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${activeSubTab === 'exams-truck'
                                                                            ? 'bg-slate-100 text-slate-800'
                                                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    <span>🚛 امتحانات الوزن الثقيل</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            } else {
                                                const isExamsActive = activeSubTab === 'exams' || activeSubTab === 'exams-car';
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setActiveSubTab('exams')}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-[11px] font-black ${isExamsActive ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                                                    >
                                                        <GraduationCap size={14} /> {item.label}
                                                    </button>
                                                );
                                            }
                                        }

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveSubTab(item.id)} // تأكد بلي كتصيفط item.id (الفرنسي)
                                                className={`flex items-center gap-3 p-3 rounded-xl text-[11px] font-black ${activeSubTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                <item.icon size={14} /> {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {/* 📅 Holiday Tracker Menu (المسمار الجديد) */}
                        <div className="space-y-2 mt-4">
                            <button
                                onClick={() => {
                                    setActiveStaff('holidays'); // غانعطيوه هاد الـ ID باش نعرفو بلي راه خدام فالعطل
                                    setShowNathariSub(false);
                                    setShowHamzaSub(false);
                                }}
                                className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
            ${activeStaff === 'holidays' ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-orange-50'}`}
                            >
                                <span className="flex items-center gap-2">🗓️ تتبع الـعطل</span>
                                <Calendar size={16} />
                            </button>
                        </div>
                    </nav>
                )}
                <div className="mt-auto pt-10 text-[9px] text-slate-300 font-bold text-center italic uppercase">v2.0 • Powered by Mahamran</div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full lg:pr-[280px] min-h-screen relative overflow-x-hidden pb-80 sm:pb-20">
                <header className="sticky top-0 w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-3 lg:px-10 lg:py-6 border-b border-slate-200 bg-white z-[1000] shadow-sm">
                    <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden text-slate-900 bg-slate-100 p-2.5 rounded-xl relative z-50 animate-pulse"
                        >
                            <Menu size={20} />
                        </button>

                        {/* ✅ مسمار 1: البحث يبان عند أي مدرس نظري أو في التابات المحددة */}
                        {(activeStaff?.trim().toLowerCase() === theoreticalInstructor.toLowerCase() || activeSubTab === 'suivi' || activeSubTab === 'exams' || activeSubTab === 'exams-car' || activeSubTab === 'exams-truck') ? (
                            <div className="relative flex-1 max-w-md w-full sm:w-auto">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="بـحث..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-100/80 border border-slate-200 rounded-xl py-2.5 pr-9 outline-none text-xs font-black text-slate-900"
                                    style={{ color: '#0f172a', fontWeight: 900, caretColor: '#0F5A3E' }}
                                />
                            </div>
                        ) : <div className="hidden sm:block text-[10px] text-slate-300 italic font-black uppercase">Auto Ecole {selectedAgency?.name || 'Boudinar'} Terminal</div>}
                    </div>

                    <div className="flex flex-row items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-3 px-4 py-2 border-2 border-slate-900 rounded-2xl bg-white shadow-sm transition-all hover:border-emerald-500 group w-full sm:w-auto justify-between sm:justify-start">
                            <Calendar size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col">
                                <span className="text-[7px] text-slate-400 font-bold uppercase leading-none mb-0.5">تحديد الأسبوع</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent text-slate-900 font-black outline-none text-xs cursor-pointer text-right"
                                    style={{ direction: 'ltr' }}
                                />
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <NotificationDropdown notifications={notifications} unreadCount={unreadCount} onMarkAllRead={markAllAsRead} onMarkSingleRead={markSingleAsRead} onDeleteNotification={deleteNotification} onNavigate={fetchData} />
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-10 text-right" dir="rtl">
                    {!activeStaff ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <ShieldCheck size={60} className="text-[#0F5A3E] animate-pulse" />
                            <h2 className="text-xl font-black italic">مرحباً يونس... اختر طاقم العمل</h2>
                        </div>
                    ) : activeStaff === 'holidays' ? (
                        <div className="max-w-[1600px] mx-auto">
                            <HolidaysTracker />
                        </div>
                    ) : (
                        <div className="max-w-[1600px] mx-auto space-y-8">
                            {/* ✅ مسمار 2: النظري يخدم مع أي مدرس نظري (براهيم، يوسف، محمد، زكرياء...) */}
                            {activeStaff?.trim().toLowerCase() === theoreticalInstructor.toLowerCase() ? (
                                <div className="space-y-8">
                                    {activeNathariTab === 'auto' && <ManagerFinance filteredStudents={filteredStudents} financialStats={financialStats} highlightedName={null} highlightExpiry={0} selectedAgency={selectedAgency} />}
                                    {activeNathariTab === 'truck' && selectedAgency?.name === 'Boudinar' && <ManagerTrucks selectedAgency={selectedAgency} />}
                                    {activeNathariTab === 'archive' && <GlobalReports selectedAgency={selectedAgency} />}
                                </div>
                            ) : (
                                /* ✅ مسمار 3: التطبيقي يخدم مع (حمزة، بلال، إسماعيل، بلقاسمي...) */
                                /* ✅ مسمار 01: توحيد لغة البرمجة لداخل */
                                <div className="space-y-8">
                                    {activeSubTab === 'emploi' && <ManagerPlanning hamzaSchedule={hamzaSchedule} days={days} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {activeSubTab === 'suivi' && <ManagerSuivi students={filteredStudents} hamzaAttendance={hamzaAttendance} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {activeSubTab === 'vehicule' && <ManagerVehicle mileage_start={hamzaLogistics.mileage_start || 0} mileage_end={hamzaLogistics.mileage_end || 0} fuel_expense={hamzaLogistics.fuel_expense || 0} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {activeSubTab === 'cash' && <ManagerCash balance={hamzaLogistics.balance || 0} ledger={hamzaLedger} previousBalance={previousBalance} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {(activeSubTab === 'exams-car' || activeSubTab === 'exams') && <ManagerExams students={filteredStudents} examResults={examResults} highlightedName={null} highlightExpiry={0} selectedAgency={selectedAgency} instructorName={practicalInstructor} selectedDate={selectedDate} />}
                                    {activeSubTab === 'exams-truck' && selectedAgency?.name === 'Boudinar' && <ManagerTrucks selectedAgency={selectedAgency} viewMode="exams" />}
                                    {activeSubTab === 'gprs' && selectedAgency?.name === 'Boudinar' && <ManagerGPRS weekDate={selectedDate} selectedAgency={selectedAgency} />}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-[5000] lg:hidden">
                    {/* Background Overlay - هادا هو اللي كيدير الضبابة وكيخليك تسد المينيو */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />

                    <aside className="absolute right-0 top-0 bottom-0 w-[300px] bg-white p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black italic">الـقـائـمـة</h2>
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-8 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                {agencies.map(agency => (
                                    <button
                                        key={agency.id}
                                        onClick={() => { setSelectedAgency(agency); setActiveStaff(null); setIsSidebarOpen(false); }}
                                        className={`p-3 rounded-xl border-2 text-[10px] font-black ${selectedAgency?.id === agency.id ? 'bg-[#1dbf73] text-white' : 'bg-slate-50 text-slate-500'}`}
                                    >
                                        {agency.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <nav className="space-y-4">
                            <button
                                onClick={() => { setActiveStaff(theoreticalInstructor); setShowNathariSub(!showNathariSub); setShowHamzaSub(false); }}
                                className={`w-full text-right p-5 rounded-2xl border-2 font-black italic flex justify-between ${(activeStaff?.trim().toLowerCase() === theoreticalInstructor.toLowerCase()) ? 'bg-[#0F5A3E] text-white' : 'bg-slate-50'}`}
                            >
                                <span>💼 الـنظري</span>
                                <ChevronDown size={16} />
                            </button>
                            {showNathariSub && (
                                <div className="mr-4 pr-4 border-r-2 border-emerald-100 flex flex-col gap-2">
                                    <button onClick={() => { setActiveNathariTab('auto'); setIsSidebarOpen(false); }} className="text-right py-2 text-[11px] font-black">🚗 السيارات</button>
                                    {selectedAgency?.name === 'Boudinar' && <button onClick={() => { setActiveNathariTab('truck'); setIsSidebarOpen(false); }} className="text-right py-2 text-[11px] font-black">🚛 الشاحنة</button>}
                                    <button onClick={() => { setActiveNathariTab('archive'); setIsSidebarOpen(false); }} className="text-right py-2 text-[11px] font-black">📊 الأرشيف</button>
                                </div>
                            )}

                            <button
                                onClick={() => { setActiveStaff(practicalInstructor); setShowHamzaSub(!showHamzaSub); setShowNathariSub(false); }}
                                className={`w-full text-right p-5 rounded-2xl border-2 font-black italic flex justify-between ${(activeStaff?.trim().toLowerCase() === practicalInstructor.toLowerCase()) ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}
                            >
                                <span>🛰️ الـتطبيقي</span>
                                <ChevronDown size={16} />
                            </button>
                            {showHamzaSub && (
                                <div className="mr-4 pr-4 border-r-2 border-slate-100 flex flex-col gap-2">
                                    {/* ✅ المسمار المصحح: توحيد الـ IDs مع الـ Desktop */}
                                    {/* ✅ مسمار 02: هاد الأوبجيكت كيخلي الكليكة تفهم بالفرنسي والمدير يشوف بالعربي */}
                                    {[
                                        { id: 'emploi', label: '📅 البرنامج' },
                                        { id: 'suivi', label: '✅ التتبع' },
                                        { id: 'vehicule', label: '🚗 السيارة' },
                                        { id: 'cash', label: '💰 الصندوق' },
                                        { id: 'exams', label: '🎓 الامتحانات' }
                                    ].map(item => {
                                        if (item.id === 'exams') {
                                            if (selectedAgency?.name === 'Boudinar') {
                                                const isExamsActive = activeSubTab === 'exams-car' || activeSubTab === 'exams-truck';
                                                return (
                                                    <div key={item.id} className="w-full space-y-1">
                                                        <button
                                                            onClick={() => {
                                                                setShowExamsSubMenu(!showExamsSubMenu);
                                                                if (!isExamsActive) {
                                                                    setActiveSubTab('exams-car'); // default to B
                                                                }
                                                            }}
                                                            className={`w-full flex items-center justify-between py-2 text-[11px] font-black ${isExamsActive ? 'text-slate-900 font-extrabold' : 'text-slate-500'}`}
                                                        >
                                                            <span className="flex items-center gap-2">🎓 {item.label}</span>
                                                            <ChevronDown size={12} className={`transition-transform duration-300 ${showExamsSubMenu ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {showExamsSubMenu && (
                                                            <div className="mr-3 pr-3 border-r border-slate-200 flex flex-col gap-2 py-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveSubTab('exams-car');
                                                                        setIsSidebarOpen(false);
                                                                    }}
                                                                    className={`text-right py-1.5 text-[10px] font-black ${activeSubTab === 'exams-car' ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}
                                                                >
                                                                    🚗 امتحانات السيارات (Permis B)
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveSubTab('exams-truck');
                                                                        setIsSidebarOpen(false);
                                                                    }}
                                                                    className={`text-right py-1.5 text-[10px] font-black ${activeSubTab === 'exams-truck' ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}
                                                                >
                                                                    🚛 امتحانات الوزن الثقيل
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            } else {
                                                const isExamsActive = activeSubTab === 'exams' || activeSubTab === 'exams-car';
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            setActiveSubTab('exams');
                                                            setIsSidebarOpen(false);
                                                        }}
                                                        className={`text-right py-2 text-[11px] font-black ${isExamsActive ? 'text-slate-900 font-black' : 'text-slate-500'}`}
                                                    >
                                                        🎓 {item.label}
                                                    </button>
                                                );
                                            }
                                        }

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveSubTab(item.id); // كيعطي 'emploi' للسيستيم
                                                    setIsSidebarOpen(false);   // كيسد المينيو ف التابلت
                                                }}
                                                className={`text-right py-2 text-[11px] font-black capitalize ${activeSubTab === item.id ? 'text-slate-900 font-black' : 'text-slate-500'}`}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                    {selectedAgency?.name === 'Boudinar' && <button onClick={() => { setActiveSubTab('gprs'); setIsSidebarOpen(false); }} className="text-right py-2 text-[11px] font-black">🛰️ GPRS</button>}
                                </div>
                            )}
                            {/* 📅 Holiday Tracker Menu (المسمار المصحح) */}
                            <div className="space-y-2 mt-4">
                                <button
                                    onClick={() => {
                                        setActiveStaff('holidays');
                                        setShowNathariSub(false);
                                        setShowHamzaSub(false);
                                        setIsSidebarOpen(false); // ✅ المسمار: هاد السطر هو اللي كيسد المينيو باش تبان الباج
                                    }}
                                    className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
                                        ${activeStaff === 'holidays' ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-orange-50'}`}
                                >
                                    <span className="flex items-center gap-2">🗓️ تتبع الـعطل</span>
                                    <Calendar size={16} />
                                </button>
                            </div>
                        </nav>
                    </aside>
                </div>
            )}
        </div>
    );
}