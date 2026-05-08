import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
    // We can't easily list users from the client SDK, but we can check notifications or other tables where staff_name/role might be stored
    // Actually, let's check the 'agencies' table just to be sure we're connected
    const { data: agencies } = await supabase.from('agencies').select('*');
    console.log('Agencies:', agencies);
    
    // Check notifications for staff_name usage
    const { data: notifs } = await supabase.from('notifications').select('staff_name').limit(10);
    console.log('Sample Staff Names from Notifs:', notifs);
}

checkRoles();
