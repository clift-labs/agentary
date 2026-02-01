# Dobbie - AI-Powered Notes System

A CLI assistant that manages notes with hierarchical context.

## Installation

```bash
npm install
npm run build
npm link
```

## Usage

```bash
dobbie today              # Show daily todos and notes
dobbie remember "note"    # Add to context
dobbie project            # Manage projects
dobbie sync               # Sync with GitHub
dobbie config             # Manage settings
```

## Configuration

Secrets are stored in `~/.dobbie/secrets.json`
Config is stored in `~/.dobbie/config.json`
