import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseAdminClient: SupabaseClient | null = null

/**
 * Get or create a Supabase admin client for server-side operations.
 * Uses the service role key for elevated privileges.
 * 
 * IMPORTANT: Never expose this client to the browser/client-side code.
 * This client bypasses Row Level Security (RLS) policies.
 */
export function getSupabaseAdmin(): SupabaseClient {
    if (supabaseAdminClient) {
        return supabaseAdminClient
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL environment variable.'
        )
    }

    if (!supabaseServiceRoleKey) {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
            'This is required for server-side admin operations like sending emails.'
        )
    }

    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    return supabaseAdminClient
}

/**
 * Check if the Supabase admin client can be initialized.
 * Useful for graceful degradation when credentials are not configured.
 */
export function isSupabaseAdminConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
}


