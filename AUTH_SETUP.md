# Supabase email OTP setup

The app only accepts the part before `@coeptech.ac.in`; it appends the campus domain before calling Supabase.

## Configure Supabase

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key. Restart the dev server after changing environment variables.
2. In Supabase, open **Authentication → Providers → Email** and enable email confirmations. Registration OTP verification depends on this setting.
3. In **Authentication → Email Templates**, configure **Confirm signup** to include the one-time code (`{{ .Token }}`), not only a confirmation link.
4. Configure **Reset password** to include its one-time code (`{{ .Token }}`). The recovery page verifies this code before it lets the user set a new password.
5. Set the Supabase Auth password policy to require at least 12 characters, matching the client-side validation on registration and password reset.
6. Save the settings and test with a COEP email inbox you can access.

Supabase deliberately avoids exposing whether an arbitrary email is registered. The UI uses a generic registration confirmation and provides sign-in/password-reset links for existing users instead of revealing account existence.
