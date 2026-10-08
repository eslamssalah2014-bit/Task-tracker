import { supabase } from '../config/supabase';
import { env } from '../config/env';

async function verifyConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log(`🌐 Supabase URL: ${env.SUPABASE_URL}`);

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('❌ Supabase Auth test failed:', error.message);
      process.exit(1);
    }
    console.log('✅ Supabase connected successfully!');
    console.log(`👤 Auth Admin check passed. Total registered users: ${data.users.length}`);
  } catch (err: any) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
}

verifyConnection();
