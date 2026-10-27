import type { Page } from '@playwright/test';

export class BasePage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	protected async navigateTo(path: string): Promise<void> {
		await this.page.goto(path);
	}
}