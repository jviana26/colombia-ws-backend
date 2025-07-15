// bot.js
const { Builder, By, until } = require("selenium-webdriver");

async function comprarConTarjeta(tarjeta) {
  const driver = await new Builder().forBrowser("chrome").build();

  try {
    await driver.get(
      "https://timelesstattoosupply.com/product/wing-nuts-steel-bat/"
    );
    console.log("✅ Página cargada");

    const selectPackSize = await driver.wait(
      until.elementLocated(By.id("pack-size")),
      10000
    );
    await driver.executeScript(
      "arguments[0].value = '1'; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
      selectPackSize
    );
    console.log('✅ Opción "1" seleccionada');

    await driver.sleep(2000);

    const addToCartBtn = await driver.findElement(
      By.css("button.single_add_to_cart_button")
    );
    await driver.executeScript(
      'arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });',
      addToCartBtn
    );
    await driver.wait(
      async () => !(await addToCartBtn.getAttribute("disabled")),
      5000
    );
    await addToCartBtn.click();
    console.log("✅ Producto agregado al carrito");

    const viewCartBtn = await driver.wait(
      until.elementLocated(By.css(".woocommerce-message a.button.wc-forward")),
      10000
    );
    await viewCartBtn.click();
    console.log('✅ Click en "View cart" realizado');

    const proceedToCheckoutBtn = await driver.wait(
      until.elementLocated(By.css(".wc-proceed-to-checkout a.checkout-button")),
      10000
    );
    await proceedToCheckoutBtn.click();
    console.log('✅ Click en "Proceed to checkout" realizado');

    const iframe = await driver.wait(
      until.elementLocated(
        By.css(
          'iframe[name^="__privateStripeFrame"], iframe[src*="stripe"], iframe'
        )
      ),
      20000
    );
    console.log("✅ Iframe de Stripe detectado");

    await driver.switchTo().frame(iframe);
    console.log("✅ Contexto cambiado al iframe de Stripe");

    const [numeroTarjeta, mes, anio, cvc] = tarjeta
      .split("|")
      .map((x) => x.trim());
    const yy = anio.slice(-2);

    const numberInput = await driver.wait(
      until.elementLocated(By.css("#Field-numberInput")),
      10000
    );
    await numberInput.sendKeys(numeroTarjeta);

    const expiryInput = await driver.findElement(By.css("#Field-expiryInput"));
    await expiryInput.sendKeys(`${mes} / ${yy}`);

    const cvcInput = await driver.findElement(By.css("#Field-cvcInput"));
    await cvcInput.sendKeys(cvc);

    await driver.switchTo().defaultContent();

    await driver.findElement(By.id("billing_first_name")).sendKeys("Juan");
    await driver.findElement(By.id("billing_last_name")).sendKeys("Pérez");
    await driver
      .findElement(By.id("billing_address_1"))
      .sendKeys("123 Calle Principal");
    await driver.findElement(By.id("billing_city")).sendKeys("Ciudad");
    await driver.findElement(By.id("billing_postcode")).sendKeys("90012");
    await driver
      .findElement(By.id("billing_email"))
      .sendKeys("juanperez@example.com");

    const termsCheckbox = await driver.findElement(By.id("terms"));
    await driver.executeScript(
      "arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });",
      termsCheckbox
    );
    await driver.sleep(500);
    await termsCheckbox.click();

    const placeOrderBtn = await driver.findElement(By.id("place_order"));
    await driver.executeScript(
      "arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });",
      placeOrderBtn
    );
    await driver.sleep(500);
    await placeOrderBtn.click();

    await driver.sleep(5000);

    let status = "LIVE";

    try {
      const errorElement = await driver.findElement(
        By.css(".woocommerce-error")
      );
      const errorText = await errorElement.getText();
      console.log(`❌ Mensaje de error detectado: ${errorText}`);

      if (
        errorText.toLowerCase().includes("card") ||
        errorText.toLowerCase().includes("declined")
      ) {
        status = "DEAD";
      } else {
        status = "DEAD";
      }
    } catch (e) {
      console.log("✅ No se detectaron errores de pago, se asume LIVE");
    }

    console.log(`✅ Resultado tarjeta: ${tarjeta} -> ${status}`);
    return { tarjeta, status };
  } catch (e) {
    console.error("❌ ERROR:", e);
    return { tarjeta, status: "DEAD" };
  } finally {
    await driver.quit();
  }
}

async function procesarTarjetas(tarjetas, onResult) {
  for (let i = 0; i < tarjetas.length; i++) {
    console.log(`👉 Probando tarjeta ${i + 1} de ${tarjetas.length}`);
    const resultado = await comprarConTarjeta(tarjetas[i]);

    if (typeof onResult === "function") {
      onResult(resultado);
    }

    if (i < tarjetas.length - 1) {
      const delay = 10000; //TIEMPO PARA INCIAR SEGUNDO
      console.log(`⏳ Esperando ${delay / 1000}s antes de la siguiente compra...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = { procesarTarjetas };
