---
name: notebooklm
description: Use when querying Google NotebookLM notebooks for source-grounded answers with citations, or managing notebook libraries.
---

# NotebookLM Skill

Query Google NotebookLM notebooks for source-grounded, citation-backed answers. Provides browser automation for notebook access, library management, and persistent authentication.

## Capabilities

- **Query Notebooks**: Ask questions against uploaded sources
- **Citation-Backed Answers**: Responses reference specific source documents
- **Notebook Management**: Create, update, delete notebooks
- **Source Management**: Add/remove sources from notebooks
- **Persistent Auth**: Maintain Google session across sessions
- **Library Access**: Browse and search notebook collections

## When to Use

- Research with document-grounded answers
- Querying knowledge bases with citations
- Extracting insights from uploaded documents
- Building research workflows
- Creating Q&A systems from documents
- Getting answers with verifiable sources

## Key Tools

- `query_notebook`: Ask questions to a specific notebook
- `list_notebooks`: Get all available notebooks
- `create_notebook`: Create new notebook with sources
- `add_sources`: Add documents/URLs to notebook
- `get_answer_sources`: Retrieve citations for an answer

## Example Usage

```
// Query notebook
query_notebook({
  notebook_id: "research-papers",
  question: "What are the key findings about LLM hallucinations?"
})

// Returns answer with citations:
// "According to Source 1, LLM hallucinations occur when..."
// Citations: [Source 1, p.3], [Source 2, Section 4.2]

// List notebooks
list_notebooks()

// Create notebook
create_notebook({
  name: "Project Documentation",
  sources: ["https://docs.example.com", "./local-docs/"]
})
```

## Authentication

- Browser-based OAuth flow
- Session persistence in secure storage
- Automatic token refresh
- Supports multiple Google accounts

## Notes

- Requires Google account access
- Browser automation handles auth
- Source limits based on NotebookLM tiers
- Answers grounded in uploaded sources only
