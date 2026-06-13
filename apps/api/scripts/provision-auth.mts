/* One-off: give an EXISTING public.users row a Supabase Auth login.
 * Creates the auth user (confirmed) then aligns public.users.id = authId so the
 * JWT `sub` matches the app row. Children cascade (ON UPDATE CASCADE). */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('usage: tsx provision-auth.mts <email> <password>');
  process.exit(1);
}

async function main() {
  const dbUser = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, role: true } });
  if (!dbUser) throw new Error(`No public.users row for ${email}`);

  // Already has an auth user?
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  let authId: string;
  if (existing) {
    await sb.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    authId = existing.id;
    console.log(`auth user already existed (${authId}) — password reset`);
  } else {
    const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    authId = data.user!.id;
    console.log(`auth user created: ${authId}`);
  }

  if (dbUser.id !== authId) {
    await prisma.user.update({ where: { email }, data: { id: authId } });
    console.log(`aligned public.users.id ${dbUser.id} -> ${authId} (children cascaded)`);
  } else {
    console.log('ids already aligned');
  }
  console.log(`OK: ${email} (${dbUser.name}, ${dbUser.role}) can now log in`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
