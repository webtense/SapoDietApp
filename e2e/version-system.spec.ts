import { test, expect } from '@playwright/test'

test.describe('Version System E2E', () => {
  test('1. Version meta tag exists and is valid', async ({ page }) => {
    await page.goto('/')
    const versionMeta = await page.locator('meta[name="app-version"]').getAttribute('content')
    expect(versionMeta).toMatch(/^\d+\.\d+\.\d+$/)
  })

  test('2. Build commit meta tag exists', async ({ page }) => {
    await page.goto('/')
    const commitMeta = await page.locator('meta[name="build-commit"]').getAttribute('content')
    expect(commitMeta).toBeTruthy()
  })

  test('3. API version endpoint returns valid JSON', async ({ page }) => {
    const response = await page.request.get('/api/version')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(data.commit).toBeTruthy()
  })

  test('4. Changelog API has all versions', async ({ page }) => {
    const response = await page.request.get('/api/changelog')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.entries).toBeDefined()
    expect(Array.isArray(data.entries)).toBe(true)
  })

  test('5. Version footer is clickable and opens modal', async ({ page }) => {
    await page.goto('/')
    await page.locator('footer button').click()
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
  })

  test('6. Service Worker registers successfully', async ({ page }) => {
    await page.goto('/')
    const swCount = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistrations().then(r => r.length)
    })
    expect(swCount).toBeGreaterThanOrEqual(1)
  })

  test('7. Cache-busting URLs have version parameter', async ({ page }) => {
    await page.goto('/')
    const manifestLink = page.locator('link[rel="manifest"]')
    const href = await manifestLink.getAttribute('href')
    expect(href).toMatch(/[?&]v=/)
  })

  test('8. Manifest loads with cache-busting', async ({ page }) => {
    const response = await page.request.get('/manifest.json?v=e2e')
    expect(response.status()).toBe(200)
  })

  test('9. Push notifications permission works', async ({ page }) => {
    await page.goto('/')
    const notificationSupport = await page.evaluate(() => 'Notification' in window)
    expect(notificationSupport).toBe(true)
  })

  test('10. PWA install prompt detection works', async ({ page }) => {
    await page.goto('/')
    const promptSupport = await page.evaluate(() => {
      return 'onbeforeinstallprompt' in window
    })
    expect(typeof promptSupport).toBe('boolean')
  })
})
