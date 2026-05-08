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
import { Agency, Student, ScheduleData, ExamResult, AttendanceRecord, CashRecord, VehicleLog } from '@/types/dashboard';

// ✅ المسمار الحقيقي: شحن الصفحة فقط فالمتصفح وبلا SSR
const GlobalReports = dynamic(() => import('@/components/manager/GlobalReports'), {
    ssr: false,
    loading: () => <div className="p-20 text-center font-black animate-pulse text-slate-300">جاري تحميل نظام الأرشيف...</div>
});

const getMonday = (date: string | Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
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

    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [weekDate, setWeekDate] = useState(new Date().toISOString().split('T')[0]);

    const [hamzaSchedule, setHamzaSchedule] = useState<ScheduleData | null>(null);
    const [examResults, setExamResults] = useState<ExamResult[]>([]);
    const [hamzaAttendance, setHamzaAttendance] = useState<AttendanceRecord[]>([]);
    const [hamzaLedger, setHamzaLedger] = useState<CashRecord[]>([]);
    const [hamzaLogistics, setHamzaLogistics] = useState<Partial<VehicleLog>>({ mileage_start: 0, mileage_end: 0, fuel_expense: 0 });

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

    const { notifications, unreadCount, markAllAsRead, markSingleAsRead } = useNotifications(selectedAgency?.name || 'Boudinar');

    const fetchData = async () => {
        if (!selectedAgency) return;
        try {
            setLoading(true);

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

            // 2️⃣ جلب الجدول الزمني
            const { data: sched } = await supabase
                .from('weekly_schedules')
                .select('*')
                // ✅ الفلترة بـ الوكالة فقط أضمن للمانجر
                .eq('agence_id', selectedAgency.id)
                .eq('week_start_date', getMonday(weekDate))
                .maybeSingle();

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
                .eq('week_start_date', getMonday(weekDate))
                .maybeSingle();

            // 6️⃣ جلب الكاش (Petty Cash) - (حيدنا staff_name)
            const { data: pCash } = await supabase
                .from('petty_cash_ledger')
                .select('*')
                .eq('agence_id', selectedAgency.id)
                .order('created_at', { ascending: false });

            // 7️⃣ تحديث الـ State (كولشي كيعمر دقة وحدة)
            setHamzaLedger(pCash || []);
            setHamzaSchedule(sched?.schedule_data || null);
            setExamResults(res || []);
            setHamzaAttendance(att || []);

            const bal = pCash?.reduce((acc: number, curr: CashRecord) =>
                curr.type === 'recette' ? acc + curr.amount : acc - curr.amount, 0
            ) || 0;

            setHamzaLogistics({
                balance: bal,
                mileage_start: vLog?.mileage_start || 0,
                mileage_end: vLog?.mileage_end || 0,
                fuel_expense: vLog?.fuel_expense || 0
            });

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
        // دبا fetchData غاتخدم غير فاش يتبدل التاريخ (weekDate) 
        // أو فاش يعزل المانجر وكالة أخرى (selectedAgency).
    }, [weekDate, isIntroLoading, selectedAgency]);

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
                                    // مهم: كنأكدوا بلي حنا فـ النظري باش ما يتفتحش التطبيقي
                                    setActiveSubTab('theorie');
                                }}
                                className={`w-full text-right p-5 rounded-[25px] border-2 font-black italic transition-all flex items-center justify-between
            ${(activeStaff === theoreticalInstructor) ? 'bg-[#0F5A3E] text-white border-[#0F5A3E] shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent'}`}
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
                                }}
                                className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
                                    ${(activeStaff === 'Hamza' || activeStaff === 'Bilal') ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent'}`}
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
                                    ].map(item => (
                                        <button key={item.id} onClick={() => setActiveSubTab(item.id)} className={`flex items-center gap-3 p-3 rounded-xl text-[11px] font-black ${activeSubTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
                                            <item.icon size={14} /> {item.label}
                                        </button>
                                    ))}
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
                <header className="sticky top-0 w-full flex items-center justify-between px-3 py-3 lg:px-10 lg:py-6 border-b border-slate-200 bg-white z-[1000] shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden text-slate-900 bg-slate-100 p-2.5 rounded-xl relative z-50"
                        >
                            <Menu size={20} />
                        </button>

                        {/* ✅ مسمار 1: البحث يبان عند أي مدرس نظري أو في التابات المحددة */}
                        {(activeStaff === theoreticalInstructor || activeSubTab === 'suivi' || activeSubTab === 'exams') ? (
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input type="text" placeholder="بـحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-9 outline-none text-[11px] font-black" />
                            </div>
                        ) : <div className="hidden sm:block text-[10px] text-slate-300 italic font-black uppercase">Auto Ecole {selectedAgency?.name || 'Boudinar'} Terminal</div>}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2 px-3 text-[10px] font-black flex items-center gap-2 overflow-hidden">
                            <Calendar size={12} className="text-emerald-600" />
                            <span dir="ltr">{new Date(weekDate).toLocaleDateString('fr-FR')}</span>
                            <input
                                type="date"
                                value={weekDate}
                                onChange={(e) => setWeekDate(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                        <NotificationDropdown notifications={notifications} unreadCount={unreadCount} onMarkAllRead={markAllAsRead} onMarkSingleRead={markSingleAsRead} onNavigate={fetchData} />
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
                            {activeStaff === theoreticalInstructor ? (
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
                                    {activeSubTab === 'cash' && <ManagerCash balance={hamzaLogistics.balance || 0} ledger={hamzaLedger} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {activeSubTab === 'exams' && <ManagerExams students={filteredStudents} examResults={examResults} highlightedName={null} highlightExpiry={0} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {activeSubTab === 'gprs' && selectedAgency?.name === 'Boudinar' && <ManagerGPRS weekDate={weekDate} selectedAgency={selectedAgency} />}
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
                                className={`w-full text-right p-5 rounded-2xl border-2 font-black italic flex justify-between ${(activeStaff === 'Youssef' || activeStaff === 'Mohammed') ? 'bg-[#0F5A3E] text-white' : 'bg-slate-50'}`}
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
                                className={`w-full text-right p-5 rounded-2xl border-2 font-black italic flex justify-between ${(activeStaff === 'Hamza' || activeStaff === 'Bilal') ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}
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
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setActiveSubTab(item.id); // كيعطي 'emploi' للسيستيم
                                                setIsSidebarOpen(false);   // كيسد المينيو ف التابلت
                                            }}
                                            className="text-right py-2 text-[11px] font-black capitalize"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
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