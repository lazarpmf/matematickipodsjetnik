# Quick Fix: Admin Login Issue

The user was created via SQL which doesn't properly hash passwords for Supabase Auth. Here's how to fix it:

## Option 1: Create User via Supabase Dashboard (Recommended - 2 minutes)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/kvibxglzydsrelviurnl
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Enter:
   - **Email**: `lazar.pmf@gmail.com`
   - **Password**: `Supabase123!`
   - **Auto Confirm User**: ✅ (check this)
5. Click **"Create user"**
6. **Copy the User UUID** (you'll see it in the user list)

7. Then tell me the User UUID and I'll add them to the user_roles table, OR run this SQL in Supabase SQL Editor:

```sql
-- Replace USER_UUID_HERE with the UUID you copied
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## Option 2: I Can Do It For You

If you provide me with your **Supabase Service Role Key** (found in Settings → API), I can create the user programmatically.

The Service Role Key looks like: `sb_secret_...` or `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Note**: The Service Role Key has admin access, so only share it if you're comfortable. Otherwise, Option 1 is safer and just as quick.
