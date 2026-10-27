import { test as base, expect } from '@playwright/test';
import { HomePage } from './homePage';
import { NavigationBar } from './navigationBar';
import { PageHeader } from './pageHeader';
import { ProductCard } from './productCard';
import { CartPage } from './cartPage';

type Fixtures = {
  homePage: HomePage;
  navBar: NavigationBar;
  pageHeader: PageHeader;
  productCard: ProductCard;
  cartPage: CartPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  navBar: async ({ page }, use) => {
    await use(new NavigationBar(page));
  },
  pageHeader: async ({ page }, use) => {
    await use(new PageHeader(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

});

export { expect };
