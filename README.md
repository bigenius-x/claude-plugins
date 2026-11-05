# biGENIUS Claude plugins

Plugin `bigenius-x-modeling` for Claude Code: model biGENIUS-X projects (Stage, Raw Vault, Business Vault, Mart) with
the biGENIUS modeling MCP server.

| Path | Content |
| --- | --- |
| `skills/bigenius-x-modeling/SKILL.md` | When to use the tools, the process, one worked example |
| `.mcp.json` | Server `bigenius-modeling` (HTTP, `https://mcp.bigenius-x.com/modeling`) |
| `hooks/` | Reminds Claude to make structural changes of `modelobjects/**/*.yml` and `views/*.yml` with the tools; allows the file transfer commands of `open_workspace` and `download_changes` |
| `.claude-plugin/` | Plugin manifest and marketplace `bigenius` |

## Requirements

- [Claude Code](https://claude.com/claude-code): terminal or the Code tab of Claude Desktop
- Git and Node.js (for the hook)
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

Everyone who opens the repository in Claude Code is asked to trust the folder and to install the plugin. Then:

1. Log in with the biGENIUS account. In the terminal: run `/mcp` and select `bigenius-modeling`. In the Code tab of
   Claude Desktop: start a session and send a first message, because the server connects only in a running session;
   then open the MCP servers of the session and select **Connect** at `bigenius-modeling`.
2. Ask, for example: "Which layers and objects does the project have?" or "Build Hub, Satellite and Dimension for
   Customer from the CRM discovery."

For yourself only, without a change in the repository:

```
/plugin marketplace add bigenius-x/claude-plugins
/plugin install bigenius-x-modeling@bigenius
```

## Update

```
/plugin marketplace update bigenius
```

Then restart Claude Code.

## Troubleshooting

- **Login fails or the tools are missing:** in the Code tab of Claude Desktop, open the MCP servers of a running session
  and connect `bigenius-modeling` again; in the terminal, `/mcp`. Claude Code needs a new login after 24 hours.
- **The upload or download command waits for approval:** the plugin's hook allows exactly the transfer commands that
  `open_workspace` and `download_changes` return, for the server of the plugin. If Claude changes the command (for
  example adds `cd` or an exit code check), or the hook cannot run (Node.js missing), the normal permission check
  applies: approve the command in the chat. In auto mode it can be refused instead: ask Claude to run the command again
  exactly as returned. Delete commands of `download_changes` always need the approval.

## Claude Desktop chat and claude.ai

Plugins and hooks work only in Claude Code. In the chat:

1. Add the server as a custom connector: Settings → Connectors → Add custom connector,
   URL `https://mcp.bigenius-x.com/modeling`.
2. Optional: download this repository as ZIP (Code → Download ZIP), pack the folder `skills/bigenius-x-modeling` as
   its own ZIP and upload it under Settings → Capabilities → Skills.

The modeling guides come from the server (`get_modeling_guide`), so the skill stays small. The plugin contains no
generator configuration and no internal rules.
