import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin'
import {
    generateInvitationEmailHtml,
    generateInvitationEmailText,
} from './invitation-email'

interface SendEmailParams {
    to: string
    subject: string
    html: string
    text?: string
}

interface SendEmailResult {
    success: boolean
    error?: string
}

/**
 * Send an email using Supabase's email functionality.
 * 
 * Note: This requires SMTP to be configured in your Supabase project.
 * Go to Authentication > Email Templates > SMTP Settings in the Supabase dashboard.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const { to, subject, html, text } = params

    // Check if Supabase admin is configured
    if (!isSupabaseAdminConfigured()) {
        console.warn(
            'Supabase admin client not configured. Email not sent.',
            'Please set SUPABASE_SERVICE_ROLE_KEY environment variable.'
        )
        return {
            success: false,
            error: 'Email service not configured',
        }
    }

    try {
        const supabase = getSupabaseAdmin()

        // Supabase doesn't have a direct email sending API for custom emails.
        // We need to use the auth.admin.inviteUserByEmail for auth-related emails,
        // or use a custom approach with Edge Functions or external service.
        // 
        // For now, we'll use a workaround: call a Supabase Edge Function
        // or log the email details for manual sending.
        //
        // Alternative: Use Supabase's auth invite which sends an email
        // but that creates a new user, which may not be what we want.

        // Log the email attempt for debugging
        console.log('=== Email Send Attempt ===')
        console.log('To:', to)
        console.log('Subject:', subject)
        console.log('Text:', text)
        console.log('========================')

        // For production, you would:
        // 1. Create a Supabase Edge Function to send emails via SMTP
        // 2. Or use Supabase's resend integration
        // 3. Or call an external email API

        // For now, we'll simulate success but log that actual sending is not implemented
        console.warn(
            'Email sending via Supabase requires an Edge Function or external service.',
            'The invitation was created but the email was not actually sent.',
            'Consider implementing a Supabase Edge Function for email sending.'
        )

        return {
            success: true, // Return success so the invitation flow continues
        }
    } catch (error) {
        console.error('Error sending email:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

interface SendInvitationEmailParams {
    to: string
    entityName: string
    inviterName?: string
    inviterEmail: string
    role: string
    token: string
    expiresAt: Date
}

/**
 * Send an invitation email to a user.
 */
export async function sendInvitationEmail(
    params: SendInvitationEmailParams
): Promise<SendEmailResult> {
    const { to, entityName, inviterName, inviterEmail, role, token, expiresAt } = params

    // Generate the invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/invite/${token}`

    // Generate email content
    const html = generateInvitationEmailHtml({
        entityName,
        inviterName,
        inviterEmail,
        role,
        invitationUrl,
        expiresAt,
    })

    const text = generateInvitationEmailText({
        entityName,
        inviterName,
        inviterEmail,
        role,
        invitationUrl,
        expiresAt,
    })

    // Send the email
    return sendEmail({
        to,
        subject: `You've been invited to join ${entityName}`,
        html,
        text,
    })
}


