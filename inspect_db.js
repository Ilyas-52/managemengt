const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: stdData, error: stdError } = await supabase
    .from('students')
    .select('*')
    .limit(1);

  if (stdError) console.error("students fetch error:", stdError);
  else console.log("students row sample:", stdData[0]);

  const { data: examData, error: examError } = await supabase
    .from('exam_results')
    .select('*')
    .limit(1);

  if (examError) console.error("exam_results fetch error:", examError);
  else console.log("exam_results row sample:", examData[0]);
}

main();
