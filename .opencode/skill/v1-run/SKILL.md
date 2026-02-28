---
name: v1-run
description: Use when selecting npm packages, checking for vulnerabilities, comparing package alternatives, or evaluating package health scores.
---

# V1-Run Skill

npm package intelligence via MCP providing real-time version data, vulnerability information, health scores, and package comparisons for informed dependency decisions.

## Capabilities

- **Version Info**: Real-time package versions and changelogs
- **Vulnerability Data**: Security advisories and CVE information
- **Health Scores**: Package maintenance and popularity metrics
- **Package Comparisons**: Side-by-side alternative analysis
- **Dependency Analysis**: Transitive dependency inspection
- **Download Stats**: npm download trends and patterns

## When to Use

- Selecting between npm package alternatives
- Checking packages for known vulnerabilities
- Evaluating package maintenance status
- Comparing bundle sizes and dependencies
- Researching package popularity and adoption
- Making informed dependency decisions

## Key Tools

- `get_package`: Get package details and metadata
- `check_vulnerabilities`: Security vulnerability scan
- `get_health_score`: Package health metrics
- `compare_packages`: Compare multiple packages
- `get_dependencies`: Analyze dependency tree
- `get_downloads`: Download statistics

## Example Usage

```
// Get package info
get_package({ name: "lodash" })

// Check vulnerabilities
check_vulnerabilities({ name: "express", version: "4.17.0" })
// Returns: { vulnerabilities: 2, severity: "medium", cves: [...] }

// Get health score
get_health_score({ name: "react" })
// Returns: { score: 95, maintenance: "active", popularity: "very-high" }

// Compare alternatives
compare_packages({
  packages: ["axios", "ky", "got", "node-fetch"]
})
// Returns comparison table with scores, size, deps
```

## Health Score Components

- **Maintenance**: Commit frequency, release cadence
- **Popularity**: Downloads, stars, forks
- **Quality**: Test coverage, documentation
- **Security**: Vulnerability history, response time
- **Community**: Contributors, issue responsiveness

## Decision Support

```
Example comparison output:
┌─────────────┬───────┬────────┬────────┬────────┐
│ Package     │ Score │ Vulns  │ Size   │ Deps   │
├─────────────┼───────┼────────┼────────┼────────┤
│ axios       │ 92    │ 0      │ 13KB   │ 1      │
│ ky          │ 88    │ 0      │ 4KB    │ 0      │
│ got         │ 85    │ 1(low) │ 68KB   │ 12     │
│ node-fetch  │ 78    │ 2(med) │ 24KB   │ 0      │
└─────────────┴───────┴────────┴────────┴────────┘
```

## Notes

- Real-time data from npm registry
- Integrates Snyk/npm audit for vulnerabilities
- Supports scoped packages (@org/package)
- Includes ESM/CJS compatibility info
