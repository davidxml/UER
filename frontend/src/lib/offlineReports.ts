import { api } from './api'

export type SubmitOutcome<T> =
  | { status: 'sent'; data: T }
  | { status: 'queued' }

interface QueueStateMessage {
  type: 'uer:queue-state'
  pending: number
}

function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError
}

export function subscribeToQueueState(
  callback: (pending: number) => void,
): () => void {
  const handler = (event: MessageEvent) => {
    const data = event.data as QueueStateMessage | null
    if (data?.type === 'uer:queue-state') callback(data.pending)
  }
  navigator.serviceWorker.addEventListener('message', handler)
  return () => navigator.serviceWorker.removeEventListener('message', handler)
}

export async function submitReport<T>(
  path: string,
  body: unknown,
): Promise<SubmitOutcome<T>> {
  try {
    const data = await api.post<T>(path, body)
    return { status: 'sent', data }
  } catch (error) {
    if (!isNetworkFailure(error)) throw error
    return { status: 'queued' }
  }
}
