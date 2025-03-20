/*
  # Add admin user

  1. Changes
    - Create admin user with secure password
    - Add admin to public.users table
*/

DO $$ 
DECLARE 
  admin_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'admin@example.com';

  -- Only create admin user if it doesn't exist
  IF existing_user_id IS NULL THEN
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
      -- Check if user exists in public.users
      IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id) THEN
        INSERT INTO public.users (id, email)
        VALUES (admin_user_id, 'admin@example.com');
      END IF;
    END IF;
  END IF;
END $$;