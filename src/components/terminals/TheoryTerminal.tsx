'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import TheorieHeader from '@/components/theorie/TheorieHeader';
import { Printer, Search, Save, User, CheckCircle2, Check, X, GraduationCap, Car, LockIcon, AlertCircle, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic'; const PdfButton = dynamic(() => import('@/components/theorie/trancheButton'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-200 h-10 w-32 rounded-xl"></div>
});
const ExamScheduleButton = dynamic(() => import('@/components/theorie/ExamScheduleButton'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-200 h-10 w-32 rounded-xl"></div>
});
const MedicalTimbreButton = dynamic(() => import('@/components/theorie/MedicalTimbreButton'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-200 h-10 w-32 rounded-xl"></div>
});

import { ExamResult } from '@/types/dashboard';
import { generateDetailedExamsPrint } from '@/components/manager/PrintDetailedResults';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  total_price: number;
  tranche_1: number;
  tranche_2: number;
  tranche_3: number;
  tranche_4: number;
  tranche_5: number;
  t1_date?: string | null;
  t2_date?: string | null;
  t3_date?: string | null;
  t4_date?: string | null;
  t5_date?: string | null;
  t1_timbre_amount?: number | null;
  t2_timbre_amount?: number | null;
  t3_timbre_amount?: number | null;
  t4_timbre_amount?: number | null;
  t5_timbre_amount?: number | null;
  t1_medical_paid?: string | boolean | null;
  t2_medical_paid?: string | boolean | null;
  t3_medical_paid?: string | boolean | null;
  t4_medical_paid?: string | boolean | null;
  t5_medical_paid?: string | boolean | null;
  pratique_note?: string | null;
  registration_date: string;
  exam_date: string | null;
  created_at?: string;
  agence_id?: string;
  license_type?: string;
  training_location?: string;
  notes?: string | null;
  paid_timbre_in?: number;
  paid_medical_in?: number;
  t1?: number;
  t2?: number;
  t3?: number;
  t4?: number;
  t5?: number;
}

import TheorieForm, { FormData as TheoryFormData } from '@/components/theorie/TheorieForm';

interface TheoryTerminalProps {
  instructorName: string;
  agenceId: string;
  agenceName: string;
}

export interface HeavyExamData {
  theory_date: string;
  theory_result: 'admis' | 'echoue' | '';
  theory_result_2: 'admis' | 'echoue' | '';
  practical_date: string;
  practical_result: 'admis' | 'echoue' | '';
  practical_result_2: 'admis' | 'echoue' | '';
}

export function parseHeavyExamData(student: any): HeavyExamData {
  const defaultData: HeavyExamData = {
    theory_date: student.exam_date || '',
    theory_result: '',
    theory_result_2: '',
    practical_date: '',
    practical_result: '',
    practical_result_2: ''
  };
  if (!student.notes) return defaultData;
  const match = student.notes.match(/\[EXAM_DATA:({.*?})\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        theory_date: parsed.theory_date || student.exam_date || '',
        theory_result: parsed.theory_result || '',
        theory_result_2: parsed.theory_result_2 || '',
        practical_date: parsed.practical_date || '',
        practical_result: parsed.practical_result || '',
        practical_result_2: parsed.practical_result_2 || ''
      };
    } catch (e) {
      console.error("Error parsing EXAM_DATA:", e);
    }
  }
  return defaultData;
}

export function serializeHeavyExamData(existingNotes: string | null | undefined, data: HeavyExamData): string {
  const cleanNotes = (existingNotes || '').replace(/\[EXAM_DATA:.*?\]/g, '').trim();
  const jsonStr = JSON.stringify(data);
  return `[EXAM_DATA:${jsonStr}] ${cleanNotes}`.trim();
}

