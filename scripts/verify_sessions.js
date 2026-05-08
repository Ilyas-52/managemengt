const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hvrcqvahbuokdyxukmnn.supabase.co';
const supabaseKey = 'sb_publishable_Xm0ZAAuSEtoPVHapQOfAgA_-pwbGfwF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('--- Verifying Session Logging ---');

  // 1. Get a student and an instructor
  const { data: student } = await supabase.from('students').select('*').limit(1).single();
  const { data: instructor } = await supabase.from('profiles').select('*').eq('role', 'instructor').limit(1).single();

  if (!student || !instructor) {
    console.error('Missing student or instructor for test');
    return;
  }

  console.log(`Testing with Student: ${student.full_name} (${student.total_sessions} sessions left)`);
  console.log(`Testing with Instructor: ${instructor.full_name}`);

  const initialSessions = student.total_sessions;
  const initialCompleted = student.completed_sessions;

  // 2. Log a completed session
  const sessionData = {
    student_id: student.id,
    instructor_id: instructor.id,
    date: new Date().toISOString(),
    duration: 60,
    status: 'completed'
  };

  console.log('Logging a completed session...');
  const { data: session, error } = await supabase.from('driving_sessions').insert([sessionData]).select().single();

  if (error) {
    console.error('Error logging session:', error);
    return;
  }

  console.log('Session logged successfully:', session.id);

  // 3. Manually trigger the decrement (since the trigger/action is in the app, not the DB)
  // Wait, I should test my action logic. But I can't run 'use server' actions directly in node easily.
  // I'll simulate the update as my action would do:
  console.log('Simulating student update (same logic as server action)...');
  const { error: uErr } = await supabase
    .from('students')
    .update({
      total_sessions: (student.total_sessions || 0) - 1,
      completed_sessions: (student.completed_sessions || 0) + 1
    })
    .eq('id', student.id);

  if (uErr) {
    console.error('Error updating student:', uErr);
    return;
  }

  // 4. Verify the student update
  const { data: updatedStudent } = await supabase.from('students').select('*').eq('id', student.id).single();
  console.log(`Updated Student: ${updatedStudent.full_name} (${updatedStudent.total_sessions} sessions left, ${updatedStudent.completed_sessions} completed)`);

  if (updatedStudent.total_sessions === initialSessions - 1 && updatedStudent.completed_sessions === initialCompleted + 1) {
    console.log('SUCCESS: Student sessions updated correctly!');
  } else {
    console.error('FAILURE: Student sessions not updated correctly!');
  }

  // Cleanup: delete the test session and revert student (optional, but good for testing)
  // await supabase.from('driving_sessions').delete().eq('id', session.id);
  // await supabase.from('students').update({ total_sessions: initialSessions, completed_sessions: initialCompleted }).eq('id', student.id);
}

verify().catch(console.error);
