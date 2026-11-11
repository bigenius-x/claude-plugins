// PreToolUse hook: when a model object or view file of a biGENIUS-X project is edited directly, remind the model
// to use the modeling tools for structural changes and to call sync_workspace afterwards. Never blocks the edit.
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let filePath = "";
  try {
    filePath = (JSON.parse(input).tool_input || {}).file_path || "";
  } catch {
    return;
  }
  const normalized = filePath.replace(/\\/g, "/");
  if (!/(^|\/)(modelobjects\/[^/]+|views)\/[^/]+\.ya?ml$/i.test(normalized)) {
    return;
  }
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext:
        "This is a biGENIUS-X model file. Edit only expressions, descriptions and properties by hand. " +
        "Terms, keys, relationships, dataflow sources, names and deletions go through the bigenius-modeling tools " +
        "(they keep foreign keys, hash keys, default terms and mapping stubs consistent). " +
        "After manual edits call sync_workspace, then validate_project.",
    },
  }));
});
