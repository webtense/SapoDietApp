import { test, expect } from '@playwright/test'

test.describe('Version System', () => {
  test('version meta tag exists', async ({ page }) => {
    await page.goto('/')
    const versionMeta = await page.locator('meta[name="app-version"]').getAttribute('content')
    expect(versionMeta).toMatch(/^\d+\.\d+\.\d+$/)
  })

  test('changelog API returns valid data', async ({ page }) => {
    const response = await page.request.get('/api/changelog')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.entries).toBeDefined()
  })

  test('footer is clickeable and opens modal', async ({ page }) => {
    await page.goto('/')
    await page.locator('footer button').first().click()
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
  })
})
