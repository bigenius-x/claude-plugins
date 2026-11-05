// PreToolUse hook: allows the file transfer commands of open_workspace and download_changes without a permission
// prompt. They send the project files with a token in the URL to the server, which auto mode refuses otherwise.
// Only the exact commands of the server (TransferCommands in src/biGENIUS.Mcp.Modeling/Workspaces/WorkspaceTransfer.cs)
// with a workspace URL on the host of this plugin's .mcp.json are allowed. Anything else gets no output, so the normal
// permission check applies. Delete commands are not allowed here.
const fs = require("fs");
const path = require("path");

const entries = ["project.yml", "config.yml", "task-lists.yml", "modelobjects", "views", "discoveries"];
const tar = '& "$env:SystemRoot\\System32\\tar.exe"';
const curl = '& "$env:SystemRoot\\System32\\curl.exe"';

// [kind, command for a url] per tool, as TransferCommands writes them
const commands = {
  Bash: [
    ["upload", (url) => `tar -czf - $(ls -d ${entries.join(" ")} 2>/dev/null) | curl -sf --upload-file - "${url}"`],
    ["download", (url) => `curl -sf "${url}" | tar -xzf -`],
  ],
  PowerShell: [
    ["upload", (url) =>
      `$entries = @(${entries.map((e) => `'${e}'`).join(",")}) | Where-Object { Test-Path -LiteralPath $_ } ; ` +
      `${tar} -czf "$env:TEMP\\bigenius-upload.tgz" @entries ; ${curl} -sf --upload-file "$env:TEMP\\bigenius-upload.tgz" "${url}"`],
    ["download", (url) =>
      `${curl} -sf -o "$env:TEMP\\bigenius-download.tgz" "${url}" ; ${tar} -xzf "$env:TEMP\\bigenius-download.tgz"`],
  ],
};

const paths = {
  upload: /^\/workspaces\/[0-9a-f]{32}\/upload$/,
  download: /^\/workspaces\/[0-9a-f]{32}\/download\/[0-9a-f]{12}$/,
};

function serverOrigin() {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, "..", ".mcp.json"), "utf8"));
  return new URL(config.mcpServers["bigenius-modeling"].url).origin;
}

function isTransferUrl(raw, kind, origin) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  // the url is checked character by character too: it sits in double quotes of a shell command
  return url.href === raw && url.origin === origin && !url.username && !url.password && !url.hash
    && paths[kind].test(url.pathname) && /^\?token=[A-Za-z0-9%._~-]+$/.test(url.search);
}

function allowed(tool, command) {
  const url = /"(https?:\/\/[^"]*)"/.exec(command)?.[1];
  if (!url || !commands[tool]) {
    return false;
  }
  const origin = serverOrigin();
  return commands[tool].some(([kind, build]) => build(url) === command && isTransferUrl(url, kind, origin));
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    if (!allowed(event.tool_name, (event.tool_input || {}).command || "")) {
      return;
    }
  } catch {
    return;
  }
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: "biGENIUS-X file transfer of open_workspace or download_changes to the plugin's server.",
    },
  }));
});
