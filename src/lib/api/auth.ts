import { supabaseAdmin } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

export interface ApiKeyData {
  id: string
  user_id: string
  key_prefix: string
  scopes: string[]
  tier: string
  is_active: boolean
}

export async function validateApiKey(
  request: Request
): Promise<{ apiKey: ApiKeyData; user_id: string } | { error: string; status: number }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or malformed API key. Use: Authorization: Bearer pk_...', status: 401 }
  }

  const key = authHeader.slice(7)
  const keyHash = createHash('sha256').update(key).digest('hex')

  const { data: apiKey, error } = await supabaseAdmin
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (error || !apiKey) {
    return { error: 'Invalid API key', status: 401 }
  }

  // Update last_used_at
  await supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)

  return { apiKey, user_id: apiKey.user_id }
}
