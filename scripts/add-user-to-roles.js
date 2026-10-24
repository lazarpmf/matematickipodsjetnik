// Script to add existing user to user_roles table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addUserToRoles() {
  const email = 'lazar.pmf@gmail.com';

  try {
    // Get user by email (this requires admin access, so we'll use SQL)
    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log(`
-- Get the user ID first
SELECT id FROM auth.users WHERE email = '${email}';

-- Then insert into user_roles (replace USER_ID_HERE with the ID from above)
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    `);
  } catch (error) {
    console.error('Error:', error);
  }
}

addUserToRoles();
