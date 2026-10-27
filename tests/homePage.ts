import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage';
import { ProductCard } from './productCard';
import test from 'node:test';

export class HomePage extends BasePage {
  readonly searchElement: Locator;
  readonly searchSummary: Locator;
  readonly url: string;
  readonly searchButton: Locator;
  readonly nextPageButton: Locator;
           searchCount: number;
  readonly pageSize: number;

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
    await this.page.context().grantPermissions([], {
           origin: 'https://www.bunnings.co.nz',
            });
    await this.navigateTo('');
  }

  async search(keyword: string): Promise<void> {
    await this.searchElement.click();
    await this.searchElement.fill(keyword);
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
    
    let lastPage;
    let index;

    if (count%this.pageSize == 0){
        lastPage =  count/this.pageSize;
        index =this.pageSize-1;
    }
    else{

        lastPage =  Math.floor(count/this.pageSize)+1;
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

        const targetApiUrl = '/_apis/v1/facets/products/search';

       //  let haveNext = await this.nextPageButton.isEnabled();
         while (true){
           // await this.nextPageButton.click();
           const nextButton = this.nextPageButton; //this.page.getByRole('button', { name: 'Next page' });
           const isClickable = await nextButton.isEnabled({ timeout: 1500 }).catch(() => false);
            if (!isClickable) {
                break; // Exit loop if the button is disabled or missing (last page reached)
            }
           await Promise.all([
                this.page.waitForResponse(
                    response => response.url().includes(targetApiUrl) && response.status() === 200,
                    { timeout: 5000 }
                ).catch(() => {
                    // Fallback in case it's a client-side layout redraw with no network request
                }),
                nextButton.click()
            ]);
            
            //haveNext =  await nextButton.isEnabled();
         }
         await this.nextPageButton.isDisabled();
         return true;

  }
  async getUrl():Promise<string>{
    return this.page.url();
  }

  async addtoCart(index:Number):Promise<ProductCard>{

    const isWebKit = await this.getBrowserEngine() === 'webkit';
    if(isWebKit){
      console.log("webkit is running");
      const firstProductTile = this.page.locator('div[data-locator="search-product-tile-index-0"]');

      // Force WebKit to block execution until the element actually attaches to the live DOM tree
      await firstProductTile.waitFor({ state: 'attached', timeout: 7000 });
    }
    await expect(this.page.locator(`div[data-locator=search-product-tile-index-${index}]`)).toBeVisible();
    await this.page.locator(`div[data-locator=search-product-tile-index-${index}]`).getByRole('button',{name: "Add to Cart"}).click();
    const productCard: ProductCard = new ProductCard(this.page, index);
    return productCard;

  }
}