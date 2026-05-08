const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hvrcqvahbuokdyxukmnn.supabase.co';
const supabaseKey = 'sb_publishable_Xm0ZAAuSEtoPVHapQOfAgA_-pwbGfwF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding Instructor Data...');

  // 1. Get Agencies
  const { data: agencies, error: aErr } = await supabase.from('agencies').select('id, name');
  if (aErr) throw aErr;
  
  const getAgID = (name) => agencies.find(a => a.name.includes(name))?.id;
  
  const mapping = [
    { email: 'hamza@ecole.com', agId: '95d03e6f-e1ed-4328-8b13-f9aac2dfe846', specialty: 'theory' },
    { email: 'mohammed@ecole.com', agId: 'a3189732-947f-4358-bb5f-e07e4b99871f', specialty: 'theory' },
    { email: 'mohammadi@ecole.com', agId: '80edd0b9-17d4-49a5-bf91-a5796a56b540', specialty: 'theory' },
    { email: 'zakariae@ecole.com', agId: '3d926f56-357a-4703-9064-b712822b61b5', specialty: 'theory' },
  ];

  for (const m of mapping) {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .update({ 
        agency_id: m.agId, 
        specialty: m.specialty 
      })
      .eq('full_name', m.email)
      .select('full_name');

    if (pErr) {
      console.error(`Error updating ${m.email}:`, pErr);
    } else if (profile.length > 0) {
      console.log(`Updated ${profile[0].full_name} to agency ${m.agId} with ${m.specialty}`);
    } else {
      console.log(`Instructor ${m.email} not found`);
    }
  }

  console.log('Done!');
}

seed().catch(console.error);
