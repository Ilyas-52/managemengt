'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PracticalTerminal from '@/components/terminals/PracticalTerminal';

export default function BelkassmiPage() {
    const [userData, setUserData] = useState<{ agence_id: string, agence_name: string } | null>(null);

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // كنجبدو الـ ID ديال وكالة تزغين من الميتادات
                const agenceId = user.user_metadata.agence_id;

                // جلب اسم الوكالة (Tazaghine) للعرض
                const { data: agenceData } = await supabase
                    .from('agencies')
                    .select('name')
                    .eq('id', agenceId)
                    .single();

                setUserData({
                    agence_id: agenceId,
                    agence_name: agenceData?.name || 'Tazaghine'
                });
            }
        };
        getData();
    }, []);

    if (!userData) return <div className="min-h-screen flex items-center justify-center font-black italic">جاري تحميل البيانات...</div>;

    return (
        <PracticalTerminal
            // هاد السمية هي اللي غادي تطلع فـ السيستيم فـ خانة الـ instructor_name
            instructorName="belkassmi"
            agenceId={userData.agence_id}
            agenceName={userData.agence_name}
            selectedAgency={null}
        />
    );
}