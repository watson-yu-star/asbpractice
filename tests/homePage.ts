import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage';
import { ProductCard } from './productCard';
import test from 'node:test';

export class HomePage extends BasePage {
  private readonly searchElement: Locator;
  private readonly searchSummary: Locator;
  private readonly url: string;
  private readonly searchButton: Locator;
  private readonly nextPageButton: Locator;
  private         searchCount: number;
  private readonly pageSize: number;

  constructor(page: Page) {
    super(page);
    this.url = '';
    this.searchElement = page.locator('#header-search-input-visible');
    this.searchSummary = page.locator('#searchResultContainer').getByRole('heading', { level: 2 });
    //this.searchButton = page.getByLabel('Submit search');
    this.searchButton = page.getByRole('button', { name: 'Submit search' });
   // this.nextPageButton = page.getByRole('button', { name: 'Next page' });
    this.searchCount = 0;
    this.pageSize = 36;
    this.nextPageButton = page.getByRole('button', { name: 'Next page' });

  }

  async goto(): Promise<void> {
    let baseURL = process.env.BASE_URL;
     //      origin: 'https://www.bunnings.co.nz',
    
    await this.page.context().grantPermissions([], {
      origin: baseURL,
    });
    await this.navigateTo('');
    await expect(this.page).toHaveTitle('New Zealand DIY, Garden & Hardware Store - Bunnings New Zealand');
  }

  async search(keyword: string): Promise<void> {
    await this.searchElement.click();
    await this.searchElement.fill(keyword);
    //await this.searchButton.click();
    //await this.searchElement.press('Enter');

    const responsePromise = this.page.waitForResponse(response =>
    response.url().includes('/products.json') &&
    response.request().method() === 'GET');

    await this.searchButton.click();
    const response = await responsePromise;
    let jsonData=await response.json();
   // console.log(jsonData.pageProps.dehydratedState.queries[1].state.data.availableCategoriesWithCount[0].count);
    let count= parseInt(jsonData.pageProps.dehydratedState.queries[1].state.data.availableCategoriesWithCount[0].count);
    this.searchCount = count;
    console.log("response total number;"+count);
    await this.page.waitForURL(url => (
      url.pathname === '/search/products' && url.searchParams.get('q') === keyword
    ),{waitUntil:"load"});

  }

  async getSearchResult(): Promise<string|null> {
    let count=0;
    const result = await this.searchSummary.innerText();
    const match = result?.match(/^Showing\s+(\d+)\s+of\s+\d+\s+results?$/);
    //console.log(match);

    const arr = result?.trim().split(' ');
    if(arr?.length==5){
        count=(Number(arr[3]));
    
    }
    else{
      return null;
    }
    expect(this.searchCount).toEqual(count);
    
    
    let index;
    const lastPage = Math.max(1, Math.ceil(this.searchCount / this.pageSize));
    if (count%this.pageSize == 0){
       
        index =this.pageSize-1;
    }
    else{
        index = count%this.pageSize-1;
    }
    let url = `search/products?page=${lastPage}&q=mower&sort=BoostOrder`;
    await this.page.goto(url);

    let productName = await this.page.locator(`div[data-index="${index}"]`).locator('p').first().innerText();
    console.log("productName"+productName);

    return productName;


    /*
    console.log(match);
    if (!match) {
      throw new Error(`Unexpected search summary: ${result}`);
    }
    
    return Number(match[1]);
    */
  }

  async gotoLastPage():Promise<boolean>{
    const lastPage = Math.max(1, Math.ceil(this.searchCount / this.pageSize));
    const lastPageUrl = new URL(this.page.url());
    const currentPage = Number(lastPageUrl.searchParams.get('page') ?? 1);

    if (currentPage < lastPage) {
      lastPageUrl.searchParams.set('page', String(lastPage));
      await this.page.goto(lastPageUrl.toString(), { waitUntil: 'domcontentloaded' });
    }

    await expect(this.nextPageButton).toBeDisabled();
    return true;

  }
  

  async addtoCart(index:Number):Promise<ProductCard>{
    const productTile = this.page.locator(`div[data-locator="search-product-tile-index-${index}"]`);
    await expect(productTile).toBeVisible({ timeout: 15000 });
    const addToCartButton = productTile.getByRole('button', { name: 'Add to Cart' });
    if (await this.getBrowserEngine() === 'webkit') {
      await expect(addToCartButton).toBeEnabled();
      await addToCartButton.press('Enter');
    } else {
      await addToCartButton.click();
    }
    const productCard: ProductCard = new ProductCard(this.page, index);
    return productCard;

  }

}