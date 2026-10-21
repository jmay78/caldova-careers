import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('filters roles by department', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter')
            .getByRole('checkbox', { name: 'Technology' })
            .check();

        const frontendRole = page.getByTestId('role-card').filter({
            has: page.getByRole('heading', { name: 'Senior Frontend Engineer', exact: true }),
        });
        const financeRole = page.getByTestId('role-card').filter({
            has: page.getByRole('heading', { name: 'Financial Analyst', exact: true }),
        });
        await expect(frontendRole).toBeVisible();
        await expect(financeRole).toBeHidden();
        await expect(page.getByTestId('filter-result-count')).toHaveText('2 roles shown');
    });

    test('filters roles by location', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('location-filter')
            .getByRole('checkbox', { name: 'Vancouver, Canada' })
            .check();

        const clinicalRole = page.getByTestId('role-card').filter({
            has: page.getByRole('heading', { name: 'Clinical Research Scientist', exact: true }),
        });
        const financeRole = page.getByTestId('role-card').filter({
            has: page.getByRole('heading', { name: 'Financial Analyst', exact: true }),
        });
        await expect(clinicalRole).toBeVisible();
        await expect(financeRole).toBeHidden();
        await expect(page.getByTestId('filter-result-count')).toHaveText('2 roles shown');
    });

    test('combines department and location filters', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter')
            .getByRole('checkbox', { name: 'Manufacturing & Field Service' })
            .check();
        await page.getByTestId('location-filter')
            .getByRole('checkbox', { name: 'Vancouver, Canada' })
            .check();

        const matchingRole = page.getByTestId('role-card').filter({
            has: page.getByRole('heading', { name: 'Manufacturing Process Engineer', exact: true }),
        });
        const otherDepartmentRole = page.getByTestId('role-card').filter({
            has: page.getByRole('heading', { name: 'Clinical Research Scientist', exact: true }),
        });
        await expect(matchingRole).toBeVisible();
        await expect(otherDepartmentRole).toBeHidden();
        await expect(page.getByTestId('filter-result-count')).toHaveText('1 role shown');
    });

    test('shows an empty state for no matches and resets all filters', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter')
            .getByRole('checkbox', { name: 'Technology' })
            .check();
        await page.getByTestId('location-filter')
            .getByRole('checkbox', { name: 'Woodinville, WA, USA' })
            .check();

        await expect(page.getByTestId('filter-empty-state')).toBeVisible();
        await expect(page.getByTestId('filter-result-count')).toHaveText('0 roles shown');

        await page.getByTestId('filter-reset').click();
        await expect(page.getByTestId('filter-empty-state')).toBeHidden();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
        await expect(page.getByTestId('department-filter').getByRole('checkbox', { name: 'Technology' }))
            .not.toBeChecked();
        await expect(page.getByTestId('location-filter').getByRole('checkbox', { name: 'Woodinville, WA, USA' }))
            .not.toBeChecked();
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`shows ${title} location on its card and details`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByTestId('role-location')).toHaveText(location);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
