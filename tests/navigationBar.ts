import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage';

export class NavigationBar extends BasePage {

  //readonly navigation: Locator;
  readonly menuElement: Locator;
  readonly closeMenuElement: Locator;
  readonly  diyElement: Locator;
  readonly serviceElement: Locator;
  readonly storeElement: Locator;
  readonly navElement: Locator;
  readonly catalogueElement: Locator;
  readonly mainNavElement:Locator;
  
  constructor(page: Page) {
    super(page);
    this.navElement = page.locator('#headerbottom-container');
    this.menuElement = this.navElement.getByRole('button',{name:"Open products menu"});
    this.closeMenuElement = this.navElement.getByRole('button',{name:"Close products menu"});
    this.diyElement = this.navElement.getByRole('link',{name:"DIY Advice"});
    this.serviceElement = this.navElement.locator("a[href='service']");
    this.storeElement = this.navElement.locator('a[href=stores]');
    this.catalogueElement = this.navElement.locator('a[href=catalogue]');
    this.mainNavElement = page.getByLabel("Main Navigation");
  }

  async clickMenu():Promise<void> {
    await this.menuElement.click();
  }
 
  async getMenuItems(): Promise<string[]> {

    
    const listItems: Locator[] = await this.mainNavElement.getByRole("listitem").all();
    console.log(listItems.length);
    const arr: string[] = new Array(listItems.length);
    
    for(let i=0;i<listItems.length;i++){
      arr[i] = (await listItems[i].locator('span[class=text]').textContent()) ?? '';
    }
    return arr;
  }

  async clickFirstLevel(name:string){
    await this.mainNavElement.getByRole("listitem").getByRole('link', { name: `${name}` }).click();
    await expect(this.mainNavElement.locator('div[class="level-2 panel"]')).toBeVisible();
  }
    
}