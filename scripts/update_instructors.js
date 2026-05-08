const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hvrcqvahbuokdyxukmnn.supabase.co';
const supabaseKey = 'sb_publishable_Xm0ZAAuSEtoPVHapQOfAgA_-pwbGfwF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateInstructors() {
  const updates = [
    { email: 'youssef@ecole.com', full_name: 'Youssef' },
    { email: 'bilal@ecole.com', full_name: 'Bilal' },
    { email: 'smail@ecole.com', full_name: 'Smail' },
    { email: 'moussa@ecole.com', full_name: 'Moussa' },
  ];

  for (const update of updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: update.full_name })
      .eq('email', update.email);

    if (error) {
      console.error(`Error updating ${update.email}:`, error);
    } else {
      console.log(`Updated ${update.email} to ${update.full_name}`);
    }
  }
}

updateInstructors().catch(console.error);
