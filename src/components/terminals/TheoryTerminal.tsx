'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import TheorieHeader from '@/components/theorie/TheorieHeader';
import { Printer } from 'lucide-react';
import dynamic from 'next/dynamic';

const PdfButton = dynamic(() => import('@/components/theorie/trancheButton'), {
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
  t1_medical_paid?: boolean | null;
  t2_medical_paid?: boolean | null;
  t3_medical_paid?: boolean | null;
  t4_medical_paid?: boolean | null;
  t5_medical_paid?: boolean | null;
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

export default function TheoryTerminal({ instructorName, agenceId, agenceName }: TheoryTerminalProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const isSubmitting = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  // 1. زيد هاد السطر وسط الكومبوننت TheorieTerminal
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState<TheoryFormData>({
    firstName: '',
    lastName: '',
    totalPrice: '',
    t1: '', t2: '', t3: '', t4: '', t5: '',
    t1_date: null, t2_date: null, t3_date: null, t4_date: null, t5_date: null,
    t1_timbre: 0, t2_timbre: 0, t3_timbre: 0, t4_timbre: 0, t5_timbre: 0,
    t1_medical: false, t2_medical: false, t3_medical: false, t4_medical: false, t5_medical: false,
    pratiqueNote: '',
    registrationDate: new Date().toISOString().split('T')[0],
    examDate: '',
    licenseType: 'B',
    trainingLocation: 'lboubsi',
    paidTimbreIn: 0,
    paidMedicalIn: 0,
    notes: ''
  });

  const fetchStudents = async () => {
    try {
      const [stRes, truckRes, examRes] = await Promise.all([
        supabase.from('students').select('*').eq('agence_id', agenceId).order('created_at', { ascending: false }),
        supabase.from('truck_students').select('*').eq('agence_id', agenceId).order('created_at', { ascending: false }),
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
      t1_medical: false, t2_medical: false, t3_medical: false, t4_medical: false, t5_medical: false,
      pratiqueNote: '',
      registrationDate: new Date().toISOString().split('T')[0],
      examDate: '',
      licenseType: 'B',
      trainingLocation: 'lboubsi',
      paidTimbreIn: 0,
      paidMedicalIn: 0,
      notes: ''
    });
  };

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
        t1_medical: isHeavy ? false : (s.t1_medical_paid || false),
        t2_medical: isHeavy ? false : (s.t2_medical_paid || false),
        t3_medical: isHeavy ? false : (s.t3_medical_paid || false),
        t4_medical: isHeavy ? false : (s.t4_medical_paid || false),
        t5_medical: isHeavy ? false : (s.t5_medical_paid || false),
        pratiqueNote: s.pratique_note || '',
        registrationDate: s.registration_date ? s.registration_date.split('T')[0] : '',
        examDate: s.exam_date || '',
        licenseType: s.license_type || 'B',
        trainingLocation: s.training_location || 'lboubsi',
        paidTimbreIn: s.paid_timbre_in || 0,
        paidMedicalIn: s.paid_medical_in || 0,
        notes: s.notes || ''
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
      training_location: formData.trainingLocation,
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
      t5_date: formData.t5_date || null
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
      t1_medical_paid: formData.t1_medical || false,
      t2_medical_paid: formData.t2_medical || false,
      t3_medical_paid: formData.t3_medical || false,
      t4_medical_paid: formData.t4_medical || false,
      t5_medical_paid: formData.t5_medical || false,
      pratique_note: formData.pratiqueNote,
      registration_date: formData.registrationDate,
      exam_date: formData.examDate || null
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

  return (
    <div className="min-h-screen w-full bg-[#F4F7F5] flex flex-col font-black italic uppercase tracking-tighter" dir="rtl">

      <TheorieHeader
        students={students}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
        selectedDate={selectedDate} // 🚀 مسمار جديد
        setSelectedDate={setSelectedDate} // 🚀 مسمار جديد
      />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto mt-24 md:mt-12 mb-10 px-4">
          <div className="text-center mb-8">
            <span className="bg-emerald-100 text-emerald-800 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              وكالة: {agenceName} | المسئول: {instructorName}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-4">
            <div className="flex justify-center w-full">
              <PdfButton
                students={students}
                agenceName={agenceName}
                selectedDate={selectedDate} // 🚀 مرر الساروت
              />
            </div>
            <div className="flex justify-center w-full">
              <MedicalTimbreButton
                students={students}
                agenceName={agenceName}
                selectedDate={selectedDate} // 🚀 مرر الساروت
              />
            </div>
            <div className="flex justify-center w-full">
              <ExamScheduleButton
                students={students}
                agenceName={agenceName}
                selectedDate={selectedDate} // 🚀 مرر الساروت
              />
            </div>
            <div className="flex justify-center w-full">
              <button
                onClick={() => generateDetailedExamsPrint(sortedStudentsForPrint, examResults, agenceName, selectedDate)}
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
          />
        </div>
      </main >
    </div >
  );
}
