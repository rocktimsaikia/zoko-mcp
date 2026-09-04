#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API = 'https://chat.zoko.io/v2'

export async function getTemplates(apikey = process.env.ZOKO_API_KEY) {
  if (!apikey) throw new Error('ZOKO_API_KEY not set')
  const res = await fetch(`${API}/account/templates`, { headers: { apikey } })
  if (!res.ok) throw new Error(`Zoko ${res.status}: ${await res.text()}`)
  return res.json()
}

// ponytail: Zoko has no get-one-template endpoint, so filter the list.
export function findTemplate(templates, id) {
  return templates.find((t) => t.id === id || t.templateId === id || t.name === id || t.templateName === id)
}

const server = new McpServer({ name: 'zoko', version: '0.1.0' })

server.tool('list_templates', 'List all approved Zoko WhatsApp message templates', {}, async () => ({
  content: [{ type: 'text', text: JSON.stringify(await getTemplates(), null, 2) }],
}))

server.tool(
  'get_template',
  'Get one Zoko message template by id or name',
  { template: z.string().describe('template id or name') },
  async ({ template }) => {
    const found = findTemplate(await getTemplates(), template)
    return {
      isError: !found,
      content: [
        { type: 'text', text: found ? JSON.stringify(found, null, 2) : `No template matching "${template}"` },
      ],
    }
  },
)

if (process.argv[1]?.endsWith('server.js')) await server.connect(new StdioServerTransport())
