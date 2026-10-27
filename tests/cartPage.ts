import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class CartPage extends BasePage {
	readonly cartItems: Locator;
	readonly checkoutButton: Locator;
    readonly findStoreDiv: Locator;
    readonly summarySection: Locator;
    readonly clickCollectEelement: Locator;
    readonly selectStoreCombobox: Locator;
    readonly autoSuggestionListBox: Locator;
    readonly promiseEelement: Locator;

	constructor(page: Page) {
    	super(page);
		this.cartItems = page.locator('.cartTileContainer');
		//this.checkoutButton = page.getByRole('button', { name: /Continue to checkout/i });
        this.findStoreDiv = page.getByText(/Find a store/i);
        this.summarySection = page.locator('div.orderSummaryWrapper');
        this.checkoutButton = this.summarySection.getByRole('button', { name: /Continue to checkout/i });
        this.clickCollectEelement= page.locator('label').filter({hasText: "Click & Collect"});
        this.selectStoreCombobox = page.getByRole('combobox', { name: 'Search postcode or suburb' });
        this.autoSuggestionListBox = page.locator('#storeAutoSuggest-listbox');
        this.promiseEelement = page.locator('div.storeInfoBanner');
	}

	async goto(): Promise<void> {
		await this.navigateTo('/cart');
	}

    async clickCollect():Promise<void>{
      // Because the sr-only class 
      //await this.page.locator('input[name="shopping-method"][value="pickup"]').check({ force: true });
       const isWebKit = await this.getBrowserEngine() === 'webkit';
      
       if(!isWebKit) {
            await this.clickCollectEelement.click();
       }else{
          const element = this.page.locator('label').filter({ hasText: 'Click & Collect' });
    
        // Ensure it exists in the DOM first
         await element.waitFor({ state: 'attached' });
    
        // Evaluate a direct JavaScript click inside WebKit's execution context
            await element.evaluate(node => (node as HTMLElement).click());
       }
        
    }

    async selectStore(postCode:string,storeName:string):Promise<Locator>{
        await expect(this.page.getByText(/Select a store to check product availability./i)).toBeVisible();
        await this.findStoreDiv.click();
       // await this.page.getByLabel("Search postcode or suburb").fill(postCode);
       await this.selectStoreCombobox.fill(postCode); 
       await this.autoSuggestionListBox.getByRole('option')
                       .filter({hasText:"1050"})
                       .click();
       
        await this.page.getByRole('button', { name: `${storeName}` })
                       .click();
        const buttonName = `Click & Collect from ${storeName}`;
        await this.page.getByRole('button',{name:`${buttonName}`})
                       .click();
      
                       
       const storeCard = this.page
                            .getByRole('button')
                            .filter({ has: this.page.locator('p', { hasText: `${storeName}` }) });
      // await expect(storeCard).toBeVisible();
         return storeCard;
      
    }

	async getItemCount(): Promise<Locator> {
        await expect(this.cartItems.first()).toBeVisible();
        //console.log(await this.cartItems.count());
        return this.cartItems;
	}

	async removeItem(index: number): Promise<void> {
		await this.cartItems
			.nth(index)
			.getByRole('button', { name: /Remove Item/i })
			.click();
	}
    async getItemName(index:number): Promise<string>{
       return await this.cartItems
			.nth(index)
            .locator('div[data-locator="click-collect-product-name"]')
            .innerText();
    }

     async getItemQuantity(index:number): Promise<number>{
         const value= await this.cartItems
			.nth(index)
            .locator('input[data-locator=Input_Quantity]')
            .inputValue();
         const quantity = parseInt(value);
         return quantity;
        

    }
    async getItemPrice(index:number): Promise<number>{
        const value = await this.cartItems
			.nth(index)
            .locator('div.productPrice')
            .locator('p')
            .innerText();
        const price = parseFloat(value.trim().substring(1));
        return price;
    }
    async getDeliveryPromise():Promise<string>{
        const promise = await this.promiseEelement.innerText();

        //console.log(promise);
        return promise;
    }    

	async setQuantity(index: number, quantity: number): Promise<void> {
		if (!Number.isInteger(quantity) || quantity < 1) {
			throw new Error('Quantity must be a positive integer.');
		}
        
        const oldSubtotalText = await this.cartItems.nth(index).locator('div.productPrice').locator('p').innerText();
        //const cartPromiase = this.page.waitForResponse("*/_apis/v1/carts/*",)
        const targetQuantity = String(quantity);
        const responsePromise = this.page.waitForResponse(response =>{
            const request = response.request();
  
        // 1. Verify it's a PUT request
            if (request.method() !== 'PUT') return false;

            const urlObj = new URL(response.url());

        // 2. Match the core API endpoint route
            const isCartApi = urlObj.pathname.includes('_apis/v1/carts') && urlObj.pathname.includes('/entries/');

        // 3. Dynamically read and compare the 'qty' URL query parameter
            const hasMatchingQty = urlObj.searchParams.get('qty') === targetQuantity;

            return isCartApi && hasMatchingQty;
        }
        );
        
		const quantityInput = this.cartItems.nth(index).getByLabel("Quantity",{exact:true});
		//await quantityInput.clear();
        
        await quantityInput.fill(String(quantity));
		await quantityInput.press('Enter');
        
        //const increaseQuantity = this.cartItems.nth(index).getByRole('button',{name:"Increase quantity" });
        //await increaseQuantity.click();
       
        console.log('After Enter:', await quantityInput.inputValue());

        const repsonse = await responsePromise;
    
        const jsonData = await repsonse.json()
        //console.log(jsonData);
        //await this.page.waitForTimeout(3000);
        console.log(oldSubtotalText);
       await expect(this.cartItems.nth(index).locator('div.productPrice').locator('p')).not.toHaveText(oldSubtotalText);
       console.log(await this.cartItems.nth(index).locator('div.productPrice').locator('p').innerText());

        const value = await quantityInput.inputValue();
        const intValue = parseInt(value);
        expect(intValue).toEqual(quantity);
       

	}

	async proceedToCheckout(): Promise<void> {
		await expect(this.checkoutButton).toBeEnabled();
		await this.checkoutButton.click();
	}
    async checkOrderSummary(item:number):Promise<number>{
        await expect(this.summarySection.getByRole('heading',{name:"Order summary"})).toBeVisible();
        const subtotalText = await this.summarySection.locator('div[data-locator=text_Subtotal]').innerText();
    
        const quantity = subtotalText.match(/Subtotal \((\d+) item\)/);
        
        expect(String(item)).toEqual(quantity?quantity[1]:0);
        const subtotal = await this.summarySection.locator('div[data-locator=text_NumberSubtotalValue]').innerText();

        const subtotalFloat = parseFloat(subtotal.trim().substring(1));
        return subtotalFloat;
    }
}
