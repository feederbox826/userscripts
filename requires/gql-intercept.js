function gqlIntercept() {
  // exit early if exists
  if (unsafeWindow?.fbox826?.gqlListener || window?.fbox826?.gqlListener) return

  // monkeypatch window fetch to intercept graphQL requests
  const { fetch: originalFetch } = unsafeWindow

  // gqlListener.addEventListener('response', (e) => console.log(e.detail))

  const gqlListener = new EventTarget()

  const interceptors = []

  unsafeWindow.fbox826 = {
    gqlListener,
    interceptors
  }

  const preCheck = (response) =>
    response.headers.get("Content-Type") == "application/json" &&
    response.url.endsWith("/graphql")

  const responseInterceptor = async (response) => {
    // skip if not ok or not a graphql request
    if (!response.ok || !preCheck(response)) return response
    // get response data
    let data = await response.clone().json()
    // run interceptors
    for (const interceptor of interceptors) data = await interceptor(data)
    // trigger response event
    gqlListener.dispatchEvent(new CustomEvent("response", { detail: data }))
    // return response
    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
  }

  unsafeWindow.fetch = async (...args) => {
    const [request, config] = args
    // request interceptor here
    const response = await originalFetch(request, config)
    // response interceptor
    try { return await responseInterceptor(response) }
    catch (e) { return response }
  }
}
