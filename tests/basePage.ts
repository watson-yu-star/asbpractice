import type { Page } from '@playwright/test';

export class BasePage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	protected async navigateTo(path: string): Promise<void> {
		await this.page.goto(path);
	}
	async getBrowserEngine(): Promise<string> {
    // returns 'chromium', 'webkit', or 'firefox'
    return this.page.context().browser()?.browserType().name() || '';
}
}