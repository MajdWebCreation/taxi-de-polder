import { createClient } from "@supabase/supabase-js";

const [, , command, email, password] = process.argv;

if (!command || !email) {
  console.error(
    "Gebruik:\n" +
      "  node --env-file=.env.local scripts/admin-user.mjs create <email> <password>\n" +
      "  node --env-file=.env.local scripts/admin-user.mjs delete <email>"
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !secretKey) {
  console.error("Ontbrekende env vars: NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const user = data.users.find(
      (item) => item.email?.toLowerCase() === targetEmail.toLowerCase()
    );

    if (user) return user;
    if (data.users.length < perPage) return null;

    page += 1;
  }
}

async function createAdmin() {
  if (!password) {
    throw new Error("Wachtwoord ontbreekt voor create");
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    throw new Error(`Er bestaat al een user met e-mailadres ${email}`);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw error;
  if (!data.user?.id) throw new Error("User kon niet worden aangemaakt");

  const { error: adminError } = await supabase.from("admin_users").upsert({
    user_id: data.user.id,
  });

  if (adminError) throw adminError;

  console.log(`Admin gebruiker aangemaakt: ${email}`);
}

async function deleteAdmin() {
  const user = await findUserByEmail(email);

  if (!user?.id) {
    throw new Error(`Geen user gevonden voor ${email}`);
  }

  const { error: deleteAdminRowError } = await supabase
    .from("admin_users")
    .delete()
    .eq("user_id", user.id);

  if (deleteAdminRowError) throw deleteAdminRowError;

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteUserError) throw deleteUserError;

  console.log(`Admin gebruiker verwijderd: ${email}`);
}

(async () => {
  try {
    if (command === "create") {
      await createAdmin();
    } else if (command === "delete") {
      await deleteAdmin();
    } else {
      throw new Error(`Onbekend commando: ${command}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Onbekende fout");
    process.exit(1);
  }
})();