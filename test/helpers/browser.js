import puppeteer from 'puppeteer'

export async function setup({ context, log }) {
  log('Setting up browser')
  const browser = await puppeteer.launch()
  Object.assign(context, { browser })
}

export async function teardown({ context, log }) {
  log('Tearing down browser')
  await context.browser.close()
  delete context.browser
}

export async function giveNewPage(t, next, ...rest) {
  const { browser } = t.context
  const page = await browser.newPage()
  page.setDefaultTimeout(2000)
  page.on('pageerror', error => t.fail(error.message))
  page.on('error', error => t.fail(error.message))
  page.on('requestfailed', request =>
    t.fail(`${request.failure().errorText} ${request.url()}`))

  try {
    await next(t, page, ...rest)
  }
  finally {
    await page.close()
  }
}
