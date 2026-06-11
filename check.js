require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('fleet_operations').insert([{ 
    vehicle_name: 'test', 
    action_type: 'handover', 
    images_urls: ['{"type":"handover","url":"url1"}'] 
}]).then(res => console.log(JSON.stringify(res, null, 2)));
