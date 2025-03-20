-- Create admin user if it doesn't exist
DO $$ 
DECLARE 
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  ) THEN
    -- Create admin user in auth.users
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
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;

    -- Add admin to public.users table
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO public.users (id, email)
      VALUES (admin_user_id, 'admin@example.com')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- Ensure admin has proper permissions
DO $$
BEGIN
  -- Update admin user's role to be an admin
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
  WHERE email = 'admin@example.com';
END $$;