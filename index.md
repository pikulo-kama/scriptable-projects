---
layout: default
---

# Scriptable Modular Framework

Welcome to the documentation for the **pikulo-kama's Scriptable Modular Framework**. This project provides a suite of professional tools and standards designed to transform [Scriptable for iOS](https://scriptable.app/) from a simple snippet tool into a robust development environment.

## 🚀 The Ecosystem

This framework solves the biggest pain points of Scriptable development: code duplication, manual localization, difficult debugging, and complex distribution.

### 🏗️ Core Architecture

The project is built on a modular "Service-Oriented" architecture. Instead of monolithic scripts, we use reusable **Libraries** that are managed by **Internal Scripts**.

- **Libraries**: Reusable code (e.g., `Files`, `Modal`, `CRUD Module`, `Cache`).
- **Internal Scripts**: Manager tools used to maintain your environment (e.g., `Bundler UI`, `Localizator`).
- **Resources**: Centralized storage for assets (`Resources/`), flags (`Features/`), and translations (`i18n/`).
- **Widgets**: Ready to use widgets/UI Tables (e.g. `Blackout Notifier`, `WatchQ`, `StopWatcher`).

---

## 🛠️ Management Tools

| Tool                                        | Purpose                                                                   |
| :------------------------------------------ | :------------------------------------------------------------------------ |
| **[Script Installer](./scripts/installer)** | 📥 Fetches projects from GitHub and auto-syncs all dependencies.          |
| **[Bundler UI](./scripts/bundler)**         | 📦 Merges modular code into a single distribution-ready `.js` file.       |
| **[Localizator](./scripts/localizator)**    | 🌐 A visual editor for managing multi-language translation files.         |
| **[Feature UI](./scripts/feature_ui)**      | ⚙️ Manages feature flags and debug configurations without touching code.  |
| **[Logger UI](./scripts/logger_ui)**        | 📝 Controls log verbosity for every service in your system independently. |

---

## 📖 Standard Directory Structure

To ensure compatibility with the **Script Installer** and **Bundler**, your local Scriptable directory should follow this layout:

```text
Scriptable/
├── i18n/              # JSON translation files
├── Features/          # Script-specific flag configurations
├── Resources/         # Images, fonts, and static assets
└── [Scripts].js       # Libraries, Internal scripts and widgets
```
