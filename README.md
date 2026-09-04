# zoko-mcp

Read-only MCP server for [Zoko](https://www.zoko.io) WhatsApp message templates.

Tools:

1. `list_templates` - all approved templates
2. `get_template` - one template by id or name

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
