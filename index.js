import { Builder, By, until } from 'selenium-webdriver';

(async () => {
  const [
    , ,
    cardNumber, expiryDate, cvv,
    billingFirstName, billingLastName, billingAddress1, billingCity, billingPostcode, billingEmail
  ] = process.argv;

  if (!cardNumber || !expiryDate || !cvv || !billingFirstName || !billingLastName || !billingAddress1 || !billingCity || !billingPostcode || !billingEmail) {
    console.error('❌ Faltan argumentos requeridos.');
    process.exit(1);
  }

  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.manage().setTimeouts({ implicit: 15000, pageLoad: 60000 });
    await driver.get('https://timelesstattoosupply.com/product/wing-nuts-steel-bat/');
    console.log('✅ Página cargada');

    // Seleccionar pack-size
    let packSize = await driver.wait(until.elementLocated(By.id('pack-size')), 20000);
    await packSize.findElement(By.css('option[value="1"]')).click();
    console.log('✅ pack-size seleccionado');

    // Add to cart
    let addToCartBtn = await driver.findElement(By.css('button.single_add_to_cart_button'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", addToCartBtn);
    await addToCartBtn.click();
    console.log('✅ Producto añadido al carrito');

    // Ir al carrito
    try {
      let viewCart = await driver.wait(until.elementLocated(By.css('.added_to_cart, .woocommerce-message a.button.wc-forward')), 10000);
      await viewCart.click();
    } catch {
      await driver.get('https://timelesstattoosupply.com/cart/');
    }
    console.log('✅ En el carrito');

    // Checkout
    let checkoutBtn = await driver.wait(until.elementLocated(By.css('.checkout-button')), 15000);
    await checkoutBtn.click();
    console.log('✅ Yendo al checkout');

    // Datos de facturación
    await driver.findElement(By.id('billing_first_name')).sendKeys(billingFirstName);
    await driver.findElement(By.id('billing_last_name')).sendKeys(billingLastName);
    await driver.findElement(By.id('billing_address_1')).sendKeys(billingAddress1);
    await driver.findElement(By.id('billing_city')).sendKeys(billingCity);
    await driver.findElement(By.id('billing_postcode')).sendKeys(billingPostcode);
    await driver.findElement(By.id('billing_email')).sendKeys(billingEmail);
    console.log('✅ Datos de facturación listos');

    // Seleccionar método Stripe si existe
    try {
      const stripeCheckbox = await driver.findElement(By.css('input#payment_method_stripe'));
      const isChecked = await stripeCheckbox.isSelected();
      if (!isChecked) {
        await stripeCheckbox.click();
      }
      console.log('✅ Método de pago Stripe seleccionado');
    } catch {
      console.log('ℹ️ No se encontró selector de método de pago Stripe');
    }

    // Iframe de Stripe
    await driver.wait(async () => {
      const iframes = await driver.findElements(By.css('iframe'));
      return iframes.length > 0;
    }, 20000);

    const iframes = await driver.findElements(By.css('iframe'));
    let stripeFrame;
    for (const iframe of iframes) {
      await driver.switchTo().frame(iframe);
      const hasCardInput = await driver.findElements(By.css('input[name="number"]'));
      if (hasCardInput.length > 0) {
        stripeFrame = iframe;
        break;
      }
      await driver.switchTo().defaultContent();
    }

    if (!stripeFrame) throw new Error('❌ No se encontró el iframe correcto de Stripe');

    console.log('✅ Iframe de Stripe encontrado');
    await driver.findElement(By.css('input[name="number"]')).sendKeys(cardNumber);
    await driver.findElement(By.css('input[name="expiry"]')).sendKeys(expiryDate);
    await driver.findElement(By.css('input[name="cvc"]')).sendKeys(cvv);

    // Volver al contexto principal
    await driver.switchTo().defaultContent();

    // Aceptar términos y hacer pedido
    await driver.findElement(By.id('terms')).click();
    await driver.findElement(By.id('place_order')).click();

    await driver.wait(until.urlContains('order-received'), 45000);
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    console.log(bodyText.includes('Thank you. Your order has been received') ? 'LIVE' : 'DEAD');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('DEAD');
  } finally {
    await driver.quit();
  }
})();
