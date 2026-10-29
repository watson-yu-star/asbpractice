import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage';

export class PageHeader extends BasePage {
  private readonly searchElement: Locator;
  private readonly searchButton: Locator;
  private readonly signInElement: Locator;
  private readonly cartElement: Locator;
  private readonly  redIconElement: Locator;

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

    const responsePromise = this.page.waitForResponse(response =>
      response.url().includes('/products.json') &&
      response.request().method() === 'GET'
    );

   // await this.searchElement.press("Enter");
    await this.searchButton.click();
    await responsePromise;
    await this.page.waitForURL(url =>
      url.pathname === '/search/products' &&
      url.searchParams.get('q') === keyword
    );
  }

  async clickSignIn(): Promise<void> {
    await this.signInElement.click();
  }

  async clickCart(): Promise<void> {
    if (await this.getBrowserEngine() === 'webkit') {
      await this.cartElement.press('Enter');
    } else {
      await this.cartElement.click();
    }
    const spinner = this.page.getByRole('img',{name:"loading"});
    await expect(spinner).toBeHidden();
  }

  async getCartItemCount(): Promise<number> {
    const cartText = await this.redIconElement.innerText();
   
    const count = cartText.match(/\d+/);
    //console.log(count);
    return count ? Number(count[0]) : 0;
  }
}
