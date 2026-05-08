// 📄 src/components/manager/PrintDetailedResults.tsx
import { ExamResult } from '@/types/dashboard';

export const generateDetailedExamsPrint = (students: any[], examResults: any[]) => {
    // ✅ المسمار: كرينا Iframe مخفي فـ بلاصة window.open باش يهرب من بلوكاج Android و Honor
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const printWindow = iframe.contentWindow;

    if (!printWindow) return;

    // 📅 مسمار التوقيت الأوتوماتيكي
    const currentDate = new Date();
    const monthNames = [
        "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو",
        "يوليوز", "غشت", "شتنبر", "أكتوبر", "نوفمبر", "دجنبر"
    ];
    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    const rows = students.map(student => {
        const name = `${student.first_name} ${student.last_name}`;
        const r = examResults.find(res => res.student_name === name) || {} as Partial<ExamResult>;

        const passT1 = r.theory_result === 'admis';
        const failT1 = r.theory_result === 'echoue';
        const passT2 = r.theory_result_2 === 'admis';
        const failT2 = r.theory_result_2 === 'echoue';

        const passP1 = r.practical_result === 'admis';
        const failP1 = r.practical_result === 'echoue';
        const passP2 = r.practical_result_2 === 'admis';

        // 🛡️ Logic الحصيلة "البيطوني" (نفسه بلا تغيير)
        let status = "---";
        if (passT1 && passP1) {
            status = "ناجح في الامتحان 01";
        } else if (failT1 && passT2 && passP1) {
            status = "ناجح في الامتحان 01";
        } else if (passT1 && failP1 && passP2) {
            status = "ناجح في الامتحان 02";
        } else if (failT2 || (failT1 && passT2 && failP1)) {
            status = "راسب نهائياً";
        } else if (passT1 || passT2) {
            status = "في الانتظار (تطبيقي)";
        }

        return `
            <tr>
                <td class="student-name">${name}</td>
                <td class="cell">${passT1 ? '✓' : failT1 ? 'X' : '-'}</td>
                <td class="cell">${passP1 ? '✓' : failP1 ? 'X' : '-'}</td>
                <td class="cell">${passT2 ? '✓' : failT2 ? 'X' : '-'}</td>
                <td class="cell">${passP2 ? '✓' : r.practical_result_2 === 'echoue' ? 'X' : '-'}</td>
                <td class="status-cell" style="${status === 'راسب نهائياً' ? 'color: red; font-weight: 900;' : ''}">
                    ${status}
                </td>
            </tr>
        `;
    }).join('');

    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>نتائج الامتحان - ${currentMonth} ${currentYear}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
                body { font-family: 'Tajawal', sans-serif; padding: 30px; background: white; }
                .main-header { text-align: center; margin-bottom: 25px; }
                .main-header h1 { border-bottom: 3px solid #000; display: inline-block; padding-bottom: 5px; font-size: 26px; font-weight: 900; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 2px solid #000; padding: 10px; text-align: center; font-size: 13px; }
                
                .header-row th { background-color: #f8f9fa; font-weight: 900; }
                .student-name { text-align: right; width: 220px; font-weight: 900; padding-right: 15px; }
                .cell { font-size: 18px; font-weight: 900; width: 70px; }
                .status-cell { font-weight: 700; width: 180px; }
                
                .footer { margin-top: 30px; text-align: left; font-size: 11px; font-weight: 900; border-top: 1px solid #000; padding-top: 10px; }
                @media print { body { padding: 10px; } }
            </style>
        </head>
        <body>
            <div class="main-header">
                <h1>نتائج الامتحان لشهر ${currentMonth} ${currentYear}</h1>
            </div>

            <table>
                <thead>
                    <tr class="header-row">
                        <th rowspan="2">الأسماء</th>
                        <th colspan="2">الامتحان الأول</th>
                        <th colspan="2">الامتحان الثاني</th>
                        <th rowspan="2">الحصيلة</th>
                    </tr>
                    <tr class="header-row">
                        <th>نظري</th>
                        <th>تطبيقي</th>
                        <th>نظري</th>
                        <th>تطبيقي</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="footer">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-MA')}</div>

            <script>
                window.onload = () => {
                    setTimeout(() => { 
                        window.print(); 
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();

    // مسح الـ Iframe باش السيستيم يبقى خفيف
    iframe.onload = () => {
        setTimeout(() => {
            // document.body.removeChild(iframe); 
        }, 2000);
    };
};