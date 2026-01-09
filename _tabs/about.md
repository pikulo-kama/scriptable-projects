---
icon: fas fa-info-circle
order: 4
---

The **Scriptable Modular Framework** was born out of a need for structure in an environment that often encourages "spaghetti code." Scriptable is a powerful tool, but as projects grow in complexity—involving networking, local storage, and multi-language support—managing them in a single file becomes impossible.

[Image of a software development lifecycle diagram showing stages: code, test, localise, bundle, and deploy]

## The Problem

Developing for Scriptable usually involves:

- **Code Duplication**: Copy-pasting the same file management or UI logic into every new script.
- **Static Assets**: Difficulty managing images and icons across multiple devices.
- **Hardcoded Strings**: No easy way to provide translations for a global audience.
- **Difficult Distribution**: Sharing modular code is hard because users have to download 10 different files for one script to work.

## Our Solution

This framework introduces a **Unified Development Lifecycle**. By using a standardized set of core modules, we provide:

### 🧩 True Modularity

Using a custom-built **Bundler**, developers can write clean, decoupled code. You can import common utilities like `Files.js` or `Modal.js` without worrying about how to share the final result. The Bundler merges everything into a production-ready script.

### 🌐 Native Localization

Localization isn't an afterthought here. With the **Localizator** tool and the `Localization.js` module, adding support for a new language is as easy as filling out a table. The framework handles the logic of selecting the correct language based on the user's iOS settings.

### 🛡️ Robust Debugging

Logging in Scriptable is often "all or nothing." Our **Logger UI** allows you to set specific log levels (Debug, Info, Warn, Error) for different parts of your app independently. If your networking service is failing, you can turn its logs to `DEBUG` while keeping the rest of the system quiet.

---

## Technical Standards

To maintain high quality across the ecosystem, we follow strict guidelines:

1.  **Strict Typing Simulation**: Using JSDoc for better IDE support and code clarity.
2.  **State Management**: Using `Features` flags to toggle experimental behaviors safely.
3.  **Encapsulation**: Using private class fields (`#privateField`) to prevent scope leakage.

## About the Author

This project is maintained by **pikulo-kama**. It is an open-source initiative to help the Scriptable community build more professional, reliable, and accessible automation tools for iOS.