function StudentExamCard({
  student,
  onSave,
  getAgencyName
}: {
  student: Student;
  onSave: (id: string, data: HeavyExamData) => Promise<void>;
  getAgencyName: (id: string | null | undefined) => string;
}) {
  const examData = useMemo(() => parseHeavyExamData(student), [student]);

  const [theoryDate, setTheoryDate] = useState(examData.theory_date);
  const [theoryResult, setTheoryResult] = useState(examData.theory_result);
  const [theoryResult2, setTheoryResult2] = useState(examData.theory_result_2);

  const [practicalDate, setPracticalDate] = useState(examData.practical_date);
  const [practicalResult, setPracticalResult] = useState(examData.practical_result);
  const [practicalResult2, setPracticalResult2] = useState(examData.practical_result_2);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fresh = parseHeavyExamData(student);
    setTheoryDate(fresh.theory_date);
    setTheoryResult(fresh.theory_result);
    setTheoryResult2(fresh.theory_result_2);
    setPracticalDate(fresh.practical_date);
    setPracticalResult(fresh.practical_result);
    setPracticalResult2(fresh.practical_result_2);
  }, [student]);

  const hasChanges = theoryDate !== examData.theory_date ||
    theoryResult !== examData.theory_result ||
    theoryResult2 !== examData.theory_result_2 ||
    practicalDate !== examData.practical_date ||
    practicalResult !== examData.practical_result ||
    practicalResult2 !== examData.practical_result_2;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(student.id, {
        theory_date: theoryDate,
        theory_result: theoryResult,
        theory_result_2: theoryResult2,
        practical_date: practicalDate,
        practical_result: practicalResult,
        practical_result_2: practicalResult2
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleLocalUpdate = (field: string, value: any) => {
    if (field === 'theory_result') {
      setTheoryResult(value);
      if (value !== 'echoue') {
        setTheoryResult2('');
      }
      if (value !== 'admis') {
        setPracticalDate('');
        setPracticalResult('');
        setPracticalResult2('');
      }
    } else if (field === 'theory_result_2') {
      setTheoryResult2(value);
      if (value !== 'admis') {
        setPracticalDate('');
        setPracticalResult('');
        setPracticalResult2('');
      }
    } else if (field === 'practical_result') {
      setPracticalResult(value);
      if (value !== 'echoue') {
        setPracticalResult2('');
      }
    } else if (field === 'practical_result_2') {
      setPracticalResult2(value);
    } else if (field === 'theory_date') {
      setTheoryDate(value);
    } else if (field === 'practical_date') {
      setPracticalDate(value);
    }
  };

  const totalFailures =
    (theoryResult === 'echoue' ? 1 : 0) +
    (theoryResult2 === 'echoue' ? 1 : 0) +
    (practicalResult === 'echoue' ? 1 : 0) +
    (practicalResult2 === 'echoue' ? 1 : 0);

  const savedFailures =
    (examData.theory_result === 'echoue' ? 1 : 0) +
    (examData.theory_result_2 === 'echoue' ? 1 : 0) +
    (examData.practical_result === 'echoue' ? 1 : 0) +
    (examData.practical_result_2 === 'echoue' ? 1 : 0);

  const isTotalFailure = totalFailures >= 2;
  const isTheoryPassed = theoryResult === 'admis' || theoryResult2 === 'admis';
  const isPracticalPassed = practicalResult === 'admis' || practicalResult2 === 'admis';
  const isWinner = isTheoryPassed && isPracticalPassed;

  const isTheory1Failed = theoryResult === 'echoue';
  const isTheory2Passed = theoryResult2 === 'admis';
  const isTheory2Failed = theoryResult2 === 'echoue';
  const isEliminatedTheory = isTheory1Failed && isTheory2Failed;
  const usedLifeInTheory = isTheory1Failed && isTheory2Passed;

  const isLocked = (field: string) => {
    if (savedFailures >= 2) return true;
    return !!examData[field as keyof HeavyExamData];
  };

  const name = `${student.first_name} ${student.last_name}`;
  const agenceName = getAgencyName(student.agence_id);

  return (
    <div className={`bg-white border-2 rounded-[35px] overflow-hidden transition-all duration-500 text-right ${isWinner ? 'border-emerald-500 shadow-xl' : isTotalFailure ? 'border-red-500 opacity-90' : 'border-slate-100 shadow-sm'
      }`} dir="rtl">
      {/* HEADER */}
      <div className={`px-6 py-5 flex justify-between items-center ${isWinner ? 'bg-emerald-50' : isTotalFailure ? 'bg-red-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isWinner ? 'bg-emerald-500 text-white' : isTotalFailure ? 'bg-red-500 text-white' : 'bg-white text-slate-400'
            }`}>
            <User size={18} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-base font-black text-slate-800 tracking-tight uppercase leading-none mb-1.5 block">
              {name}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-slate-900 text-white text-[9px] px-2.5 py-0.5 rounded-md font-black uppercase italic">
                Permis {student.license_type || 'C'}
              </span>
              <span className="text-[10px] font-bold italic text-slate-500">
                موعد الامتحان: {theoryDate || 'غير محدد'}
              </span>
            </div>
          </div>
        </div>
        {isWinner ? (
          <div className="bg-emerald-500 text-white px-5 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
            <span className="text-[11px] font-black italic">نـاجـح نـهـائـيـاً</span>
            <CheckCircle2 size={18} className="animate-pulse" />
          </div>
        ) : isTotalFailure ? (
          <div className="bg-red-500 text-white px-5 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
            <span className="text-[11px] font-black italic">راسب نهائياً</span>
            <AlertCircle size={18} />
          </div>
        ) : null}
      </div>

      <div className="p-6 space-y-10">
        {/* SECTION 01: THEORY */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-2">
            <div className="flex items-center gap-2 bg-slate-100/80 w-fit px-4 py-1.5 rounded-full border border-slate-200/50">
              <GraduationCap size={14} className="text-slate-600" />
              <span className="text-[11px] text-slate-700 font-black uppercase tracking-wider">الامتحان النظري</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-black">تاريخ النظري:</span>
              <input
                type="date"
                value={theoryDate}
                disabled={isLocked('theory_result')}
                onChange={(e) => handleLocalUpdate('theory_date', e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#0F5A3E] transition-all text-center"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* Attempt 1 */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-black uppercase pr-2">الدورة 01</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLocalUpdate('theory_result', 'admis')}
                  disabled={isLocked('theory_result')}
                  className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${theoryResult === 'admis' ? 'bg-[#1dbf73] border-[#1dbf73] text-white' : 'bg-white border-slate-100 text-slate-300'
                    }`}
                >
                  ناجح
                </button>
                <button
                  onClick={() => handleLocalUpdate('theory_result', 'echoue')}
                  disabled={isLocked('theory_result')}
                  className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${theoryResult === 'echoue' ? 'bg-[#ef4444] border-[#ef4444] text-white' : 'bg-white border-slate-100 text-slate-300'
                    }`}
                >
                  راسب
                </button>
              </div>
            </div>

            {/* Attempt 2 */}
            <div className={`space-y-3 ${theoryResult !== 'echoue' ? 'opacity-30' : ''}`}>
              <span className="text-[10px] text-slate-400 font-black uppercase pr-2">الدورة 02</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLocalUpdate('theory_result_2', 'admis')}
                  disabled={isLocked('theory_result_2') || theoryResult !== 'echoue'}
                  className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${theoryResult2 === 'admis' ? 'bg-[#1dbf73] border-[#1dbf73] text-white' : 'bg-white border-slate-100 text-slate-300'
                    }`}
                >
                  ناجح
                </button>
                <button
                  onClick={() => handleLocalUpdate('theory_result_2', 'echoue')}
                  disabled={isLocked('theory_result_2') || theoryResult !== 'echoue'}
                  className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${theoryResult2 === 'echoue' ? 'bg-[#ef4444] border-[#ef4444] text-white' : 'bg-white border-slate-100 text-slate-300'
                    }`}
                >
                  راسب
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 02: PRACTICAL */}
        <AnimatePresence mode="wait">
          {!isTheoryPassed || isEliminatedTheory ? (
            <motion.div
              key="lock1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center justify-center gap-3 text-center"
            >
              <LockIcon size={20} className="text-slate-300 mx-auto" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                {isEliminatedTheory ? "المرشح رسب نهائياً في النظري" : "في انتظار النجاح في النظري لفتح التطبيقي"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="section2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2 bg-slate-100/80 w-fit px-4 py-1.5 rounded-full border border-slate-200/50">
                    <Car size={14} className="text-slate-600" />
                    <span className="text-[11px] text-slate-700 font-black uppercase tracking-wider">الامتحان التطبيقي</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-black">تاريخ التطبيقي:</span>
                    <input
                      type="date"
                      value={practicalDate}
                      disabled={isLocked('practical_result')}
                      onChange={(e) => handleLocalUpdate('practical_date', e.target.value)}
                      className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#0F5A3E] transition-all text-center"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {/* Attempt 1 */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-400 font-black uppercase pr-2">الدورة 01</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLocalUpdate('practical_result', 'admis')}
                        disabled={isLocked('practical_result')}
                        className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${practicalResult === 'admis' ? 'bg-[#1dbf73] border-[#1dbf73] text-white' : 'bg-white border-slate-100 text-slate-300'
                          }`}
                      >
                        ناجح
                      </button>
                      <button
                        onClick={() => handleLocalUpdate('practical_result', 'echoue')}
                        disabled={isLocked('practical_result')}
                        className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${practicalResult === 'echoue' ? 'bg-[#ef4444] border-[#ef4444] text-white' : 'bg-white border-slate-100 text-slate-300'
                          }`}
                      >
                        راسب
                      </button>
                    </div>
                  </div>

                  {/* Attempt 2 */}
                  <div className={`space-y-3 ${(practicalResult !== 'echoue' || usedLifeInTheory) ? 'opacity-30' : ''}`}>
                    <span className="text-[10px] text-slate-400 font-black uppercase pr-2">الدورة 02</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLocalUpdate('practical_result_2', 'admis')}
                        disabled={isLocked('practical_result_2') || practicalResult !== 'echoue' || usedLifeInTheory}
                        className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${practicalResult2 === 'admis' ? 'bg-[#1dbf73] border-[#1dbf73] text-white' : 'bg-white border-slate-100 text-slate-300'
                          }`}
                      >
                        ناجح
                      </button>
                      <button
                        onClick={() => handleLocalUpdate('practical_result_2', 'echoue')}
                        disabled={isLocked('practical_result_2') || practicalResult !== 'echoue' || usedLifeInTheory}
                        className={`flex-1 h-12 rounded-2xl text-[11px] font-black border-2 transition-all ${practicalResult2 === 'echoue' ? 'bg-[#ef4444] border-[#ef4444] text-white' : 'bg-white border-slate-100 text-slate-300'
                          }`}
                      >
                        راسب
                      </button>
                    </div>
                    {usedLifeInTheory && practicalResult === 'echoue' && (
                      <p className="text-[9px] text-red-500 font-bold mt-1 text-center font-black">⚠️ مقصي نهائياً</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full h-16 rounded-[25px] font-black text-sm flex items-center justify-center gap-3 shadow-2xl transition-all ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0F5A3E] text-white hover:bg-emerald-800'
              }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? 'جـاري الـحـفـظ...' : 'تـأكـيـد وحـفـظ الـنـتـائـج'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function TheoryTerminal({ instructorName, agenceId, agenceName }: TheoryTerminalProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [activePanel, setActivePanel] = useState<'registration' | 'exams'>('registration');
  const [examSearchTerm, setExamSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const isSubmitting = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintType, setSelectedPrintType] = useState('B');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fleet Modal States
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [fleetFormData, setFleetFormData] = useState({
    action_type: 'handover',
    vehicle_name: 'Peugeot',
    counterparty_name: '',
    log_date: new Date().toISOString().split('T')[0],
    log_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    km_reading: '',
    fuel_expenses: '',
  });
  const [fleetImages, setFleetImages] = useState<File[]>([]);

  const [formData, setFormData] = useState<TheoryFormData>({
    firstName: '',
    lastName: '',
    totalPrice: '',
    t1: '', t2: '', t3: '', t4: '', t5: '',
    t1_date: null, t2_date: null, t3_date: null, t4_date: null, t5_date: null,
    t1_timbre: 0, t2_timbre: 0, t3_timbre: 0, t4_timbre: 0, t5_timbre: 0,
    t1_medical: '', t2_medical: '', t3_medical: '', t4_medical: '', t5_medical: '',
    pratiqueNote: '',
    registrationDate: new Date().toISOString().split('T')[0],
    examDate: '',
    licenseType: 'B',
    trainingLocation: 'lboubsi',
    paidTimbreIn: 0,
    paidMedicalIn: 0,
    notes: '',
    status: 'active'
  });

  const fetchAgencies = async () => {
    const { data } = await supabase.from('agencies').select('id, name');
    if (data) setAgencies(data);
  };

  const fetchStudents = async () => {
    try {
      const isBoudinar = agenceName.toLowerCase() === 'boudinar' || agenceName === 'Boudinar';

      const [stRes, truckRes, examRes] = await Promise.all([
        supabase.from('students').select('*').eq('agence_id', agenceId).order('created_at', { ascending: false }),
        isBoudinar
          ? supabase.from('truck_students').select('*').order('created_at', { ascending: false })
          : supabase.from('truck_students').select('*').eq('agence_id', agenceId).order('created_at', { ascending: false }),
        supabase.from('exam_results').select('*').eq('agence_id', agenceId)
      ]);

      const normalStudents = (stRes.data || []).map((s: any) => ({ ...s, license_type: 'B' }));
      const heavyStudents = (truckRes.data || []).map((s: any) => ({ ...s }));

      const allMerged = [...normalStudents, ...heavyStudents].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      setStudents(allMerged);
      if (examRes.data) setExamResults(examRes.data as ExamResult[]);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
    }
  };

  useEffect(() => {
    setStudents([]);
    setExamResults([]);
    fetchAgencies();
    fetchStudents();

    const channel = supabase.channel(`theory-sync-${agenceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `agence_id=eq.${agenceId}` }, () => fetchStudents())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'truck_students', filter: `agence_id=eq.${agenceId}` }, () => fetchStudents())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_results', filter: `agence_id=eq.${agenceId}` }, () => fetchStudents())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agenceId]);

  const resetForm = () => {
    setSelectedStudentId(null);
    setFormData({
      firstName: '',
      lastName: '',
      totalPrice: '',
      t1: '', t2: '', t3: '', t4: '', t5: '',
      t1_date: null, t2_date: null, t3_date: null, t4_date: null, t5_date: null,
      t1_timbre: 0, t2_timbre: 0, t3_timbre: 0, t4_timbre: 0, t5_timbre: 0,
      t1_medical: '', t2_medical: '', t3_medical: '', t4_medical: '', t5_medical: '',
      pratiqueNote: '',
      registrationDate: new Date().toISOString().split('T')[0],
      examDate: '',
      licenseType: 'B',
      trainingLocation: 'lboubsi',
      paidTimbreIn: 0,
      paidMedicalIn: 0,
      notes: '',
      status: 'active'
    });
  };

  // 🚀 إعادة تعيين حالة التعديل عند تغيير المترشح المحدد لتجنب تعليق الفورم
  useEffect(() => {
    setIsEditing(false);
  }, [selectedStudentId]);

  useEffect(() => {
    if (isEditing || isSubmitting.current) return;
    const s = students.find(st => String(st.id) === String(selectedStudentId));
    if (selectedStudentId && s) {
      const isHeavy = s.license_type && s.license_type !== 'B';
      setFormData({
        firstName: s.first_name || '',
        lastName: s.last_name || '',
        totalPrice: s.total_price || '',
        t1: isHeavy ? (s.t1 || '') : (s.tranche_1 || ''),
        t2: isHeavy ? (s.t2 || '') : (s.tranche_2 || ''),
        t3: isHeavy ? (s.t3 || '') : (s.tranche_3 || ''),
        t4: isHeavy ? (s.t4 || '') : (s.tranche_4 || ''),
        t5: isHeavy ? (s.t5 || '') : (s.tranche_5 || ''),
        t1_date: s.t1_date || null,
        t2_date: s.t2_date || null,
        t3_date: s.t3_date || null,
        t4_date: s.t4_date || null,
        t5_date: s.t5_date || null,
        t1_timbre: isHeavy ? 0 : (Number(s.t1_timbre_amount) || 0),
        t2_timbre: isHeavy ? 0 : (Number(s.t2_timbre_amount) || 0),
        t3_timbre: isHeavy ? 0 : (Number(s.t3_timbre_amount) || 0),
        t4_timbre: isHeavy ? 0 : (Number(s.t4_timbre_amount) || 0),
        t5_timbre: isHeavy ? 0 : (Number(s.t5_timbre_amount) || 0),
        t1_medical: isHeavy ? "" : (typeof s.t1_medical_paid === 'string' ? s.t1_medical_paid : (s.t1_medical_paid ? "نعم" : "")),
        t2_medical: isHeavy ? "" : (typeof s.t2_medical_paid === 'string' ? s.t2_medical_paid : (s.t2_medical_paid ? "نعم" : "")),
        t3_medical: isHeavy ? "" : (typeof s.t3_medical_paid === 'string' ? s.t3_medical_paid : (s.t3_medical_paid ? "نعم" : "")),
        t4_medical: isHeavy ? "" : (typeof s.t4_medical_paid === 'string' ? s.t4_medical_paid : (s.t4_medical_paid ? "نعم" : "")),
        t5_medical: isHeavy ? "" : (typeof s.t5_medical_paid === 'string' ? s.t5_medical_paid : (s.t5_medical_paid ? "نعم" : "")),
        pratiqueNote: s.pratique_note || '',
        registrationDate: s.registration_date ? s.registration_date.split('T')[0] : '',
        examDate: s.exam_date || '',
        licenseType: s.license_type || 'B',
        trainingLocation: s.license_type === 'A' ? 'YOUNESS' : (s.training_location || 'lboubsi'),
        paidTimbreIn: s.paid_timbre_in || 0,
        paidMedicalIn: s.paid_medical_in || 0,
        notes: s.notes || '',
        status: (s as any).status || 'active'
      });
    } else if (!selectedStudentId) {
      resetForm();
    }
  }, [selectedStudentId, students, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.totalPrice) {
      alert("⚠️ لا يمكن حفظ تلميذ دون معلومات");
      return;
    }
    if (loading || isSubmitting.current) return;
    setLoading(true);
    isSubmitting.current = true;

    const isHeavy = formData.licenseType && formData.licenseType !== 'B';
    const existingStudent = students.find(st => String(st.id) === String(selectedStudentId));

    // Determine target table cleanly
    const targetTable = selectedStudentId
      ? ((existingStudent?.license_type && existingStudent.license_type !== 'B') ? 'truck_students' : 'students')
      : (isHeavy ? 'truck_students' : 'students');

    const payload = targetTable === 'truck_students' ? {
      first_name: formData.firstName,
      last_name: formData.lastName,
      agence_id: agenceId,
      notes: formData.notes || '',
      registration_date: formData.registrationDate,
      exam_date: formData.examDate || null,
      license_type: formData.licenseType,
      training_location: formData.licenseType === 'A' ? 'YOUNESS' : formData.trainingLocation,
      total_price: Number(formData.totalPrice),
      paid_timbre_in: formData.paidTimbreIn || 0,
      paid_medical_in: formData.paidMedicalIn || 0,
      t1: Number(formData.t1) || 0,
      t2: Number(formData.t2) || 0,
      t3: Number(formData.t3) || 0,
      t4: Number(formData.t4) || 0,
      t5: Number(formData.t5) || 0,
      t1_date: formData.t1_date || null,
      t2_date: formData.t2_date || null,
      t3_date: formData.t3_date || null,
      t4_date: formData.t4_date || null,
      t5_date: formData.t5_date || null,
      status: formData.status || 'active'
    } : {
      first_name: formData.firstName,
      last_name: formData.lastName,
      agence_id: agenceId,
      agency: agenceName, // Backward compatibility
      total_price: Number(formData.totalPrice),
      tranche_1: Number(formData.t1),
      tranche_2: Number(formData.t2),
      tranche_3: Number(formData.t3),
      tranche_4: Number(formData.t4),
      tranche_5: Number(formData.t5),
      t1_date: formData.t1_date || null,
      t2_date: formData.t2_date || null,
      t3_date: formData.t3_date || null,
      t4_date: formData.t4_date || null,
      t5_date: formData.t5_date || null,
      t1_timbre_amount: Number(formData.t1_timbre || 0),
      t2_timbre_amount: Number(formData.t2_timbre || 0),
      t3_timbre_amount: Number(formData.t3_timbre || 0),
      t4_timbre_amount: Number(formData.t4_timbre || 0),
      t5_timbre_amount: Number(formData.t5_timbre || 0),
      t1_medical_paid: formData.t1_medical || null,
      t2_medical_paid: formData.t2_medical || null,
      t3_medical_paid: formData.t3_medical || null,
      t4_medical_paid: formData.t4_medical || null,
      t5_medical_paid: formData.t5_medical || null,
      pratique_note: formData.pratiqueNote,
      registration_date: formData.registrationDate,
      exam_date: formData.examDate || null,
      status: formData.status || 'active'
    };

    try {
      const { error: dbError } = selectedStudentId
        ? await supabase.from(targetTable).update(payload).eq('id', selectedStudentId)
        : await supabase.from(targetTable).insert([payload]);

      if (dbError) throw dbError;

      let notifMsg = selectedStudentId
        ? `📝 ${instructorName} عدل ملف المترشح: ${formData.firstName} ${formData.lastName}`
        : (isHeavy
          ? `${instructorName} سجل تلميذ صنف Permis ${formData.licenseType}`
          : `🆕 ${instructorName} سجل مترشح جديد: ${formData.firstName} ${formData.lastName}`);

      await supabase.from('notifications').insert([{
        agence_id: agenceId,
        agency: agenceName,
        staff_name: instructorName,
        message: notifMsg,
        is_read: false,
        type: selectedStudentId ? 'STUDENT_UPDATE' : 'STUDENT_ADD',
        category: 'registration',
        created_at: new Date().toISOString()
      }]);

      await fetchStudents();
      resetForm();
      alert("تمت العملية بنجاح! ✅");
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
      setIsEditing(false);
    }
  };

  const getAgencyName = (id: string | null | undefined) => {
    if (!id) return 'Boudinar HQ';
    const a = agencies.find(a => String(a.id) === String(id));
    return a ? a.name : 'غير محدد';
  };

  const handleSaveStudentExam = async (studentId: string, updatedExamData: HeavyExamData) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const oldExamData = parseHeavyExamData(student);

      const totalFailures =
        (updatedExamData.theory_result === 'echoue' ? 1 : 0) +
        (updatedExamData.theory_result_2 === 'echoue' ? 1 : 0) +
        (updatedExamData.practical_result === 'echoue' ? 1 : 0) +
        (updatedExamData.practical_result_2 === 'echoue' ? 1 : 0);

      const isTotalFailure = totalFailures >= 2;
      const isTheoryPassed = updatedExamData.theory_result === 'admis' || updatedExamData.theory_result_2 === 'admis';
      const isPracticalPassed = updatedExamData.practical_result === 'admis' || updatedExamData.practical_result_2 === 'admis';
      const isWinner = isTheoryPassed && isPracticalPassed;

      // Sync top-level exam_date: theory_date for theory stage, practical_date if theory passed
      const examDate = isTheoryPassed
        ? (updatedExamData.practical_date || updatedExamData.theory_date || null)
        : (updatedExamData.theory_date || null);

      let examStatus = '';
      if (isWinner) {
        examStatus = 'ناجح';
      } else if (isTotalFailure) {
        examStatus = 'راسب نهائياً';
      } else if (isTheoryPassed) {
        examStatus = 'مؤجل'; // passed theory, waiting for practical
      } else if (updatedExamData.theory_result === 'echoue') {
        examStatus = 'راسب'; // failed first attempt theory
      }

      const serializedNotes = serializeHeavyExamData(student.notes, updatedExamData);

      const { error } = await supabase
        .from('truck_students')
        .update({
          exam_date: examDate,
          exam_status: examStatus || null,
          notes: serializedNotes
        })
        .eq('id', studentId);

      if (error) throw error;

      // Exact Dynamic Arabic Notification Routing
      const student_name = `${student.first_name} ${student.last_name}`;
      const licenseType = student.license_type || 'C';
      let notificationMsg = '';

      if (updatedExamData.practical_result_2 && !oldExamData.practical_result_2) {
        if (updatedExamData.practical_result_2 === 'admis') {
          notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) نجح في التطبيقي 2 - ناجح نهائياً 🎉`;
        } else {
          notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) سقط في التطبيقي 2 - راسب نهائياً ❌`;
        }
      }
      else if (updatedExamData.practical_result && !oldExamData.practical_result) {
        if (updatedExamData.practical_result === 'admis') {
          notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) نجح في التطبيقي 1 - ناجح نهائياً 🎉`;
        } else {
          if (isTotalFailure) {
            notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) رسب في التطبيقي 1 - راسب نهائياً ❌`;
          } else {
            notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) رسب في التطبيقي 1`;
          }
        }
      }
      else if (updatedExamData.theory_result_2 && !oldExamData.theory_result_2) {
        if (updatedExamData.theory_result_2 === 'admis') {
          notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) نجح في النظري 2`;
        } else {
          notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) سقط في النظري 2 - راسب نهائياً ❌`;
        }
      }
      else if (updatedExamData.theory_result && !oldExamData.theory_result) {
        if (updatedExamData.theory_result === 'admis') {
          notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) نجح في النظري 1`;
        } else {
          notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) رسب في النظري 1`;
        }
      } else {
        // General broadcast or date updates
        if (isWinner) {
          notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) ناجح نهائياً 🎉`;
        } else if (isTotalFailure) {
          notificationMsg = `المترشح ${student_name} (صنف ${licenseType}) راسب نهائياً ❌`;
        } else {
          notificationMsg = `📢 ${instructorName} حدث بيانات امتحان المترشح ${student_name}`;
        }
      }

      await supabase.from('notifications').insert([{
        agence_id: agenceId,
        agency: agenceName,
        staff_name: instructorName,
        message: notificationMsg,
        is_read: false,
        type: 'STUDENT_UPDATE',
        category: 'exams',
        created_at: new Date().toISOString()
      }]);

      await fetchStudents();
      alert("تم حفظ بيانات الامتحان بنجاح! ✅");
    } catch (err: any) {
      alert("خطأ أثناء حفظ الامتحان: " + err.message);
      throw err;
    }
  };

  // 🚀 المسمار: ترتيب الطلبة حسب التاريخ للطباعة (مفلتر بـ الشهر اللي فـ الـ Header)
  const sortedStudentsForPrint = useMemo(() => {
    const selMonth = selectedDate.getMonth();
    const selYear = selectedDate.getFullYear();

    return students
      .filter(s => {
        if (!s.exam_date || s.exam_date.trim() === '') return false;
        const d = new Date(s.exam_date);
        return d.getMonth() === selMonth && d.getFullYear() === selYear;
      })
      .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime());
  }, [students, selectedDate]);

  // 📸 دالة رفع الصور المحدثة لتتوافق مع المصفوفة المتراكمة (File[])
  const uploadFleetImages = async (files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { data } = await supabase.storage
        .from('vehicle-photos')
        .upload(fileName, file);

      if (data) {
        const { data: pub } = supabase.storage
          .from('vehicle-photos')
          .getPublicUrl(fileName);

        if (pub?.publicUrl) {
          urls.push(pub.publicUrl);
        }
      }
    }
    return urls;
  };

  const handleFleetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (fleetFormData.action_type === 'handover') {
        // 📸 1. رفع صور التسليم أولاً وجلب الروابط من دالة النظري
        const uploadedHandoverUrls = await uploadFleetImages(fleetImages);

        // 🧱 2. تحويل الروابط لـ صيغة JSON النصية المفرزة
        const handoverMapped = uploadedHandoverUrls.map(url => JSON.stringify({ type: 'handover', url: url }));

        // 📥 3. إدخال سطر جديد مفتوح مع صور التسليم ف الـ images_urls
        const { error } = await supabase.from('fleet_operations').insert([{
          vehicle_name: fleetFormData.vehicle_name,
          action_type: 'handover',
          operator_name: instructorName,
          counterparty_name: fleetFormData.counterparty_name,
          log_date: fleetFormData.log_date,
          log_time: fleetFormData.log_time,
          km_reading: Number(fleetFormData.km_reading),
          status: 'open',
          images_urls: handoverMapped
        }]);
        if (error) throw error;

      } else {
        // 🔍 1. جلب السطر المفتوح باش نقرأو الصور د التسليم لي تسجلو ف اللول
        const { data: openRow, error: fetchErr } = await supabase.from('fleet_operations')
          .select('*')
          .eq('vehicle_name', fleetFormData.vehicle_name)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchErr || !openRow) {
          throw new Error("لا توجد عملية تسليم مفتوحة لهذه السيارة لتسجيل إرجاعها.");
        }

        // 📸 2. رفع صور الإرجاع دابا
        const uploadedReturnUrls = await uploadFleetImages(fleetImages);

        // 🧱 3. تحويل روابط الإرجاع لـ صيغة JSON النصية
        const returnMapped = uploadedReturnUrls.map(url => JSON.stringify({ type: 'return', url: url }));

        // 🔀 4. دمج صور التسليم القدام (إيلا كانوا) مع صور الإرجاع الجداد ف مصفوفة واحدة
        const existingImages = openRow.images_urls || [];
        const finalCombinedImages = [...existingImages, ...returnMapped];

        // 📏 5. حساب المسافة المقطوعة أوتوماتيكياً
        const distance = Number(fleetFormData.km_reading) - Number(openRow.km_reading);

        // 📤 6. تحديث السطر وإغلاقه بـ الأمان التام
        const { error: updateErr } = await supabase.from('fleet_operations')
          .update({
            log_date_return: fleetFormData.log_date,
            log_time_return: fleetFormData.log_time,
            km_reading_return: Number(fleetFormData.km_reading),
            fuel_expenses: Number(fleetFormData.fuel_expenses) || 0,
            images_urls: finalCombinedImages,
            distance_traveled: distance,
            status: 'closed'
          })
          .eq('id', openRow.id);

        if (updateErr) throw updateErr;
      }

      // 🔗 الفرز الصارم والمطابق بـ الفرنسي 100% مع قاعدة البيانات لمنع التداخل
      let agencyVal = 'Boudinar';
      if (fleetFormData.vehicle_name.includes('Clio')) agencyVal = 'Krona';
      else if (fleetFormData.vehicle_name.includes('Opel')) agencyVal = 'Tazaghine';
      else if (fleetFormData.vehicle_name.includes('Dacia')) agencyVal = 'Azghar';
      else if (fleetFormData.vehicle_name.includes('Peugeot')) agencyVal = 'Boudinar';
      // 🌟 مسمار الهيبة: ربط سيارة Mercedes 190 بـ مؤسسة بودينار نيشان ف الجرس والإشعارات
      else if (fleetFormData.vehicle_name.includes('Mercedes 190')) agencyVal = 'Boudinar';

      // 📥 صياغة الميساج د الإشعار بالعربي والسمية د الطوموبيل واضحة
      const notifMsg = fleetFormData.action_type === 'handover'
        ? `📥 تم تسليم سيارة: ${fleetFormData.vehicle_name}`
        : `📤 تم إرجاع سيارة: ${fleetFormData.vehicle_name}`;

      // 🔔 إرسال الإشعار لجدول سوبابيز بالـ Agency بـ الفرنسي لإشعال الجرس المفرز
      await supabase.from('fleet_operations_notifications').insert([{
        agency: agencyVal,
        vehicle_name: fleetFormData.vehicle_name,
        message: notifMsg,
        is_read: false
      }]);

      alert('✅ تم تسجيل العملية بنجاح');
      setIsFleetModalOpen(false);

      // إعادة تعيين الفورم إلى الحالة الافتراضية
      setFleetFormData({
        action_type: 'handover',
        vehicle_name: 'Peugeot',
        counterparty_name: '',
        log_date: new Date().toISOString().split('T')[0],
        log_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        km_reading: '',
        fuel_expenses: '',
      });
      setFleetImages([]);

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredHeavyStudents = useMemo(() => {
    return students
      .filter(s => s.license_type && s.license_type !== 'B')
      .filter(s => s.exam_date && s.exam_date.trim() !== '')
      .filter(s => {
        if (!examSearchTerm) return true;
        const term = examSearchTerm.toLowerCase();
        return (
          (s.first_name || '').toLowerCase().includes(term) ||
          (s.last_name || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime());
  }, [students, examSearchTerm]);

  return (
    <div className="min-h-screen w-full bg-[#F4F7F5] flex flex-col font-black italic uppercase tracking-tighter" dir="rtl">

      <TheorieHeader
        students={students}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      <main className="flex-1 p-4 md:p-8">
        {/* Toggle Menu */}
        <div className="max-w-md mx-auto mt-24 md:mt-12 mb-8 px-4">
          <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-full border border-slate-200/50 shadow-sm flex items-center justify-between">
            <button
              onClick={() => setActivePanel('registration')}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-full text-[11px] transition-all font-black ${activePanel === 'registration'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-50'
                }`}
            >
              <User size={14} />
              تسجيل المترشحين
            </button>
            <button
              onClick={() => setActivePanel('exams')}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-full text-[11px] transition-all font-black ${activePanel === 'exams'
                ? 'bg-[#0F5A3E] text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-50'
                }`}
            >
              <CheckCircle2 size={14} />
              إدارة الامتحانات
            </button>
          </div>
        </div>

        {activePanel === 'registration' ? (
          <>
            <div className="max-w-6xl mx-auto mb-10 px-4">
              <div className="text-center mb-8 flex flex-col md:flex-row justify-center items-center gap-4">
                <span className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                  وكالة: {agenceName} | المسئول: {instructorName}
                </span>
                <button
                  onClick={() => setIsFleetModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-1.5 rounded-full text-xs font-black transition-colors border border-slate-200 shadow-sm"
                >
                  <ClipboardList size={14} />
                  <span>📋 طلب تسليم أو إرجاع سيارة</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-4">
                <div className="flex justify-center w-full">
                  <PdfButton
                    students={students}
                    agenceName={agenceName}
                    selectedDate={selectedDate}
                  />
                </div>
                <div className="flex justify-center w-full">
                  <MedicalTimbreButton
                    students={students}
                    agenceName={agenceName}
                    selectedDate={selectedDate}
                  />
                </div>
                <div className="flex justify-center w-full">
                  <ExamScheduleButton
                    students={students}
                    agenceName={agenceName}
                    selectedDate={selectedDate}
                  />
                </div>
                <div className="flex justify-center w-full">
                  <button
                    onClick={() => {
                      setSelectedPrintType('B');
                      setIsPrintModalOpen(true);
                    }}
                    className="w-full bg-slate-900 text-white h-[45px] px-4 rounded-xl text-[10px] font-black shadow-lg hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2 border-2 border-slate-900"
                  >
                    <Printer size={14} /> استخراج النتائج (PDF)
                  </button>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto">
              <TheorieForm
                key={selectedStudentId || 'new'}
                formData={formData}
                setFormData={(val) => {
                  setIsEditing(true);
                  setFormData(val);
                }}
                handleSubmit={handleSubmit}
                loading={loading}
                students={students}
                setSelectedStudentId={setSelectedStudentId}
              />
            </div>
          </>
        ) : (
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-[35px] p-6 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  🚛 إدارة امتحانات الوزن الثقيل (A, C, D, E)
                </h2>
                <div className="relative w-full md:w-80">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="بحث عن مترشح..."
                    value={examSearchTerm}
                    onChange={(e) => setExamSearchTerm(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-full py-2.5 pr-10 pl-4 outline-none text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0F5A3E] transition-all text-right"
                    style={{ color: '#0f172a', fontWeight: 900, caretColor: '#0F5A3E' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHeavyStudents.length > 0 ? (
                  filteredHeavyStudents.map((student) => (
                    <StudentExamCard
                      key={student.id}
                      student={student}
                      onSave={handleSaveStudentExam}
                      getAgencyName={getAgencyName}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <CheckCircle2 size={40} className="text-slate-300 mb-4" />
                    <p className="text-slate-400 italic">لا توجد امتحانات مبرمجة حالياً</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fleet Operations Modal */}
      {isFleetModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800">📋 طلب تسليم أو إرجاع سيارة</h2>
              <button
                type="button"
                onClick={() => {
                  setIsFleetModalOpen(false);
                  setFleetImages([]); // تنظيف كاش الصور عند القفل
                }}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFleetSubmit} className="space-y-5">
              {/* Toggle Action Type */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setFleetFormData({ ...fleetFormData, action_type: 'handover' });
                    setFleetImages([]); // تنظيف الصور عند التبديل
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${fleetFormData.action_type === 'handover' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  📥 تسليم
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFleetFormData({ ...fleetFormData, action_type: 'return' });
                    setFleetImages([]); // تنظيف الصور عند التبديل
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${fleetFormData.action_type === 'return' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  📤 إرجاع
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">السيارة</label>
                  <select required value={fleetFormData.vehicle_name} onChange={(e) => setFleetFormData({ ...fleetFormData, vehicle_name: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-300">
                    <option value="Peugeot">Peugeot</option>
                    <option value="Dacia">Dacia</option>
                    <option value="Clio">Clio</option>
                    <option value="Opel">Opel</option>
                    <option value="Mercedes 190">Mercedes 190</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">الطرف المستلم للسيارة</label>
                  <input type="text" required value={fleetFormData.counterparty_name} onChange={(e) => setFleetFormData({ ...fleetFormData, counterparty_name: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-300" placeholder="مثال: حمزة، يوسف..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">التاريخ</label>
                  <input type="date" required value={fleetFormData.log_date} onChange={(e) => setFleetFormData({ ...fleetFormData, log_date: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-300" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">الوقت</label>
                  <input type="time" required value={fleetFormData.log_time} onChange={(e) => setFleetFormData({ ...fleetFormData, log_time: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-300" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">الكيلومتراج (KM)</label>
                  <input type="number" required value={fleetFormData.km_reading} onChange={(e) => setFleetFormData({ ...fleetFormData, km_reading: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-300" placeholder="0" />
                </div>

                {/* ⛽ مصاريف الوقود: كتطلع غي ف حالة الإرجاع بوحدها */}
                {fleetFormData.action_type === 'return' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">مصاريف الوقود (DH)</label>
                    <input type="number" required value={fleetFormData.fuel_expenses} onChange={(e) => setFleetFormData({ ...fleetFormData, fuel_expenses: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-300" placeholder="0" />
                  </div>
                )}

                {/* 📸 صور السيارة مفرزة للعموم: كتطلع ف التسليم والإرجاع بـ زوج ف دقة واحدة */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    📸 صور السيارة ({fleetFormData.action_type === 'handover' ? 'حالة التسليم' : 'حالة الإرجاع'})
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files);
                        setFleetImages((prev) => [...prev, ...newFiles]);
                      }
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                  />

                  {/* 📊 بادج الحساب الذكي */}
                  {fleetImages.length > 0 && (
                    <p className="text-[10px] font-black text-emerald-600 mt-1 bg-emerald-50 px-2 py-1 rounded-lg inline-block border border-emerald-100">
                      📊 تم اختيار {fleetImages.length} صور بنجاح.
                    </p>
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white rounded-xl py-3.5 text-sm font-black mt-2 hover:bg-slate-800 transition-colors disabled:opacity-50">
                {loading ? 'جاري الحفظ والرفع...' : '✅ تأكيد العملية'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Print Selection Modal */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm border border-slate-100"
              dir="rtl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Printer size={18} className="text-[#0F5A3E]" /> طباعة النتائج
                </h3>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-4 font-bold">
                اختر صنف الرخصة المراد طباعة تقريرها:
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {['B', 'C', 'D', 'E', 'A'].map((type) => {
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedPrintType(type)}
                      className={`h-12 rounded-xl border-2 text-sm font-black transition-all flex items-center justify-center gap-2 ${selectedPrintType === type
                        ? 'border-[#0F5A3E] bg-emerald-50 text-[#0F5A3E]'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                    >
                      Permis {type}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  const filtered = sortedStudentsForPrint.filter(s => (s.license_type || 'B') === selectedPrintType);
                  generateDetailedExamsPrint(filtered, examResults, agenceName, selectedDate);
                  setIsPrintModalOpen(false);
                }}
                className="w-full bg-[#0F5A3E] text-white h-12 rounded-xl text-sm font-black shadow-lg hover:bg-emerald-800 transition-all flex items-center justify-center gap-2"
              >
                تأكيد وطباعة
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
