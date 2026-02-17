/**
 * Voyage AI embedding client — raw fetch, same pattern as src/lib/ai/client.ts.
 *
 * Model: voyage-3-lite (512 dimensions, optimized for retrieval).
 * Batch limit: 128 texts per request.
 */

const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings'
const MODEL = 'voyage-3-lite'
const BATCH_SIZE = 128
const MAX_RETRIES = 3

type InputType = 'document' | 'query'

interface VoyageResponse {
  data: Array<{ embedding: number[] }>
  usage: { total_tokens: number }
}

/**
 * Generate embeddings for multiple texts.
 * Automatically chunks into batches of 128.
 */
export async function generateEmbeddings(
  texts: string[],
  inputType: InputType = 'document'
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error('VOYAGE_API_KEY not set')

  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const embeddings = await fetchWithRetry(batch, inputType, apiKey)
    allEmbeddings.push(...embeddings)
  }

  return allEmbeddings
}

/**
 * Generate a single embedding.
 */
export async function generateEmbedding(
  text: string,
  inputType: InputType = 'document'
): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text], inputType)
  return embedding
}

async function fetchWithRetry(
  texts: string[],
  inputType: InputType,
  apiKey: string,
  attempt = 0
): Promise<number[][]> {
  const response = await fetch(VOYAGE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: texts,
      input_type: inputType,
    }),
  })

  if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = parseInt(response.headers.get('retry-after') ?? '2', 10)
    const delay = Math.max(retryAfter, 1) * 1000 * (attempt + 1)
    console.warn(`[Voyage] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1})`)
    await new Promise((r) => setTimeout(r, delay))
    return fetchWithRetry(texts, inputType, apiKey, attempt + 1)
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Voyage API error: ${response.status} ${errorText}`)
  }

  const data: VoyageResponse = await response.json()
  return data.data.map((d) => d.embedding)
}

/**
 * Build embedding text for an event.
 * Format: "title | description[:200] | [category] | tags"
 */
export function buildEventEmbeddingText(event: {
  title: string
  description?: string | null
  category?: string | null
  tags?: string[] | null
}): string {
  const parts = [event.title]
  if (event.description) parts.push(event.description.slice(0, 200))
  if (event.category) parts.push(`[${event.category}]`)
  if (event.tags?.length) parts.push(event.tags.join(', '))
  return parts.join(' | ')
}

/**
 * Build embedding text for a source contract.
 * Format: "contract_title [platform]"
 */
export function buildContractEmbeddingText(contract: {
  contract_title: string
  platform: string
}): string {
  return `${contract.contract_title} [${contract.platform}]`
}
