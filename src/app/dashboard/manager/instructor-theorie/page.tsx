'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TheoryTerminal from '@/components/terminals/TheoryTerminal';

export default function YoussefPage() {
    const [userData, setUserData] = useState<{ agence_id: string, agence_name: string } | null>(null);

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const agenceId = user.user_metadata.agence_id;
                const { data: agenceData } = await supabase.from('agencies').select('name').eq('id', agenceId).single();
                setUserData({ 
                    agence_id: agenceId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Default to Boudinar if missing
                    agence_name: agenceData?.name || 'Boudinar' 
                });
            }
        };
        getData();
    }, []);

    if (!userData) return <div className="min-h-screen flex items-center justify-center font-black italic">جاري تحميل البيانات...</div>;

    const instructorName = userData.agence_name === 'Krona' ? 'Mohammed' : 'Youssef';

    return (
        <TheoryTerminal 
            instructorName={instructorName} 
            agenceId={userData.agence_id} 
            agenceName={userData.agence_name} 
        />
    );
}