#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API = 'https://chat.zoko.io/v2'
const HOUR = 60 * 60 * 1000
const TEN_MIN = 10 * 60 * 1000

const cache = new Map()

// ponytail: Zoko drops the connection partway through the ~1.3MB template body
// often enough to matter, so one retry. No backoff, the failure is instant.
async function request(path, apikey = process.env.ZOKO_API_KEY) {
  if (!apikey) throw new Error('ZOKO_API_KEY not set')
  let lastErr
  for (let i = 0; i < 2; i++) {
    let res
    try {
      res = await fetch(`${API}${path}`, { headers: { apikey } })
    } catch (err) {
      lastErr = err
      continue
    }
    // A 4xx is the answer, not a blip. Only the dropped body is worth retrying.
    if (!res.ok) throw new Error(`Zoko ${res.status}: ${(await res.text()).slice(0, 200)}`)
    try {
      return await res.json()
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

async function cached(path, ttl, apikey, fresh) {
  const hit = cache.get(path)
  if (!fresh && hit && Date.now() - hit.at < ttl) return hit.data
  const data = await request(path, apikey)
  cache.set(path, { at: Date.now(), data })
  return data
}

export const getTemplates = ({ apikey, fresh = false } = {}) =>
  cached('/account/templates', HOUR, apikey, fresh)

// ponytail: /customer allows one request per 300s, so the cache is not an
// optimisation here - without it a second call in the same minute just 429s.
export const listCustomers = ({ page = 1, apikey, fresh = false } = {}) =>
  cached(`/customer?channel=whatsapp&page=${page}`, TEN_MIN, apikey, fresh)

export const getCustomer = (id, apikey) => request(`/customer/${encodeURIComponent(id)}`, apikey)

// ponytail: webhooks and groups are small and both have a /{id} endpoint, so no
// cache, no filtering. Only templates need the workaround.
export const listWebhooks = (apikey) => request('/webhook', apikey)
export const getWebhook = (id, apikey) => request(`/webhook/${encodeURIComponent(id)}`, apikey)

const GROUPS = '/channels/whatsapp/cloud/group'
export const listGroups = (apikey) => request(GROUPS, apikey)
export const getGroup = (id, apikey) => request(`${GROUPS}/${encodeURIComponent(id)}`, apikey)

// ponytail: no per-id endpoint exists (GET /account/templates/{id} is a 404), and
// templateId is not unique across languages, so filter rather than find.
export function findTemplate(templates, templateId) {
  return templates.filter((t) => t.templateId === templateId)
}

const server = new McpServer({ name: 'zoko', version: '1.0.1' })

server.tool('list_templates', 'List all approved Zoko WhatsApp message templates', {}, async () => ({
  content: [{ type: 'text', text: JSON.stringify(await getTemplates(), null, 2) }],
}))

server.tool(
  'get_template',
  'Get a Zoko message template by its exact templateId',
  { templateId: z.string().describe('exact templateId, e.g. signup_user_mql_nudge_step1_sep_2026') },
  async ({ templateId }) => {
    const found = findTemplate(await getTemplates(), templateId)
    return {
      isError: found.length === 0,
      content: [
        {
          type: 'text',
          text: found.length ? JSON.stringify(found, null, 2) : `No template with templateId "${templateId}"`,
        },
      ],
    }
  },
)

server.tool('list_webhooks', 'List all webhooks configured on the Zoko account', {}, async () => ({
  content: [{ type: 'text', text: JSON.stringify(await listWebhooks(), null, 2) }],
}))

server.tool(
  'get_webhook',
  'Get one Zoko webhook by its id',
  { id: z.string().describe('webhook id, a uuid') },
  async ({ id }) => ({
    content: [{ type: 'text', text: JSON.stringify(await getWebhook(id), null, 2) }],
  }),
)

server.tool('list_groups', 'List all active WhatsApp groups on the Zoko account', {}, async () => ({
  content: [{ type: 'text', text: JSON.stringify(await listGroups(), null, 2) }],
}))

server.tool(
  'get_group',
  'Get one WhatsApp group, including its participants, by id',
  { id: z.string().describe('group id, a customer uuid') },
  async ({ id }) => ({
    content: [{ type: 'text', text: JSON.stringify(await getGroup(id), null, 2) }],
  }),
)

server.tool(
  'list_customers',
  'List WhatsApp customers, one page of 100 at a time. Zoko allows one request per 300 seconds, so pages are cached for ten minutes and fetching every page is not practical.',
  { page: z.number().int().min(1).default(1).describe('1-based page number') },
  async ({ page }) => ({
    content: [{ type: 'text', text: JSON.stringify(await listCustomers({ page }), null, 2) }],
  }),
)

server.tool(
  'get_customer',
  'Get one customer by id, including their channels, tags and assignment',
  { id: z.string().describe('customer id, a uuid') },
  async ({ id }) => ({
    content: [{ type: 'text', text: JSON.stringify(await getCustomer(id), null, 2) }],
  }),
)

if (process.argv[1]?.endsWith('server.js')) await server.connect(new StdioServerTransport())
