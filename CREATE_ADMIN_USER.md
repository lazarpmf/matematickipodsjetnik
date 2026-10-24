# How to Create an Admin User

## Step 1: Create User in Supabase Auth

### Via Dashboard:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/kvibxglzydsrelviurnl
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Enter:
   - **Email**: your-admin-email@example.com
   - **Password**: (choose a strong password)
   - **Auto Confirm User**: ✅ (check this box)
5. Click **"Create user"**
6. **Copy the User UUID** (you'll see it in the user list or user details)

### Via SQL (if you prefer):
```sql
-- This creates a user, but you'll need to set password via dashboard or API
-- Better to use dashboard method above
```

## Step 2: Add User to user_roles Table

Once you have the User UUID, run this SQL in the Supabase SQL Editor:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('paste-user-uuid-here', 'admin');
```

Replace `'paste-user-uuid-here'` with the actual UUID you copied.

## Step 3: Verify

Check that the admin was added:

```sql
SELECT 
  ur.user_id,
  ur.role,
  au.email
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id;
```

You should see your admin user listed.

## Alternative: I Can Do It For You

If you provide me with:
- Email address for the admin
- Password for the admin

I can create the user and add them to the user_roles table automatically.
