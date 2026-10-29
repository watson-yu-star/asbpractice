import { expect, test } from './fixtures';
import { HomePage } from './homePage';
import { ProductCard } from './productCard';
import product from './test-data/product.json';
import * as allure from 'allure-js-commons';

test('product name contains mower', async({ homePage }) => {
  const name = 'mower';
  await homePage.goto();
  await homePage.search(name);
  const productName = await homePage.getSearchResult();
 
  //expect(count).toBeGreaterThan(0);
  expect(productName).toContain(name);
  expect(await  homePage.getSearchResult()).toContain(name);
  console.log(productName);
});

test('pagenation to last page',async ({ homePage },testInfo)=>{
   const name = 'mower';
   await homePage.goto();
   await homePage.search(name);
   const nextButtonDisabled= await homePage.gotoLastPage();
   expect(nextButtonDisabled).toBeTruthy();

   let url = new URL(await homePage.getUrl());
   const baseURL = testInfo.project.use.baseURL;

  if (!baseURL) {
    throw new Error('baseURL is not configured in Playwright');
  }
  
  expect(url.origin).toBe(new URL(baseURL).origin);
  expect(url.pathname).toBe('/search/products');
  expect(url.searchParams.get('page')).toMatch(/^\d+$/);
  expect(url.searchParams.get('q')).toBe(name);
  expect(url.searchParams.get('sort')).toBe('BoostOrder');
   
})
test('click the product menu',async({homePage,navBar})=>{
  await allure.epic('browser category');
  await allure.feature('homepage menu');
   await homePage.goto();
   await navBar.clickMenu();
   const arr = await navBar.getMenuItems();
   expect(arr?.length).toBeGreaterThan(10);
   await navBar.clickFirstLevel("Tools");
   
});

test("add product to cart",async({homePage,pageHeader})=>{
  await allure.feature('add to cart')
  const name = 'mower'
  await homePage.goto();
 // await homePage.search(name);
  await pageHeader.search(name);
  await homePage.addtoCart(0);
  expect(await pageHeader.getCartItemCount()).toEqual(1);

});

test.only("checkout the order", async({homePage,pageHeader,cartPage})=>{
  const name = 'battery';
  await homePage.goto();
  await pageHeader.search(name);
 
  const productCard =  await homePage.addtoCart(0);
  product.price = Number(await productCard.getProductPrice());
  product.name = (await productCard.getProductName()).toString();
  product.code = (await productCard.getProductCode()).toString();
  await pageHeader.clickCart();
  await cartPage.clickCollect();
  const storeCard = await cartPage.selectStore('1050','Mt Wellington'); 
  await expect(storeCard).toBeVisible();

  const cartItems = await cartPage.getItemCount();
  await expect(cartItems).toHaveCount(1);
  expect(await cartPage.getItemName(0)).toEqual(product.name);
  expect(await cartPage.getItemQuantity(0)).toEqual(1);
  expect(await cartPage.getItemPrice(0)).toEqual(product.price);
  const promise = "Ready to collect in 2 hours."
  const shortTime = new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: false });

  if(shortTime < "12:00"){
    expect(await cartPage.getDeliveryPromise()).toEqual(promise);
  }

  //await cartPage.setQuantity(0,2);
  expect(await cartPage.getItemQuantity(0)).toEqual(1);
  expect(await cartPage.getItemPrice(0)).toEqual(product.price);
  expect(await cartPage.checkOrderSummary(1)).toEqual(product.price);
  await cartPage.proceedToCheckout();
})