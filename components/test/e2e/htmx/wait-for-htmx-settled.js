export async function waitForHtmx(page, f) {
  try {
    await page.evaluate(() =>
      window.addEventListener(
        'htmx:afterSettle',
        () =>
          //@ts-ignore
          (window.TEST_isHtmxSettled = true),
        {once: true},
      ),
    )
    const ret = await f()

    await page.waitForFunction(
      () =>
        //@ts-ignore
        window.TEST_isHtmxSettled === true,
    )
    await page.evaluate(
      () =>
        //@ts-ignore
        delete window.TEST_isHtmxSettled,
    )

    return ret
  } finally {
  }
}
