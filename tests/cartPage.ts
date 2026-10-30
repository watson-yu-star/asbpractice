import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class CartPage extends BasePage {
	private readonly cartItems: Locator;
	private readonly checkoutButton: Locator;
    private readonly findStoreDiv: Locator;
    private readonly summarySection: Locator;
    private readonly clickCollectEelement: Locator;
    private readonly selectStoreCombobox: Locator;
    private readonly autoSuggestionListBox: Locator;
    private readonly promiseEelement: Locator;

	constructor(page: Page) {
    	super(page);
		this.cartItems = page.locator('.cartTileContainer');
		//this.checkoutButton = page.getByRole('button', { name: /Continue to checkout/i });
        this.findStoreDiv = page.getByRole('button', { name: 'Find a store', exact: true });
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
          await element.waitFor({ state: 'attached' });
          await element.evaluate(node => (node as HTMLElement).click());
       }
    }

    async selectStore(postCode:string,storeName:string):Promise<Locator>{
        await expect(this.page.getByText(/Select a store to check product availability./i)).toBeVisible();
        await expect(this.findStoreDiv).toBeVisible();
        if (await this.getBrowserEngine() === 'webkit') {
            await this.findStoreDiv.evaluate(button => (button as HTMLButtonElement).click());
            await expect(this.page.getByRole('dialog').getByRole('heading', { name: 'Find a store' })).toBeVisible();
        } else {
            await this.findStoreDiv.click();
        }
        const suggestionsResponse = this.page.waitForResponse(response =>
            response.url().includes(
                'maps.googleapis.com/maps/api/place/js/AutocompletionService.GetPredictionsJson'
            ) && response.ok()
        );
        await expect(this.selectStoreCombobox).toBeEnabled();
        await this.selectStoreCombobox.fill(postCode);
       //await this.autoSuggestionListBox.fill(postCode);
       await suggestionsResponse;
       await expect(this.page.locator('#storeAutoSuggest-listbox')).toBeVisible();
        
        const optionElement =  this.autoSuggestionListBox.getByRole('option', {
                    name: 'Auckland 1050',
                    exact: true,
            });

        //this.page.pause();

        await expect(optionElement).toBeVisible();
        await optionElement.click();

      
        await this.page.getByRole('button', { name: `${storeName}` })
                       .click();
        const buttonName = `Click & Collect from ${storeName}`;
        const useStoreButton = this.page.getByRole('button', { name: buttonName });
        if (await this.getBrowserEngine() === 'webkit') {
            //await useStoreButton.evaluate(button => (button as HTMLButtonElement).click());
            //await this.page.waitForTimeout(500);
             await useStoreButton.click();
        } else {
            await useStoreButton.click();
        }
       
        const spinner = this.page.getByRole('img', { name: 'loading' });

        // Wait until loading finishes:
        await expect(spinner).toBeHidden();
                       
       const storeCard = this.page
                            .getByRole('button')
                            .filter({ has: this.page.locator('p', { hasText: `${storeName}` }) });
       await expect(storeCard).toBeVisible();

       return storeCard;
      
    }

	async getItemCount(): Promise<Locator> {
        const spinner = this.page.getByRole('img', { name: 'loading' });

        //await expect(spinner).toBeVisible();
        await expect(spinner).toBeHidden();

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
       const price = this.cartItems.nth(index)
            .locator('p')
            .filter({ hasText: /\$\s*\d/ });

        await expect(price).toBeVisible();
        const value = await price.innerText();
        const numericPrice = Number(value.replace(/[^\d.]/g, ''));
        if (!Number.isFinite(numericPrice)) {
            throw new Error(`Could not parse cart item price from "${value}".`);
        }
        return numericPrice;
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
      
        if (await this.getBrowserEngine() === 'webkit') {
             this.page.waitForTimeout(500);
            // await this.checkoutButton.waitFor({ state: 'attached' });
		     await expect(this.checkoutButton).toBeEnabled();
          
            await this.checkoutButton.click();
           
        } else {
            await this.checkoutButton.click();
        }

        await expect(this.page.getByRole('button', { name: 'Sign in or sign up' })).toBeVisible();
	}
    async checkOrderSummary(item:number):Promise<number>{
        await expect(this.summarySection.getByRole('heading',{name:"Order summary"})).toBeVisible();
        const subtotalRow = this.summarySection.getByRole('row')
            .filter({ hasText: /^Subtotal \(\d+ items?\)/ });
        const subtotalText = await subtotalRow.getByRole('cell').first().innerText();

        const quantity = subtotalText.match(/Subtotal \((\d+) item\)/);
        expect(String(item)).toEqual(quantity?quantity[1]:0);
        const subtotalValue = subtotalRow.getByRole('cell').nth(1);
        await expect(subtotalValue).toBeVisible();
        const subtotal = await subtotalValue.innerText();

        const subtotalFloat = parseFloat(subtotal.replace(/[^\d.]/g, ''));
        return subtotalFloat;
    }
}
