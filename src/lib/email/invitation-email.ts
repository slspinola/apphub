/**
 * Email template for entity invitations.
 * Generates HTML email content with inline styles for email client compatibility.
 */

interface InvitationEmailParams {
    entityName: string
    inviterName?: string
    inviterEmail: string
    role: string
    invitationUrl: string
    expiresAt: Date
}

/**
 * Generate HTML email content for an entity invitation.
 */
export function generateInvitationEmailHtml(params: InvitationEmailParams): string {
    const {
        entityName,
        inviterName,
        inviterEmail,
        role,
        invitationUrl,
        expiresAt,
    } = params

    const inviterDisplay = inviterName || inviterEmail
    const expirationDate = expiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been invited to join ${entityName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">
                                You're Invited!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
                                <strong>${inviterDisplay}</strong> has invited you to join <strong>${entityName}</strong> as a <strong>${roleDisplay}</strong>.
                            </p>
                            
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #71717a;">
                                Click the button below to accept the invitation and get started.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="text-align: center; padding: 20px 0;">
                                        <a href="${invitationUrl}" 
                                           style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 6px;">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #a1a1aa;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 20px; color: #3b82f6; word-break: break-all;">
                                <a href="${invitationUrl}" style="color: #3b82f6;">${invitationUrl}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Expiration Notice -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <div style="padding: 16px; background-color: #fef3c7; border-radius: 6px;">
                                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #92400e;">
                                    ⏰ This invitation expires on <strong>${expirationDate}</strong>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e4e4e7;">
                            <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa; text-align: center;">
                                If you didn't expect this invitation, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
}

/**
 * Generate plain text email content for an entity invitation.
 * Used as fallback for email clients that don't support HTML.
 */
export function generateInvitationEmailText(params: InvitationEmailParams): string {
    const {
        entityName,
        inviterName,
        inviterEmail,
        role,
        invitationUrl,
        expiresAt,
    } = params

    const inviterDisplay = inviterName || inviterEmail
    const expirationDate = expiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1)

    return `
You're Invited!

${inviterDisplay} has invited you to join ${entityName} as a ${roleDisplay}.

Click the link below to accept the invitation:
${invitationUrl}

This invitation expires on ${expirationDate}.

If you didn't expect this invitation, you can safely ignore this email.
`.trim()
}


