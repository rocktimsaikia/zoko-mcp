# zoko-mcp

Read-only MCP server for [Zoko](https://www.zoko.io) WhatsApp message templates.

## Tools

1. `list_templates` - every approved template. No arguments.
2. `get_template` - one template by its exact `templateId`.

Both read `GET /account/templates`, the only endpoint Zoko exposes for templates. There is no
per-id endpoint, so `get_template` filters the full list. That call takes ~40s and returns
~1.3MB, so the list is cached in memory for an hour.

## Install

```sh
git clone https://github.com/rocktimsaikia/zoko-mcp
cd zoko-mcp
npm install
```

Get your API key from [Zoko → API & Webhooks](https://app.live.zoko.io/more/webhooks/api).

## Use

Claude Code:

```sh
claude mcp add zoko -e ZOKO_API_KEY=your-key -- node /abs/path/to/zoko-mcp/server.js
```

Or any MCP client, via config:

```json
{
  "mcpServers": {
    "zoko": {
      "command": "node",
      "args": ["/abs/path/to/zoko-mcp/server.js"],
      "env": { "ZOKO_API_KEY": "your-key" }
    }
  }
}
```

## License

MIT © Rocktim Saikia
