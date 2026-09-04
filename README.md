# zoko-mcp

Read-only MCP server for Zoko WhatsApp message templates.

Tools:
- `list_templates` - all approved templates
- `get_template` - one template by id or name

Config:

```json
{
  "mcpServers": {
    "zoko": {
      "command": "node",
      "args": ["/home/rocktim/zoko-mcp/server.js"],
      "env": { "ZOKO_API_KEY": "your-key" }
    }
  }
}
```
