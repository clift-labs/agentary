# Phaibel

An AI-powered personal assistant that lives in your terminal. Phaibel manages your todos, events, notes, goals, people, and more — all stored as plain Markdown files in a local "vault" folder.

Choose from 4 personalities and name your agent to make it truly yours.

> **Requires an API key from [OpenAI](https://platform.openai.com) and/or [Anthropic](https://console.anthropic.com).**

```
     ___                    __
@@@@@@%%%%%%%%%%%%%%%%%##############%%#######%%%%%%%%%%%%%%@@@@@@@@@@@%%#########*+*#+++=:::::::::-
@@@@@@@@%%%%%%%%%%%%#################%###********#######%%%@@@@@@%%####**##*+=-:::.:-+==+=::::::::::
@@@@@@@@@@@@%%%%%%%%%%%%%########***###**********###%%%%@@%%%%###*****+=-:::........-+====::::::::::
@@@@%*=+%@%%%%%%%%%%%%%%%%######****##******####%%%%%%%%#####*+++=-:::..............:+=-==::::::::::
@@@@@##%@@@%%%%%%%%%%%%%%%%%##########*+*#%%%%%%%%%##*****+=+==-:...................:+=-=-::::::::::
@@@@@@@@@@@@@@@@%%%%%%%%%%%%%#########++*%@%%%##***++=--::..:--::...................:=--=-::.:::::::
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%%%#+=+####***+-::........:--::...................:=--=-:::::----:
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%###%*==+*****+=-:.-*%%%%%%%##*-:...................:=---===++**+===
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%#*****=-=++===::=#%@@@@@@@%####%*=:............:::--++---==++***+===
@@@@@@@@@@@@@@@@%%%%%%%%%%%%%%@%#+==++---==----#@@@@@@%@@@%%##%%%##=..........:---==++-:-==+++++==--
@@@@@@@@%%%%%%%%%%%%%%%%%%%%%%%#*=--==-:-=--:=@@@@@@@@@@@@@%%##%@%%%*:......::-----=++-:-====+++=---
@@@@@%%%%%%%%%%%%%%%%%%%%%#%#%%#+---==-:---:-*@@@@@@@@%#*++====*%%%#*-......-------=++-:-==+++++=---
@@@@@@%%%%%%%%%%###############*=---==-:---::*@@@%#***++===-----*##*+-......:---====++-:-===++++=---
@@%%%%%%%%%%#############***###*=-:--=-::--::*@@##**++++++==----+****-......:---====*+-:-===++++=---
%%%%%%%%%%%############*******#*=:::--:::--::-%%###**++++==------=**#=:.....:----===+=::-====+++=-::
%%%%%%%%%%%#######*******++****+-:::--:::-::::-%##**++++++*###*=::=*==+.....:---====+=::-=====+==-::
%%%%%%%######*********++++++++*+-:::--:::-:::::=##%%@%#*+*%%@%#+=:-+=*=.....:------=+=::-====+++=-::
%%%%%#######*********+++++++++*+-:::--:::-::::-=%%%%@%%*-=+**+=--::--+=.....:---====+=::---===+==--:
%%%%%#######*******++++++++==+++-:::--:::-::::-+%##***#*-:--==-----:--:.....:------=+=::-====+++=---
%%%%%%%%%%####*****+++++++====+=-:::--:::-::::*%@%****#*-:-=+=------:.......:------=+=::---======--:
%%%%%@@%%%%###****++++++======+=-::::-:::-::-=**%@%***###+*====------......::------=+=::-=====++=---
%%%%%%@@@%%########**++=======+=::::--:::-=+*%@@@@@%###%##+++**=-===-......:-------=+=::---======---
@@@@@@@@@%%%%%%##*****++======+=::::--::-+++=++++@+#%%%%%%*+========-:.....:-----===+=::-====+++=---
%%%%%%%@@%%%%%%#*+++++++======+=::::--::+**###%@@%:-*%#####+==--=++=--.:...:-------=+=::--====++=---
%%%%%%@@@%%%%%%####**++=========::.::-:=**+=+***%%*::-*##**++=+*#*+=:..=*-.:-------=+=::---======---
%@@@@@@@@@@@@%%####**++===+***+=::.::-=++++#%@@@@%*:::-#%%%##****+-:..-%#%*--------=+=::--====+===--
@@@@@@@@@@@%%%%%%%#***++=+*##*+=::.::-**+=+%%@@@#+::::-*%%##***+-::::=%%%%%%#+=----=+=::---=======--
@@@@@@@@%%%%%%%%%%%#*+++++++++==-::::=*+=-+#%%@%+-:-+%%**####+--::::=%%%%%@@@@%%#*==+=::--========--
@%%@@@@@@@@%%%%#####*++==+*###*=-:::-=*+=-=+===+*#%@@@@**#%%*=-:::-=%@@%%@@@@@@@@%%%#+-:---=======--
%%%@%%%%@@%%%%##%####*+++*%@%%#+-:::-+*+==-=-==#@@@@@@@%@@@@%@%*=-=%%@@@@@@@@@@@@@@@@%%%%%*+========
```

## Quick Start

```bash
# Install globally
npm install -g phaibel

# Initialize your vault
phaibel init

# Add an API key (OpenAI or Anthropic)
phaibel config add-provider openai

# Launch the interactive shell
phaibel
```

That's it. Your agent is ready to serve.

## Personalities

During onboarding, choose a personality for your agent:

| Personality | Style |
|-------------|-------|
| **British Butler** | Formal, composed, measured. Refers to itself in the third person. "Very good, sir." |
| **Rock Star** | High-energy, irreverent, enthusiastic. Uses slang and music metaphors. "Let's shred this to-do list!" |
| **Executive Assistant** | Professional, crisp, efficient. Corporate tone, uses your name directly. "Done. Next item on your agenda." |
| **Friend** | Warm, casual, supportive peer. "Hey! I took care of that for you." |

You also choose a name for your agent — it becomes part of every interaction, from the CLI shell to the web UI.

## Requirements

- **Node.js 18** or later
- An API key from **OpenAI** and/or **Anthropic**

## Install from Source

If you prefer to build from source:

```bash
git clone https://github.com/clift-labs/phaibel.git
cd phaibel
npm install
npm run build
npm link
```

## What Phaibel Does

All of your information stays **local** — stored as plain Markdown files with YAML frontmatter, organized into structured content types within your vault. Phaibel comes with built-in content types for common needs, and can create new ones on the fly when it needs a new way to store information.

### Content Types

| Type | Description |
|------|-------------|
| **todo** | Tasks with priority, status, and due dates |
| **event** | Calendar events with start/end times and locations |
| **note** | Freeform notes |
| **todont** | Things you're deliberately *not* doing |

Your agent creates new content types as needed — just ask it to track something new and it'll figure out the right structure.

### Natural Language Chat

Just type naturally and your agent figures out what to do:

```
> remind me to call the dentist tomorrow
> what's on my plate today?
> create a goal to run a half marathon by June
> add a note about the meeting with Sarah
```

### Dynamic Process Generation

What sets Phaibel apart from other personal agents is that it **writes a unique software process for every request**. Instead of following rigid, pre-built workflows, it dynamically assembles a process graph tailored to exactly what you asked for.

This is powered by the **FeralCCF** (Feral Catalog-Code Framework) library, which has three layers:

- **NodeCode** — reusable logic templates (e.g., "query todos", "format as markdown", "call LLM")
- **CatalogNodes** — configured instances of NodeCode with default settings
- **ProcessNodes** — the actual nodes wired together into a directed graph for a specific request

When you say "show me my high-priority tasks due this week", your agent doesn't run a canned query — it builds a process that selects the right nodes, connects them, and executes the graph. The **Web UI** visualizes the process that was created for each action, so you can see exactly what happened and how.

## Commands

Run `phaibel` with no arguments to enter the interactive shell, or use commands directly:

| Command | Description |
|---------|-------------|
| `phaibel` | Launch interactive shell |
| `phaibel init` | Initialize a new vault |
| `phaibel interview` | Run (or re-run) the personality & onboarding interview |
| `phaibel setup` | Change your name/gender preferences |
| `phaibel today` | Show today's tasks and schedule |
| `phaibel todo [title]` | Create or list tasks |
| `phaibel todo done <title>` | Mark a task complete |
| `phaibel event [title]` | Create or list events |
| `phaibel note [title]` | Create or list notes |
| `phaibel goal [title]` | Create or list goals |
| `phaibel person [name]` | Create or list people |
| `phaibel todont [title]` | Create or list todonts |
| `phaibel remember <text>` | Quick-capture to inbox |
| `phaibel cal` | Calendar view |
| `phaibel config` | View/manage LLM configuration |
| `phaibel service start` | Start the background service + web UI |
| `phaibel shell` | Enter interactive mode (same as no args) |

## BYOK (Bring Your Own Key)

Phaibel doesn't come with an API key — you bring your own from [OpenAI](https://platform.openai.com) and/or [Anthropic](https://console.anthropic.com). Your keys are stored locally in `~/.phaibel/secrets.json` and never leave your machine.

```bash
# Add OpenAI
phaibel config add-provider openai

# Add Anthropic
phaibel config add-provider anthropic

# Or both — Phaibel will use each provider's strengths
```

When both providers are configured, Phaibel automatically picks the best model for each task based on six **capabilities**:

| Capability | What it does | OpenAI default | Anthropic default |
|------------|-------------|----------------|-------------------|
| reason | Complex thinking | gpt-4o | claude-opus-4-6 |
| chat | Conversation | gpt-4o | claude-sonnet-4-6 |
| summarize | Condensing info | gpt-4o-mini | claude-haiku-4-5 |
| categorize | Classification | gpt-4o-mini | claude-haiku-4-5 |
| format | Text formatting | gpt-4o-mini | claude-haiku-4-5 |
| embed | Vector embeddings | text-embedding-3-small | *(not supported)* |

You can override any mapping:

```bash
phaibel config set-capability reason anthropic claude-sonnet-4-6
phaibel config reset-capability reason   # restore auto-selection
phaibel config                           # view current configuration
```

### Where Things Live

```
~/.phaibel/
  secrets.json         # API keys (never committed)

your-vault/
  .vault.md            # Vault root context (read by the LLM)
  .state.json          # User profile (name, personality, agent name)
  .phaibel/           # Vault-scoped config
    config.json        # LLM capability overrides
    entity-types.json  # Custom entity type definitions
  todos/               # Markdown files with YAML frontmatter
  events/
  notes/
  goals/
  people/
  recurrences/
  todonts/
  inbox/
```

Every entity is a plain `.md` file. You can edit them with any text editor, sync them with Git, or back them up however you like.

## Web UI

Phaibel includes a browser-based dashboard:

```bash
phaibel service start
```

This starts a background daemon with a web UI (default: `http://localhost:3737`) that shows:

- Today's tasks with priority badges
- 3-day calendar view
- Chat interface with the same natural language capabilities as the CLI
- Interactive Q&A when your agent needs clarification during a process

## The Interactive Shell

When you run `phaibel` with no arguments, you get a full interactive shell with:

- **Tab completion** for commands
- **Up/Down arrow** history
- **Natural language fallback** — anything that isn't a command gets routed to the AI chat
- **Vault context** — the LLM reads `.vault.md` for project-specific context

## Development

```bash
npm run dev          # Run with tsx (hot reload)
npm test             # Run unit tests
npm run test:all     # Run all tests including integration
npm run build        # Compile TypeScript to dist/
```

## License

MIT © [Clift Labs](https://github.com/clift-labs)
