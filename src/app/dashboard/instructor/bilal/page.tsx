'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PracticalTerminal from '@/components/terminals/PracticalTerminal';

export default function BilalPage() {
    const [userData, setUserData] = useState<{ agence_id: string, agence_name: string } | null>(null);

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const agenceId = user.user_metadata.agence_id;
                // Fetch agence name for display
                const { data: agenceData } = await supabase.from('agencies').select('name').eq('id', agenceId).single();
                setUserData({
                    agence_id: agenceId,
                    agence_name: agenceData?.name || 'Krona'
                });
            }
        };
        getData();
    }, []);

    if (!userData) return <div className="min-h-screen flex items-center justify-center font-black italic">جاري تحميل البيانات...</div>;

    return (
        <PracticalTerminal
            instructorName="Bilal"
            agenceId={userData.agence_id}
            agenceName={userData.agence_name}
            selectedAgency={null}
        />
    );
}
