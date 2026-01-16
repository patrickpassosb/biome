import { test, expect } from '@playwright/test';

test('homepage loads and shows dashboard', async ({ page }) => {
  await page.goto('/');
  
  // Check title
  await expect(page).toHaveTitle(/Biome Training Intelligence/);
  
  // Check for sidebar navigation (Dashboard is likely there)
  await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible();
  
  // Check for main heading in DashboardView
  await expect(page.getByText(/Training Overview/i)).toBeVisible();
});
