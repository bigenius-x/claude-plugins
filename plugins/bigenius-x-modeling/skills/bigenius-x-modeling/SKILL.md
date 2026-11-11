---
name: bigenius-x-modeling
description: Model a data warehouse in a biGENIUS-X project with the biGENIUS modeling MCP tools, for every generator (Stage, Data Vault, Dimensional, Datastore, Mart). Use when someone wants to create, change, check or delete model objects in a biGENIUS-X repository, set data quality rules, or build a model from a discovery.
---

# biGENIUS-X modeling

You build the model; biGENIUS-X generates the code from it. You decide what is built, from the model object types the
generator of the project offers. The tools of the MCP server `bigenius-modeling` write the project files the way
the biGENIUS-X UI does: ids, default terms, foreign key and hash key terms, mapping stubs, data quality rules the generator
creates by default, and all follow-up changes when something is renamed or deleted.

The server runs at `https://<host>/modeling`. If the tools are missing, connect it first:
`claude mcp add --transport http bigenius-modeling https://<host>/modeling`

## Rules

1. **No invented ids.** Every GUID comes from a tool (`new_ids` for manual edits) or from an existing file.
2. **Structure changes only through the tools:** `create_model_object`, `add_relationship`, `set_relationship_properties`,
   `set_object_properties`, `set_term_properties`, `set_term_data_type`, `add_terms`, `add_term`, `set_business_key`, `set_data_quality_rule`, `set_data_classification`, `build_dataflow`, `rename_model_element`,
   `delete_model_element`, `add_to_view`, or several of them in `run_batch`.
3. **By hand only what has no cascade:** expressions in mappings and filters, descriptions, properties. Then call
   `sync_workspace` and `validate_project`.
4. **Change existing objects only when the user asks for it.**
   **Views:** without a view named by the user, new objects go to the default view. When the user names a view, pass
   `view` to `create_model_object` and call `add_to_view` for changed objects; a view that does not exist yet is created.
5. **Show the plan first** (objects, business keys, relationships, historization) and wait for the user's OK. When grain,
   life cycle, history or the formula of a measure is unclear, ask instead of guessing.
6. **Validate after each layer** with `validate_project`. Fix errors, tell the user about warnings.
7. **`validate_semantic_model` and `calculate_architecture_model` only when the user asks for it.** Never call them
   on your own. After a finished layer and before the hand-over, ask the user whether to run the semantic model
   validation or the architecture model calculation. The calculation runs in the background: call
   `get_architecture_model_status` until it is no longer `running`.
8. **Project settings** (hashing, historization, deployment, governance) are in `project.yml`: read them with
   `get_project_settings`. Usually they stay as they are. Change them with `set_project_settings` only when the user
   asks for it or a requirement of the user needs it, and only after the user's OK.
9. **The generator configuration decides what is possible.** Types, relationships, sources, properties, default values
   and data quality rules differ per generator. Look them up with `get_generator_catalog` and `describe_type`; never assume
   them from a guide, an example or another project.
10. **Data quality rules** the generator creates by default come with the objects, and the result of the tool names them.
    Set further rules with `set_data_quality_rule` only when the user asks for them.

## Process

1. **Open the project.** In the repository root (where `project.yml` is):
   - Call `open_workspace`. Run the returned command for your shell in the repository root:
     - bash, also Git Bash: `tar -czf - $(ls -d project.yml config.yml task-lists.yml modelobjects views discoveries 2>/dev/null) | curl -sf --upload-file - "<url>"`
     - PowerShell: the `powershell` command of the result (it writes a temp file and calls `tar.exe` and `curl.exe`).
   - Run the transfer commands exactly as returned, as a command of their own: the plugin allows only these without a
     prompt. Change into the repository root in a separate command first if needed.
   - Use the `workspaceId` with all other tools.
2. **Read** with `list_project_objects`, `show_project_object`, `list_views` and the discovery files under `discoveries/`. Source
   objects, discoveries and linked projects come from the Discovery App and the biGENIUS-X UI; when one is missing, tell
   the user the steps from `get_modeling_guide` with `data-connections`.
3. **Check the architecture** with `get_generator_catalog`. It lists the types this project can create, the types it can
   only read from a linked project and the guides that apply. Plan only with these types. When a type is refused, do not
   rebuild it with a pattern of another architecture.
4. **Look up the rules** of each type before using it the first time: `describe_type`. A property name can mean something
   else on another type. Guidance and examples of the calls for this architecture: `get_modeling_guide` with `process` and
   the guides of the catalog.
5. **Plan** and get the user's OK.
6. **Build layer by layer**, from the sources upward (`dataflowSources` in `describe_type`), a small vertical slice first.
   Per object: `create_model_object`, `add_relationship`, `add_terms`, `build_dataflow`. Put one layer into one `run_batch`.
7. **Validate** with `validate_project`. Then ask the user whether to run `validate_semantic_model` for the layer; run
   it only on a yes.
8. **Write the changes into the repository** with `download_changes` after each layer and before any manual edit. Run the
   returned command in the repository root, then its delete command (`deleteBash` or `deletePowerShell`).
9. **Hand over:** list new and changed objects, open warnings and assumptions, and ask whether to run
   `calculate_architecture_model` (then `get_architecture_model_status`) before the user opens the repository in
   biGENIUS-X. Findings from the architecture model calculation or the UI come back to you (prompt `fix_findings`).

## Example

User: "Build a dimension for Customer from the CRM discovery."

1. `open_workspace`, run the upload command.
2. `get_generator_catalog`, `get_modeling_guide` with `process` and the guides of the catalog, `list_project_objects`, the
   Source object with `show_project_object`, `describe_type` for each type of the plan.
3. Plan with the types of the catalog: objects per layer with business keys, relationships and historization. Ask what is
   unclear. Wait for the OK.
4. `run_batch` per layer with the calls the guide of the architecture shows, then `validate_project`.
5. `download_changes`, run the command and its delete command.
6. Tell the user what changed, including the data quality rules that came with the objects, and ask whether to run
   `calculate_architecture_model`; then what to check in the biGENIUS-X UI.

## Without a shell

In claude.ai or other clients without a shell, pass the project files inline with `files` (`project.yml`, `config.yml`,
`views/*.yml` and the model objects, max 1 MB). The tools return the changed files. When a tool answers
`needs_files`, add the listed files and call it again.
