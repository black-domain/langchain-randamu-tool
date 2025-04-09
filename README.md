# Timelock Showcase

## Environment Requirements

- Node.js (v22.7 or higher recommended)
- yarn package manager

## Configuration

Use the `config.ts` file for configuration.

### Configuration Steps

1. Copy the `config.example.ts` file and rename it to `config.ts`
2. Fill in your API keys and other configuration information in the `config.ts` file

### Configuration Options

- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: OpenAI model to use, defaults to 'gpt-3.5-turbo'
- `OPENAI_BASE_URL`: Base URL for OpenAI API
- `TAVILY_API_KEY`: Tavily search API key

## Usage

### Installation

```bash
# Install dependencies using yarn
yarn install

# Build the application
yarn build

# Start the production server
yarn start

# Project will running on http://localhost:3000
```

### Features

**1. Encrypting Specified Text with Timelock**

The agent can utilize the timelock encryption tool to encrypt specified text. You may also set the desired encryption duration; if not specified, the default duration is 5 minutes.

**2. Automatic Encryption of Thought Chain**
Upon the conclusion of a conversation, the agent's thought chain is automatically encrypted with a 5-minute timelock and saved locally as a txt file.

**3. Decrypting the Cipertext**
When it's time to decrypt, you can provide the ciphertext to the agent or upload the thought chain's ciphertext file (only .txt files are permitted). The agent will then use the timelock decryption tool to decrypt the content. 

*Please note that if the specified time has not yet been reached, decryption will not be successful.*