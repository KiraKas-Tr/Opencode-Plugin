---
name: mqdh
description: Use when building Meta Quest VR/AR applications, needing Meta Horizon OS documentation, or managing Quest devices via ADB.
---

# Meta Quest Developer Hub (MQDH) Skill

MCP integration for Meta Quest Developer Hub providing VR/AR development tools, documentation access, and device management capabilities.

## Capabilities

- **Documentation Access**: Query Meta Horizon OS and XR development docs
- **ADB Tools**: Device debugging, app installation, log streaming
- **Device Management**: Connect, configure, and manage Quest devices
- **Build Tools**: APK management, app deployment workflows
- **Debugging**: Performance profiling, log analysis
- **Project Setup**: Quest project scaffolding and configuration

## When to Use

- Building applications for Meta Quest headsets
- Looking up Meta XR SDK documentation
- Debugging Quest applications on device
- Managing Quest device settings and configurations
- Deploying builds to Quest devices
- Setting up XR development environments

## Key Tools

- `query_docs`: Search Meta Horizon OS documentation
- `device_list`: List connected Quest devices
- `device_install`: Install APK to device
- `device_logs`: Stream device logs
- `adb_command`: Execute ADB commands
- `project_configure`: Set up Quest project settings

## Example Usage

```
// Query documentation
query_docs({ query: "hand tracking setup Quest 3" })

// Install app
device_install({ apk_path: "./build/app.apk", device_id: "quest-3" })

// Stream logs
device_logs({ device_id: "quest-3", filter: "Unity" })
```

## Prerequisites

- Meta Quest Developer Hub installed
- Developer mode enabled on Quest device
- USB connection or ADB over Wi-Fi configured
