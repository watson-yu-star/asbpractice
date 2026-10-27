import type { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class PageHeader extends BasePage {
  readonly searchElement: Locator;
  readonly searchButton: Locator;
  readonly signInElement: Locator;
  readonly cartElement: Locator;
 readonly  redIconElement: Locator;

  constructor(page: Page) {
   super(page);
    this.searchElement = page.locator('#header-search-input-visible');
    this.searchButton = page.getByRole('button', { name: 'Submit search' });
    this.signInElement = page.locator('#icon-account');
    this.cartElement = page.locator('#icon-cart');
    this.redIconElement = this.cartElement.getByTestId("cartItemCount");
  }

  async search(keyword: string): Promise<void> {
    await this.searchElement.click();
    await this.searchElement.fill(keyword);
    await this.searchButton.click();
  }

  async clickSignIn(): Promise<void> {
    await this.signInElement.click();
  }

  async clickCart(): Promise<void> {
    await this.cartElement.click();
  }

  async getCartItemCount(): Promise<number> {
    const cartText = await this.redIconElement.innerText();
   
    const count = cartText.match(/\d+/);
    //console.log(count);
    return count ? Number(count[0]) : 0;
  }
}
