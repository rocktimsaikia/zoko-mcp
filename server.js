#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API = 'https://chat.zoko.io/v2'
const TTL_MS = 60 * 60 * 1000

let cache = null

// ponytail: Zoko drops the connection partway through this ~1.3MB body often
// enough to matter, so one retry. No backoff, the failure is instant.
async function fetchTemplates(apikey) {
  let lastErr
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch(`${API}/account/templates`, { headers: { apikey } })
      if (!res.ok) throw new Error(`Zoko ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return await res.json()
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

export async function getTemplates({ apikey = process.env.ZOKO_API_KEY, fresh = false } = {}) {
  if (!apikey) throw new Error('ZOKO_API_KEY not set')
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.data
  const data = await fetchTemplates(apikey)
  cache = { at: Date.now(), data }
  return data
}

// ponytail: no per-id endpoint exists (GET /account/templates/{id} is a 404), and
// templateId is not unique across languages, so filter rather than find.
export function findTemplate(templates, templateId) {
  return templates.filter((t) => t.templateId === templateId)
}

const server = new McpServer({ name: 'zoko', version: '0.1.0' })

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

if (process.argv[1]?.endsWith('server.js')) await server.connect(new StdioServerTransport())
