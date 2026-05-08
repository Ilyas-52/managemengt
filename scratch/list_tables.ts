import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    // There is no direct "list tables" in PostgREST, but we can try common names
    const tables = ['agencies', 'students', 'notifications', 'weekly_schedules', 'lesson_attendance'];
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`Table ${table}: ${error ? 'Error: ' + error.message : count + ' rows'}`);
    }
}

listTables();
