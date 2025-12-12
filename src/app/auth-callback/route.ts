import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const callbackUrl = cookieStore.get('auth_callback_url')?.value

  // Clear the cookie
  cookieStore.delete('auth_callback_url')

  // Get the origin from the request
  const url = new URL(request.url)
  const origin = url.origin

  // Redirect to the callback URL or default to home
  const redirectUrl = callbackUrl || '/'

  // Use NextResponse.redirect for proper URL handling
  const response = NextResponse.redirect(
    redirectUrl.startsWith('http') ? redirectUrl : `${origin}${redirectUrl}`
  )

  // Delete the cookie in the response as well
  response.cookies.delete('auth_callback_url')

  return response
}
