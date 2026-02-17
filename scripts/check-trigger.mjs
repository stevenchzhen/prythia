import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // Try creating the trigger via rpc if an exec_sql function exists
  const triggerSQL = `
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
        INSERT INTO public.watchlist_groups (user_id, name, sort_order) VALUES (NEW.id, 'Default', 0);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  `

  // Try via rpc('exec_sql') — some Supabase setups have this
  console.log('Attempting to create trigger via rpc...')
  const { error: rpcError } = await supabase.rpc('exec_sql', { sql: triggerSQL })

  if (rpcError) {
    console.log(`  rpc not available: ${rpcError.message}`)

    // Try the Supabase SQL API (pooler endpoint)
    console.log('\nAttempting via /sql endpoint...')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ sql: triggerSQL }),
    })

    if (!res.ok) {
      console.log(`  SQL endpoint not available either (${res.status})`)
      console.log('\n═══════════════════════════════════════════════════')
      console.log('  You need to run the following SQL manually.')
      console.log('  Go to: Supabase Dashboard → SQL Editor → New Query')
      console.log('═══════════════════════════════════════════════════\n')
      console.log(triggerSQL)
      console.log('\n═══════════════════════════════════════════════════')
      console.log('  Also run migration 00005 (the full functions file):')
      console.log(`  File: supabase/migrations/00005_functions.sql`)
      console.log('═══════════════════════════════════════════════════')
    } else {
      console.log('  ✓ Trigger created successfully')
    }
  } else {
    console.log('  ✓ Trigger created via rpc')
  }

  // Verify with a test user
  console.log('\nVerifying with test user...')
  const testEmail = `test-trigger-${Date.now()}@prythia-test.local`
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'test123456',
    email_confirm: true,
  })

  if (createError) {
    console.log(`  ✗ Still failing: ${createError.message}`)
    console.log('  → Apply the SQL above in the Supabase SQL Editor to fix this.')
  } else {
    console.log(`  ✓ User created: ${newUser.user.id}`)

    const { data: pref } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', newUser.user.id)
      .single()

    console.log(`  ${pref ? '✓' : '✗'} user_preferences row ${pref ? 'created' : 'missing'}`)

    // Cleanup
    await supabase.auth.admin.deleteUser(newUser.user.id)
    console.log('  Cleaned up test user')
  }
}

main().catch(console.error)
