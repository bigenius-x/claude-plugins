---
name: bigenius-data-marketplace
description: Find data products in the biGENIUS Data Marketplace for a use case or a business question, and write SQL for their output ports that the customer's own agent runs. Use when someone asks which data product fits a use case, what a data product contains, or wants a query or report over one or more data products.
---

# biGENIUS Data Marketplace

The tools of the MCP server `bigenius-marketplace` read the Data Marketplace with the user's login: data products,
their output ports and data contracts. biGENIUS does not run queries. You write the SQL; the agent or tool of the
customer that has access to the database runs it.

If the tools are missing, connect the server: `claude mcp add --transport http bigenius-marketplace https://<host>/marketplace`

## Process

1. **Find.** `search_data_products` with words of the use case (or without, for all). Rank the candidates yourself
   against the use case; the server does not rank. Only the products assigned to the user are listed: when nothing
   fits, say so and that other products may exist.
2. **Decide.** `get_data_product` for the candidates. Name the output port that fits, what it contains and what the
   use case needs that it lacks. Prefer a port without classified columns when the use case does not need them.
3. **Context.** `get_query_context` for the output ports to query. Read its `rules` first and follow them; they come
   from the data contracts.
4. **Write.** SQL in the dialect of the `platform` of the port, tables exactly as given (`{{schema}}.<table>`), only
   the listed columns. Joins over the listed foreign keys or join candidates.
5. **Check and hand over.** `check_query`; fix errors, explain warnings you keep. Give the user the SQL and the
   `handOver` block for the agent that runs it.

## Rules

- No guessed table or column names, schemas, servers or historization: everything comes from the tools.
- Historized objects: follow the rules of `get_query_context` (current version, facts joined over the surrogate key).
- Output ports on different platforms cannot be joined in one query: query them separately and combine the results.
- Foreign key targets are derived from column names; say so when a join depends on one.
