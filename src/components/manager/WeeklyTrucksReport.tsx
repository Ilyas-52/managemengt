export const generateWeeklyBilan = (students: any[], agencyName: string = 'Boudinar') => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyData = students.filter(s => new Date(s.created_at) >= oneWeekAgo);

    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }

    const htmlContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 15px;">
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #0f5a3e;">Auto Ecole ${agencyName} - التقرير الشامل</h2>
                <p style="font-size: 10px;">الفترة: من ${oneWeekAgo.toLocaleDateString('ar-MA')} إلى ${new Date().toLocaleDateString('ar-MA')}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="border: 1px solid #000; padding: 5px;">المترشح</th>
                        <th style="border: 1px solid #000; padding: 5px;">التسجيل</th>
                        <th style="border: 1px solid #000; padding: 5px;">الصنف/المكان</th>
                        <th style="border: 1px solid #000; padding: 5px;">T1</th>
                        <th style="border: 1px solid #000; padding: 5px;">T2</th>
                        <th style="border: 1px solid #000; padding: 5px;">T3</th>
                        <th style="border: 1px solid #000; padding: 5px;">T4</th>
                        <th style="border: 1px solid #000; padding: 5px;">T5</th>
                        <th style="border: 1px solid #000; padding: 5px;">TB</th>
                        <th style="border: 1px solid #000; padding: 5px;">VM</th>
                        <th style="border: 1px solid #000; padding: 5px;">الامتحان</th>
                        <th style="border: 1px solid #000; padding: 5px;">المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${weeklyData.map(s => {
        const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);

        // الخطة ديالك أ با يونس: الصنف A ديما "مؤسسة يونس"
        // الأصناف الأخرى على حساب شنو مسجل
        let finalLocation = '';
        if (s.license_type === 'A') {
            finalLocation = 'مؤسسة يونس';
        } else {
            finalLocation = s.training_location === 'lboubsi' ? 'البوبسي' :
                s.training_location === 'sa3lity' ? 'السعليتي' :
                    s.training_location === 'YOUNESS' ? 'مؤسسة يونس' : 'غـير محدد';
        }

        const regDate = s.registration_date ? new Date(s.registration_date).toLocaleDateString('fr-FR') : '--';
        const examDate = s.exam_date ? new Date(s.exam_date).toLocaleDateString('fr-FR') : '--';
        return `
                            <tr>
                                <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">${s.first_name} ${s.last_name}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${regDate}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                    <strong>${s.license_type}</strong> - ${finalLocation}
                                </td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.t1 || '-'}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.t2 || '-'}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.t3 || '-'}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.t4 || '-'}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.t5 || '-'}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.paid_timbre_in ? '✓' : '-'}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.paid_medical_in ? '✓' : '-'}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${examDate}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; background: #f8fafc;">${paid} DH</td>
                                

                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
        <html dir="rtl">
            <head><meta charset="UTF-8"></head>
            <body>
                ${htmlContent}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                        }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    doc.close();
};