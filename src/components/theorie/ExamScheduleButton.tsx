'use client';
import { ClipboardList } from 'lucide-react';
declare module 'html2pdf.js';

interface Props {
  students: any[];
  agenceName?: string;
  selectedDate: Date; // 🚀 هادا هو الساروت اللي غايخلي البوطون يشوف لقدام ولور
}

export default function ExamScheduleButton({
  students,
  agenceName = 'Boudinar',
  selectedDate // 🚀 زيدها هنايا
}: Props) {
  const downloadMonthlyExamReport = async () => {
    const html2pdf = (await import('html2pdf.js')).default;

    const now = selectedDate;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. الفلترة: كنجيبو غير اللي عندهم امتحان هاد الشهر (نفس الـ Logic ديالك)
    const monthlyExams = students
      .filter(s => {
        if (!s.exam_date) return false;
        const examDate = new Date(s.exam_date);
        return examDate.getMonth() === currentMonth && examDate.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());

    // 2. تصميم اللائحة (نفس الـ HTML ديالك بلا تغيير)
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif; direction: rtl; text-align: center; width: 100%;">
        <h1 style="font-size: 28px; margin-bottom: 5px; color: #000;">لائحة مواعيد الامتحانات - ${agenceName}</h1>
        <p style="font-size: 18px; margin-bottom: 40px; color: #333;">شهر: ${now.toLocaleString('ar-MA', { month: 'long' })} ${currentYear}</p>
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 15px; border: 2px solid #000; text-align: right; width: 65%; font-size: 18px;">اسم المترشح</th>
              <th style="padding: 15px; border: 2px solid #000; text-align: center; width: 35%; font-size: 18px;">تاريخ الامتحان</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyExams.length > 0 ? monthlyExams.map(item => `
              <tr style="height: 60px;">
                <td style="padding: 15px; border: 2px solid #000; text-align: right; font-weight: bold; font-size: 18px;">
                  ${item.first_name || item.firstName} ${item.last_name || item.lastName}
                </td>
                <td style="padding: 15px; border: 2px solid #000; text-align: center; font-weight: bold; font-size: 18px;">
                  ${new Date(item.exam_date).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            `).join('') : `<tr><td colspan="2" style="padding: 50px; text-align: center; font-size: 20px;">لا توجد مواعيد مسجلة</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    const opt = {
      margin: 0.2,
      filename: `examens-${agenceName.toLowerCase()}-${now.getMonth() + 1}-${currentYear}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // ✅ المسمار الحقيقي للأندرويد:
    // بلاصة .save() نيشان، غانديرو .output('bloburl') باش يتحل ف Tab جديدة
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // @ts-ignore
      html2pdf().from(element).set(opt).output('bloburl').then((pdfUrl: string) => {
        window.open(pdfUrl, '_blank');
      });
    } else {
      // @ts-ignore
      html2pdf().from(element).set(opt).save();
    }
  };

  return (
    <button
      type="button"
      onClick={downloadMonthlyExamReport}
      className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 transition-all font-black shadow-lg active:scale-95 group"
    >
      <ClipboardList size={20} className="group-hover:rotate-6 transition-transform" />
      <span>لائحة مواعيد الامتحانات (شهري)</span>
    </button>
  );
}