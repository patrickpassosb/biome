import { test, expect } from '@playwright/test';

test('homepage loads and shows agent chat', async ({ page }) => {
  await page.goto('/');
  
  // Check title
  await expect(page).toHaveTitle(/Biome Training Intelligence/);
  
  // Check for sidebar navigation
  await expect(page.getByRole('button', { name: /Agents/i })).toBeVisible();
  
  // Check for main heading in AgentView
  await expect(page.getByText(/Biome Team/i)).toBeVisible();
});
