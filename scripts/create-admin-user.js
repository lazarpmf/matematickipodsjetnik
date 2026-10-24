// Script to create admin user using Supabase Auth API
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Use service role key if available, otherwise use anon key (won't work for admin operations)
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'lazar.pmf@gmail.com';
  const password = 'Supabase123!';

  try {
    // Create user using admin API (requires service role key)
    if (supabaseServiceKey) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        console.error('Error creating user:', authError);
        return;
      }

      const userId = authData.user.id;
      console.log('User created with ID:', userId);

      // Add to user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (roleError) {
        console.error('Error adding to user_roles:', roleError);
        return;
      }

      console.log('✅ Admin user created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required to create users.');
      console.log('\nPlease either:');
      console.log('1. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
      console.log('2. Or create the user manually via Supabase Dashboard');
      console.log('   - Go to Authentication → Users → Add user');
      console.log('   - Then run: node scripts/add-user-to-roles.js');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();
