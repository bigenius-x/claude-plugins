# biGENIUS-X modeling plugin for Claude Code

Skill, MCP server entry and hook for modeling biGENIUS-X projects with the biGENIUS modeling MCP server.

| Path | Content |
| --- | --- |
| `skills/bigenius-x-modeling/SKILL.md` | When to use the tools, the process, one worked example |
| `.mcp.json` | Server `bigenius-modeling` (HTTP, `https://<host>/modeling`; host from `BIGENIUS_MCP_HOST`) |
| `hooks/` | PreToolUse hook on Edit/Write: reminds the model to use the tools for structural changes of `modelobjects/**/*.yml` and `views/*.yml` (needs Node.js) |
| `.claude-plugin/` | Plugin manifest and marketplace entry |

Install from the private marketplace (repository URL of this folder):

```
/plugin marketplace add <git URL or path of this client folder>
/plugin install bigenius-x-modeling@bigenius
```

Without the plugin, add the server only:

```bash
claude mcp add --transport http bigenius-modeling https://<host>/modeling
```

The modeling guides come from the server (`get_modeling_guide`), so the skill stays small. The plugin contains no
generator configuration and no internal rules.
