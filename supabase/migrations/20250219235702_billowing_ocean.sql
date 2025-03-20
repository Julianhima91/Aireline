/*
  # Fix admin user creation and permissions

  1. Changes
    - Safely recreate admin user if needed
    - Update admin metadata and permissions
    - Ensure proper RLS policies
  
  2. Security
    - Maintain referential integrity
    - Preserve existing data
    - Update policies for admin access
*/

-- Create or update admin user
DO $$ 
DECLARE 
  admin_user_id uuid;
  existing_admin_id uuid;
BEGIN
  -- First check if admin user exists
  SELECT id INTO existing_admin_id
  FROM auth.users
  WHERE email = 'admin@example.com';

  IF existing_admin_id IS NULL THEN
    -- Create new admin user if doesn't exist
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) 
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('Admin123!@#', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object(
        'provider', 'email',
        'providers', array['email']
      ),
      jsonb_build_object(
        'role', 'admin'
      ),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;

    -- Create admin in public.users table
    INSERT INTO public.users (id, email)
    VALUES (admin_user_id, 'admin@example.com')
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  ELSE
    -- Update existing admin user
    admin_user_id := existing_admin_id;
    
    UPDATE auth.users
    SET 
      encrypted_password = crypt('Admin123!@#', gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object('role', 'admin'),
      raw_app_meta_data = jsonb_build_object(
        'provider', 'email',
        'providers', array['email']
      ),
      email_confirmed_at = NOW(),
      updated_at = NOW()
    WHERE id = admin_user_id;

    -- Ensure admin exists in public.users
    INSERT INTO public.users (id, email)
    VALUES (admin_user_id, 'admin@example.com')
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  END IF;
END $$;

-- Ensure proper RLS policies exist
DO $$
BEGIN
  -- Drop existing admin policy if exists
  DROP POLICY IF EXISTS "Admin can access all users" ON users;
  
  -- Recreate admin policy
  CREATE POLICY "Admin can access all users"
    ON users
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'admin@example.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');
END $$;