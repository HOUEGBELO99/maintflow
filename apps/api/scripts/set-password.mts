/* One-off: set a known password for an existing Supabase Auth user (by email). */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('usage: tsx set-password.mts <email> <password>');
  process.exit(1);
}

async function main() {
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`No auth user with email ${email}`);
    process.exit(1);
  }
  const { error: upErr } = await sb.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (upErr) throw upErr;
  console.log(`OK: password set for ${email} (id ${user.id})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
