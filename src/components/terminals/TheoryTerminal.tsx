'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import TheorieHeader from '@/components/theorie/TheorieHeader';
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
    examDate: ''
  });

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('agence_id', agenceId)
      .order('created_at', { ascending: false });

    if (error) console.error("❌ Error fetching students:", error.message);
    if (data) setStudents(data as Student[]);
  };

  useEffect(() => {
    setStudents([]); // 🧹 Clear state before fetching
    fetchStudents();
    const channel = supabase.channel(`students-${agenceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'students',
        filter: `agence_id=eq.${agenceId}`
      }, () => {
        fetchStudents();
      }).subscribe();
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
      examDate: ''
    });
  };

  useEffect(() => {
    if (isEditing || isSubmitting.current) return;
    const s = students.find(st => String(st.id) === String(selectedStudentId));
    if (selectedStudentId && s) {
      setFormData({
        firstName: s.first_name || '',
        lastName: s.last_name || '',
        totalPrice: s.total_price || '',
        t1: s.tranche_1 || '',
        t2: s.tranche_2 || '',
        t3: s.tranche_3 || '',
        t4: s.tranche_4 || '',
        t5: s.tranche_5 || '',
        t1_date: s.t1_date || null,
        t2_date: s.t2_date || null,
        t3_date: s.t3_date || null,
        t4_date: s.t4_date || null,
        t5_date: s.t5_date || null,
        t1_timbre: Number(s.t1_timbre_amount) || 0,
        t2_timbre: Number(s.t2_timbre_amount) || 0,
        t3_timbre: Number(s.t3_timbre_amount) || 0,
        t4_timbre: Number(s.t4_timbre_amount) || 0,
        t5_timbre: Number(s.t5_timbre_amount) || 0,
        t1_medical: s.t1_medical_paid || false,
        t2_medical: s.t2_medical_paid || false,
        t3_medical: s.t3_medical_paid || false,
        t4_medical: s.t4_medical_paid || false,
        t5_medical: s.t5_medical_paid || false,
        pratiqueNote: s.pratique_note || '',
        registrationDate: s.registration_date ? s.registration_date.split('T')[0] : '',
        examDate: s.exam_date || ''
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

    const payload = {
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
        ? await supabase.from('students').update(payload).eq('id', selectedStudentId)
        : await supabase.from('students').insert([payload]);

      if (dbError) throw dbError;

      let notifMsg = selectedStudentId
        ? `📝 ${instructorName} عدل ملف المترشح: ${formData.firstName} ${formData.lastName}`
        : `🆕 ${instructorName} سجل مترشح جديد: ${formData.firstName} ${formData.lastName}`;

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-4">
            <div className="flex justify-center lg:justify-start w-full">
              <PdfButton
                students={students}
                agenceName={agenceName}
                selectedDate={selectedDate} // 🚀 مرر الساروت
              />            </div>
            <div className="flex justify-center w-full">
              <MedicalTimbreButton
                students={students}
                agenceName={agenceName}
                selectedDate={selectedDate} // 🚀 مرر الساروت
              />
            </div>
            <div className="flex justify-center lg:justify-end w-full">
              <ExamScheduleButton
                students={students}
                agenceName={agenceName}
                selectedDate={selectedDate} // 🚀 مرر الساروت
              />
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
