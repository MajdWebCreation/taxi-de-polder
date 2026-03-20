import { createClient } from "@supabase/supabase-js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Gebruik: node --env-file=.env.local scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Ontbrekende env vars: NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error(error.message);
  process.exit(1);
}

const userId = data.user?.id;

if (!userId) {
  console.error("User niet aangemaakt.");
  process.exit(1);
}

const { error: adminError } = await supabase.from("admin_users").upsert({
  user_id: userId,
});

if (adminError) {
  console.error(adminError.message);
  process.exit(1);
}

console.log(`Admin user aangemaakt: ${email}`);