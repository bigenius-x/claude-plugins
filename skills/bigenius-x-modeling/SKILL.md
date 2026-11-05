---
name: bigenius-x-modeling
description: Model a data warehouse in a biGENIUS-X project, Data Vault (Stage, Hub, Link, Satellite, views) or Dimensional (Stage, Entity, Fact), with Mart Dimension and Mart Fact, using the biGENIUS modeling MCP tools. Use when someone wants to create, change, check or delete model objects in a biGENIUS-X repository, or build a model from a discovery.
---

# biGENIUS-X modeling

You build the model; biGENIUS-X generates the code from it. You decide what is built: hubs, links, satellites and views
in a Data Vault project, entities and facts in a Dimensional project, dimensions and facts in a mart. The tools of the MCP server `bigenius-modeling` write the project files the way
the biGENIUS-X UI does: ids, default terms, foreign key and hash key terms, mapping stubs, and all follow-up changes when
something is renamed or deleted.

The server runs at `https://<host>/modeling`. If the tools are missing, connect it first:
`claude mcp add --transport http bigenius-modeling https://<host>/modeling`

## Rules

1. **No invented ids.** Every GUID comes from a tool (`new_ids` for manual edits) or from an existing file.
2. **Structure changes only through the tools:** `create_model_object`, `add_relationship`, `set_relationship_properties`,
   `add_terms`, `add_term`, `set_business_key`, `set_data_classification`, `build_dataflow`, `rename_model_element`,
   `delete_model_element`, `add_to_view`, or several of them in `run_batch`.
3. **By hand only what has no cascade:** expressions in mappings and filters, descriptions, properties. Then call
   `sync_workspace` and `validate_project`.
4. **Change existing objects only when the user asks for it.**
   **Views:** without a view named by the user, new objects go to the default view. When the user names a view, pass
   `view` to `create_model_object` and call `add_to_view` for changed objects; a view that does not exist yet is created.
5. **Show the plan first** (objects, business keys, relationships, historization) and wait for the user's OK. When grain,
   life cycle, history or the formula of a measure is unclear, ask instead of guessing.
6. **Validate after each layer** with `validate_project`. Fix errors, tell the user about warnings.
7. **`run_model_calculation` only when the user asks for it.** Never call it on your own. After a finished layer and
   before the hand-over, ask the user whether to run the platform model calculation.
8. **Project settings** (hashing, historization, deployment, governance) are in `project.yml`: read them with
   `get_project_settings`. Usually they stay as they are. Change them with `set_project_settings` only when the user
   asks for it or a requirement of the user needs it, and only after the user's OK.

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
3. **Check the architecture** with `get_generator_catalog`. It lists the types this project can create and the guides
   that apply. Plan only with these types. When a type is refused, do not rebuild it with a pattern of another
   architecture: in a Dimensional project a dimension is an Entity, not a Hub with a Satellite or a Reference Table.
4. **Look up the rules** of each type before using it the first time: `describe_type`. Guidance and recipes:
   `get_modeling_guide` with `process`, `raw-vault`, `business-vault`, `dimensional`, `mart`, `naming`, `repo-format` or
   `data-connections`.
5. **Plan** and get the user's OK.
6. **Build layer by layer**, a small vertical slice first: Stage, Raw Vault, Business Vault, Mart in a Data Vault
   project; Stage, Entity and Fact, and optionally the Mart in a Dimensional project, by use case: ask. Per object: `create_model_object`, `add_relationship`,
   `add_terms`, `build_dataflow`. Put one layer into one `run_batch`.
7. **Validate** with `validate_project`. Then ask the user whether to run `run_model_calculation` for the layer; run
   it only on a yes.
8. **Write the changes into the repository** with `download_changes` after each layer and before any manual edit. Run the
   returned command in the repository root, then its delete command (`deleteBash` or `deletePowerShell`).
9. **Hand over:** list new and changed objects, open warnings and assumptions, and ask whether to run
   `run_model_calculation` before the user opens the repository in biGENIUS-X. Findings from the model calculation or
   the UI come back to you (prompt `fix_findings`).

## Example: Data Vault

User: "Build Hub, Satellite and Dimension for Customer from the CRM discovery."

1. `open_workspace`, run the upload command.
2. `get_generator_catalog`, `list_project_objects`, `show_project_object("Source:Customer")`, `describe_type("Hub")`.
3. Plan: Stage `Customer`, Hub `Customer` with business key `CustomerId`, Satellite `Customer` with the descriptive
   attributes, Business Current View, Mart Dimension `Customer` as SCD1. Wait for the OK.
4. `run_batch` with:
   - `create_model_object(type: "Stage", name: "Customer")`, `add_terms(target: "Stage:Customer", source: "Source:Customer", terms: ["*"])`,
     `build_dataflow(target: "Stage:Customer", sources: ["Source:Customer"], mappings: ["BG_SourceSystem='CRM'"])`
   - `create_model_object(type: "Hub", name: "Customer")`, `add_terms(target: "Hub:Customer", source: "Stage:Customer", terms: ["CustomerId"], businessKeys: ["CustomerId"])`,
     `build_dataflow(target: "Hub:Customer", sources: ["Stage:Customer"], mappings: ["BG_SourceSystem='CRM'"], dataflowProperties: ["DeduplicationMethod=Distinct"])`
   - `create_model_object(type: "Satellite", name: "Customer")`, `add_relationship(target: "Satellite:Customer", referenced: "Hub:Customer")`,
     `add_terms(target: "Satellite:Customer", source: "Stage:Customer", terms: ["Title", "FirstName", "LastName"])`,
     `build_dataflow(target: "Satellite:Customer", sources: ["Stage:Customer"], mappings: ["FK_Customer_CustomerId=s1.CustomerId", "BG_SourceSystem='CRM'"])`
5. `validate_project`, then the same for the Business Current View and the Mart Dimension.
6. `download_changes`, run the command and its delete command.
7. Tell the user what changed and ask whether to run `run_model_calculation`; then what to check in the biGENIUS-X UI.

## Example: Dimensional

User: "Create a historized dimension for Customer."

1. `open_workspace`, run the upload command, `get_generator_catalog`: the types are Stage, Entity, Fact and the mart
   types, the guides include `dimensional`.
2. Plan: Stage `Customer`, Entity `Customer` with business key `Id` and SCD2 attributes. Wait for the OK.
3. `run_batch` with:
   - `create_model_object(type: "Stage", name: "Customer")`, `add_terms(target: "Stage:Customer", source: "Source:Customer", terms: ["*"])`,
     `build_dataflow(target: "Stage:Customer", sources: ["Source:Customer"], mappings: ["BG_SourceSystem='CRM'"])`
   - `create_model_object(type: "Entity", name: "Customer")`,
     `add_terms(target: "Entity:Customer", source: "Stage:Customer", terms: ["Id", "Name", "City"], businessKeys: ["Id"], historization: "SCD2")`,
     `build_dataflow(target: "Entity:Customer", sources: ["Stage:Customer"], mappings: ["BG_SourceSystem='CRM'"])`
4. `validate_project`, `download_changes`, then the hand-over as above.

## Without a shell

In claude.ai or other clients without a shell, pass the project files inline with `files` (`project.yml`, `config.yml`,
`views/*.yml` and the model objects, max 1 MB). The tools return the changed files. When a tool answers
`needs_files`, add the listed files and call it again.
