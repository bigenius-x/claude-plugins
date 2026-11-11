# biGENIUS Claude plugins

Marketplace `bigenius` with two plugins for Claude Code:

| Plugin | Server | Content |
| --- | --- | --- |
| `bigenius-x-modeling` | `bigenius-modeling`, `https://mcp.bigenius-x.com/modeling` | Model biGENIUS-X projects of every generator (Stage, Data Vault, Dimensional, Datastore, Mart): skill, server entry and hooks |
| `bigenius-data-marketplace` | `bigenius-marketplace`, `https://mcp.bigenius-x.com/marketplace` | Find data products in the Data Marketplace and write SQL for their output ports: skill and server entry |

| Path | Content |
| --- | --- |
| `.claude-plugin/marketplace.json` | Marketplace `bigenius` |
| `plugins/<plugin>/.claude-plugin/plugin.json` | Plugin manifest |
| `plugins/<plugin>/.mcp.json` | Server entry |
| `plugins/<plugin>/skills/` | When to use the tools, the process |
| `plugins/bigenius-x-modeling/hooks/` | Reminds Claude to make structural changes of `modelobjects/**/*.yml` and `views/*.yml` with the tools; allows the file transfer commands of `open_workspace` and `download_changes` |

## Requirements

- [Claude Code](https://claude.com/claude-code): terminal or the Code tab of Claude Desktop
- Git, and Node.js for the hooks of the modeling plugin
- A biGENIUS account; the server asks for the login on first use

## Install for a biGENIUS-X project

Commit this file as `.claude/settings.json` in the root of the biGENIUS-X repository (where `project.yml` is):

```json
{
  "extraKnownMarketplaces": {
    "bigenius": {
      "source": { "source": "github", "repo": "bigenius-x/claude-plugins" }
    }
  },
  "enabledPlugins": {
    "bigenius-x-modeling@bigenius": true
  }
}
```

Add `"bigenius-data-marketplace@bigenius": true` for the Data Marketplace. Everyone who opens the repository in Claude
Code is asked to trust the folder and to install the plugins. Then:

1. Log in with the biGENIUS account. In the terminal: run `/mcp` and select the server (`bigenius-modeling`,
   `bigenius-marketplace`). In the Code tab of Claude Desktop: start a session and send a first message, because the
   servers connect only in a running session; then open the MCP servers of the session and select **Connect**.
2. Ask, for example: "Which layers and objects does the project have?", "Build a dimension for Customer from the CRM
   discovery." or "Is there a data product for revenue per branch? Write the SQL."

For yourself only, without a change in the repository:

```
/plugin marketplace add bigenius-x/claude-plugins
/plugin install bigenius-x-modeling@bigenius
/plugin install bigenius-data-marketplace@bigenius
```

## Update

```
/plugin marketplace update bigenius
```

Then restart Claude Code.

**Installed before the plugins moved into `plugins/`:** uninstall `bigenius-x-modeling` once and install it again
(`/plugin uninstall bigenius-x-modeling@bigenius`, `/plugin marketplace update bigenius`,
`/plugin install bigenius-x-modeling@bigenius`).

## Troubleshooting

- **Login fails or the tools are missing:** in the Code tab of Claude Desktop, open the MCP servers of a running session
  and connect the server again; in the terminal, `/mcp`. Claude Code needs a new login after 24 hours.
- **The upload or download command waits for approval:** the hook of the modeling plugin allows exactly the transfer
  commands that `open_workspace` and `download_changes` return, for the server of the plugin. If Claude changes the
  command (for example adds `cd` or an exit code check), or the hook cannot run (Node.js missing), the normal permission
  check applies: approve the command in the chat. In auto mode it can be refused instead: ask Claude to run the command
  again exactly as returned. Delete commands of `download_changes` always need the approval.

## Claude Desktop chat and claude.ai

Plugins and hooks work only in Claude Code. In the chat:

1. Add the server as a custom connector: Settings → Connectors → Add custom connector,
   URL `https://mcp.bigenius-x.com/modeling` or `https://mcp.bigenius-x.com/marketplace`.
2. Optional: download this repository as ZIP (Code → Download ZIP), pack the folder `plugins/<plugin>/skills/<skill>`
   as its own ZIP and upload it under Settings → Capabilities → Skills.

The modeling guides come from the server (`get_modeling_guide`) and the rules for SQL from the marketplace tools, so
the skills stay small. The plugins contain no generator configuration and no internal rules.
