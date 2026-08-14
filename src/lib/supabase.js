import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

function workspaceId() {
  const configured = import.meta.env.VITE_LIVA_WORKSPACE_ID
  if (configured) return configured
  const stored = localStorage.getItem('liva-workspace-id')
  if (stored) return stored
  const created = crypto.randomUUID()
  localStorage.setItem('liva-workspace-id', created)
  return created
}

export const livaWorkspaceId = workspaceId()
export const isSupabaseConfigured = Boolean(url && publishableKey)
export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      global: { headers: { 'x-workspace-id': livaWorkspaceId } },
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

export async function loadCloudSnapshot() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('liva_snapshots')
    .select('payload, updated_at')
    .eq('workspace_id', livaWorkspaceId)
    .maybeSingle()
  if (error) throw error
  return data?.payload || null
}

export async function saveCloudSnapshot(payload) {
  if (!supabase) return false
  const { error } = await supabase.from('liva_snapshots').upsert(
    {
      workspace_id: livaWorkspaceId,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id' },
  )
  if (error) throw error
  return true
}
