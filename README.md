# @board-bound/workspace

This is a pre-configured workspace, including launch scripts to
automatically rebuild plugins or the server when changes are made.

## Installing and Setting Up the Development Environment

### Step 1: Install Dependencies

Run the following command to install dependencies:

```bash
pnpm install
```

On the initial run, this command will also clone the
[`@board-bound/server`](https://github.com/board-bound/server) and
[`@board-bound/sdk`](https://github.com/board-bound/sdk) repositories and install their respective dependencies.

### Step 2: Configure `config.json`

After the first installation, you can modify the `config.json` file to specify which projects should be automatically updated during subsequent `pnpm install` executions. Typically, this includes only the `@board-bound/server` and `@board-bound/sdk` projects.

**Important:** It is strongly recommended to disable automatic updates while making changes to files within any project to avoid unintended overwrites.

### Step 3: Clone or Create a Plugin

Clone any repository based on the
[`@board-bound/example`](https://github.com/board-bound/example)
in to the root of the workspace:

```bash
git clone git@github.com:board-bound/example.git
```

Alternatively, you can create a new plugin from scratch by copying the
[`@board-bound/example`](https://github.com/board-bound/example) repository. Use the provided [template link](https://github.com/new?template_name=example&template_owner=board-bound) to get started.

### Step 4: Enable Development Environment Linking

To enable or disable development environment linking, use:

```bash
# Enable linking
pnpm enable-dev

# Check if dev mode is enabled
pnpm is-dev-enabled

# Disable linking
pnpm disable-dev
```

This feature resolves dependencies within the local workspace and links packages automatically, ensuring that TypeScript correctly resolves imports.

**Note:** After adding a new plugin to the workspace, you must run `pnpm enable-dev` again to link the new plugin.

### Step 5: Start the Development Workspace

Run the development workspace with automatic rebuild functionality:

```bash
pnpm dev
```

This setup will monitor changes and rebuild the project automatically.

## License

This project is licensed under the **Apache License 2.0**.

### About

Apache-2.0

A permissive license whose main conditions require preservation of copyright and license notices. Contributors provide an express grant of patent rights. Licensed works, modifications, and larger works may be distributed under different terms and without source code.

### What you can do

| Permissions                                                                                                                       | Conditions                                                                                                                                                   | Limitations                                                                                                                                                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| <details><summary>🟢 Commercial use</summary>The licensed material and derivatives may be used for commercial purposes.</details> | <details><summary>🔵 License and copyright notice</summary>A copy of the license and copyright notice must be included with the licensed material.</details> | <details><summary>🔴 Liability</summary>This license includes a limitation of liability.</details>                                                                                                                               |
| <details><summary>🟢 Distribution</summary>The licensed material may be distributed.</details>                                    | <details><summary>🔵 State changes</summary>Changes made to the licensed material must be documented.</details>                                              | <details><summary>🔴 Trademark use</summary>This license explicitly states that it does NOT grant trademark rights, even though licenses without such a statement probably do not grant any implicit trademark rights.</details> |
| <details><summary>🟢 Modification</summary>The licensed material may be modified.</details>                                       |                                                                                                                                                              | <details><summary>🔴 Warranty</summary>This license explicitly states that it does NOT provide any warranty.</details>                                                                                                           |
| <details><summary>🟢 Patent use</summary>This license provides an express grant of patent rights from contributors.</details>     |                                                                                                                                                              |                                                                                                                                                                                                                                  |
| <details><summary>🟢 Private use</summary>The licensed material may be used and modified in private.</details>                    |                                                                                                                                                              |                                                                                                                                                                                                                                  |

*Information provided by https://choosealicense.com/licenses/apache-2.0/,
this is not legal advice. See the LICENSE file for more information.*
