---
layout: post
title: Modules
icon: fa fa-code
description: Contains documentation about internal Scriptable modules that are used by end-user scripts.
categories: [Blogging, Documentation]
order: 3
toc: true
---

# Core Modules & Libraries

These modules form the backbone of the framework. They are designed to be imported into both Internal Scripts and User Scripts.

---

## 📦 Bundler

**Purpose:** The core logic responsible for transforming modular, multi-file projects into single-file Scriptable executables.

- **How it works:**

  1. It recursively parses code for `importModule` statements.
  2. It strips out Scriptable-specific metadata headers from dependencies to prevent execution errors.
  3. It removes `module.exports` blocks to allow all code to live in a single flat scope.

- **Usage:** `bundleScript('Script Name', '/path/to/the/script')`.
- **Output:** Creates a new file with the `(Bundled)` suffix in your root directory.

---

## 🏗️ CRUD Module

**Purpose:** Provides a high-level abstraction for building interactive Data Tables and Forms within Scriptable.

- **Key Components:** `UIDataTable`, `UIForm`, `TextDataField`, `BoolDataField`.
- **Usage:** Used by management scripts (like Feature UI) to render editable lists.
- **Feature:** Supports automatic data persistence via callbacks when fields are modified.

---

## 💾 Cache

**Purpose:** Manages local data persistence and network request caching to respect API limits and improve performance.

- **Key Components:** `cacheRequest`, `metadata`.
- **Usage:** `const request = cacheRequest(myMetadata, 24);` (Caches for 24 hours).
- **Feature:** Built-in support for GitHub API tree and blob structures.

---

## ⭕ Circle

**Purpose:** A specialized UI utility for drawing circular elements, likely used for progress indicators or status rings in widgets.

- **Usage:** Provides geometric calculations and `DrawContext` operations for circular shapes.

---

## ⚙️ Config Util

**Purpose:** A helper for reading and merging configuration objects.

- **Usage:** Simplifies the retrieval of settings from JSON files, providing defaults if specific keys are missing.

---

## 📍 Constants

**Purpose:** A centralized repository for global values and "magic strings" used throughout the framework.

- **Contents:**
  - **File Extensions:** `.js`, `.json`.
  - **Empty States:** `EMPTY_STRING`, `NULL_VALUE`.
  - **Framework Names:** Path names for `i18n`, `Features`, and `Resources` folders.
- **Benefit:** By importing `Constants`, you ensure that if a folder name or file extension ever needs to change, you only have to update it in one place.

---

## 🛡️ Core

**Purpose:** The foundation module that likely contains global constants, environment checks, and base classes for the framework.

- **Usage:** Imported by almost every other module to ensure environment consistency.

---

## 🚩 Feature

**Purpose:** Implementation logic for Feature Flags.

- **Usage:** Allows scripts to check `if (Feature.isEnabled("beta_mode"))` to toggle functionality dynamically without code changes.

---

## 📂 Files

**Purpose:** A robust wrapper around Scriptable's `FileManager`.

- **Usage:** Provides "Force Move," recursive directory creation, and path normalization.
- **Reliability:** Handles the differences between iCloud and Local storage paths transparently.

---

## 📈 Linear Chart

**Purpose:** A drawing library for rendering linear/line graphs within `DrawContext`.

- **Usage:** Ideal for visualizing data trends in Home Screen widgets (e.g., battery levels or price tracking).

---

## 🌐 Localization

**Purpose:** The engine behind the framework's multi-language support.

- **Key Function:** `tr(key, ...args)`.
- **Usage:** Detects system language and fetches the corresponding string from `i18n/`.
- **Feature:** Supports dynamic placeholders (e.g., "Welcome, %s").

---

## 📝 Logger

**Purpose:** A tiered logging system (DEBUG, INFO, WARN, ERROR).

- **Usage:** `logger.debug("Message")`.
- **Feature:** Connects to **Logger UI**, allowing per-service verbosity control.

---

## 📑 Modal

**Purpose:** A fluent API for creating iOS-native alerts and input sheets.

- **Usage:** `const result = await modal().title("Hi").actions(["A", "B"]).present();`
- **Feature:** Supports validation rules (e.g., `ModalRule.NotEmpty`).

---

## 🖼️ UI

**Purpose:** General-purpose UI components for enhancing Scriptable interfaces.

- **Usage:** Contains common layouts, button styles, and formatting helpers to keep a consistent look across the framework.

---

## 🛠️ Util

**Purpose:** A collection of general-purpose JavaScript helper functions that don't fit into a specific category like "Files" or "UI."

- **Common Functions:**
  - **String Manipulation:** CamelCase to Title Case conversions (used by the Localizator).
  - **Date Formatting:** Standardized timestamps for logging and caching.
  - **Validation:** Helpers to check object types or array states.
- **Usage:** Used primarily by the internal management scripts to clean up data before presenting it in a `UIDataTable`.
