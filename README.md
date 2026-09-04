# zoko-mcp

Read-only MCP server for integrating [Zoko](https://www.zoko.io) with AI assistants like Claude.

[![Test](https://github.com/rocktimsaikia/zoko-mcp/actions/workflows/test.yml/badge.svg)](https://github.com/rocktimsaikia/zoko-mcp/actions/workflows/test.yml)
[![Release](https://github.com/rocktimsaikia/zoko-mcp/actions/workflows/release.yml/badge.svg)](https://github.com/rocktimsaikia/zoko-mcp/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/zoko-mcp)](https://www.npmjs.com/package/zoko-mcp)

## Tools

1. `list_templates` - every approved template. No arguments.
2. `get_template` - one template by its exact `templateId`.
3. `list_webhooks` - every webhook on the account. No arguments.
4. `get_webhook` - one webhook by its id.
5. `list_groups` - every active WhatsApp group. No arguments.
6. `get_group` - one group, including its participants, by id.
7. `list_customers` - one page of 100 WhatsApp customers.
8. `get_customer` - one customer by id, with channels, tags and assignment.

Zoko exposes no per-id endpoint for templates, so `get_template` filters the full list. That
call takes ~40s and returns ~1.3MB, so the list is cached in memory for an hour. Webhooks are
small and do have a per-id endpoint, so they are fetched fresh every time.

`/customer` allows one request per 300 seconds, so pages are cached for ten minutes. With
~1.1M customers across ~10,900 pages, listing them all is not practical - use it to sample,
and `get_customer` to look one up.

## Setup

Get your API key from [Zoko → API & Webhooks](https://app.live.zoko.io/more/webhooks/api).

Claude Code:

```sh
claude mcp add zoko -e ZOKO_API_KEY=your-key -- npx -y zoko-mcp
```

Or any MCP client, via config:

```json
{
  "mcpServers": {
    "zoko": {
      "command": "npx",
      "args": ["-y", "zoko-mcp"],
      "env": { "ZOKO_API_KEY": "your-key" }
    }
  }
}
```

## License

MIT © Rocktim Saikia
