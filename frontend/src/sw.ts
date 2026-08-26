/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: readonly { url: string; revision: string | null }[]
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//],
  }),
)

const MUTATION_QUEUE = 'uer-api-mutations'
const GET_CACHE = 'uer-api-cache'

async function broadcastQueueState(pending: number): Promise<void> {
  const clients = await self.clients.matchAll({ includeUncontrolled: true })
  for (const client of clients) {
    client.postMessage({ type: 'uer:queue-state', pending })
  }
}

const bgSyncPlugin = new BackgroundSyncPlugin(MUTATION_QUEUE, {
  maxRetentionTime: 24 * 60,
  async onSync({ queue }) {
    let failure: unknown
    try {
      await queue.replayRequests()
    } catch (error) {
      failure = error
    }
    await broadcastQueueState(await queue.size())
    if (failure) throw failure
  },
})

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && request.method !== 'GET',
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
)

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && request.method === 'GET',
  new NetworkFirst({
    cacheName: GET_CACHE,
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

self.skipWaiting()
clientsClaim()
