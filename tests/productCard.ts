import { Locator, Page } from "@playwright/test";

export class ProductCard{
    readonly page: Page;
    readonly index:Number
     productName:string;
     productPrice:Number;
    readonly productNameElement: Locator;
    readonly productPriceElement: Locator;
    productCardElement: Locator;

    constructor(page:Page,index:Number){
        this.page = page;
        this.index = index;
        this.productName = "";
        this.productPrice = 0.0;
        this.productCardElement= this.page.locator(`div[data-locator=search-product-tile-index-${index}]`);

        this.productNameElement = this.page.locator(`div[data-locator=search-product-tile-index-${index}]`).locator('p').nth(0);
        this.productPriceElement = this.page.locator(`div[data-locator=search-product-tile-index-${index}]`).locator('p').nth(1);
    }

    async getProductName():Promise<String>{
        const productName= await this.productNameElement.innerText();
        this.productName = productName??'';
        return this.productName;
    }
    async getProductPrice():Promise<Number>{
        const productPrice = await this.productPriceElement.innerText();

        if (productPrice !=null) {
            //console.log(productPrice.trim().substring(1));
            this.productPrice = parseFloat(productPrice.trim().substring(1));
           // console.log(this.productPrice);
        }
        return this.productPrice;
    }
    async getProductCode():Promise<String>{
       const code = await this.productCardElement.getAttribute("data-code");
       console.log(code);
       
       return code??'';
    }
}