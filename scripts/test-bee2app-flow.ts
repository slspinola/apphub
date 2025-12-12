/**
 * Browser Test: Bee2App Authentication and Work Orders Flow
 * Tests the complete user journey from login to accessing work orders
 */

import { chromium } from 'playwright'

async function main() {
  console.log('='.repeat(70))
  console.log('BROWSER TEST: Bee2App Authentication Flow')
  console.log('='.repeat(70))
  console.log()

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down actions for visibility
  })

  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Step 1: Navigate to Bee2App
    console.log('Step 1: Navigating to Bee2App (http://localhost:3001)')
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    console.log(`Current URL: ${currentUrl}`)

    if (currentUrl.includes('localhost:3000')) {
      console.log('✅ Redirected to AppHub for OAuth authentication')

      // Step 2: Login to AppHub
      console.log('\nStep 2: Attempting login to AppHub')

      // Check if we're on login page
      const loginForm = await page.locator('form').count()
      if (loginForm > 0) {
        console.log('Found login form, entering credentials...')

        await page.fill('input[type="email"]', 'spinola.development@outlook.com')
        await page.fill('input[type="password"]', 'password') // Use actual password

        await page.click('button[type="submit"]')
        await page.waitForLoadState('networkidle', { timeout: 10000 })

        console.log(`After login URL: ${page.url()}`)
      } else {
        console.log('No login form found - may already be logged in')
      }

      // Wait for OAuth redirect back to Bee2App
      console.log('\nStep 3: Waiting for OAuth redirect back to Bee2App...')
      await page.waitForURL('http://localhost:3001/**', { timeout: 15000 })
      console.log(`✅ Redirected back to Bee2App: ${page.url()}`)
    } else {
      console.log('Already on Bee2App - checking if logged in')
    }

    // Step 4: Navigate to Work Orders
    console.log('\nStep 4: Navigating to Work Orders')
    await page.goto('http://localhost:3001/work-orders')
    await page.waitForLoadState('networkidle')

    // Check for errors
    const errorText = await page.locator('body').textContent()

    if (errorText?.includes('Unauthorized') || errorText?.includes('Missing permission')) {
      console.log('❌ PERMISSION ERROR DETECTED')
      console.log('Error text:', errorText?.substring(0, 500))

      // Take screenshot
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
      console.log('Screenshot saved to error-screenshot.png')

      // Check console logs
      page.on('console', msg => {
        console.log(`Browser console [${msg.type()}]:`, msg.text())
      })

    } else if (errorText?.includes('No work orders yet')) {
      console.log('✅ Work Orders page loaded successfully!')
      console.log('No work orders in database yet - this is expected')

      // Try to create a work order
      console.log('\nStep 5: Attempting to create a work order')
      const newButton = page.locator('text=New Work Order')
      if (await newButton.count() > 0) {
        await newButton.click()
        await page.waitForLoadState('networkidle')
        console.log(`✅ Navigated to create page: ${page.url()}`)
        await page.screenshot({ path: 'create-work-order.png' })
      }

    } else {
      console.log('Work Orders page content:', errorText?.substring(0, 300))
    }

  } catch (error) {
    console.error('❌ Test failed:', error)

    // Capture error state
    const url = page.url()
    const title = await page.title()
    console.log(`\nError state:`)
    console.log(`  URL: ${url}`)
    console.log(`  Title: ${title}`)

    await page.screenshot({ path: 'test-error.png', fullPage: true })
    console.log('  Screenshot: test-error.png')

  } finally {
    console.log('\nTest completed. Browser will remain open for 10 seconds...')
    await page.waitForTimeout(10000)
    await browser.close()
  }
}

main().catch(console.error)
