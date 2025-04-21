# Contributing to LogMe

Thank you for considering contributing to LogMe! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with the following information:

- Clear title and description
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment information (browser, OS, Node.js version)

### Feature Requests

We welcome feature requests! Please open an issue with:

- Clear title and description
- Use case for the feature
- Any implementation ideas you might have

### Pull Requests

1. Fork the repository
2. Create a new branch from `main`
3. Make your changes
4. Run tests: `npm test`
5. Ensure linting passes: `npm run lint`
6. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/logme.git

# Install dependencies
cd logme
npm install

# Start development mode
npm run dev
```

## Project Structure

- `src/` - TypeScript source code
  - `enums/` - Constants and enumerations
  - `types/` - TypeScript interfaces and types
  - `utils/` - Utility functions
  - `__tests__/` - Test files
- `scripts/` - Build and utility scripts
- `dist/` - Compiled output (not checked into git)

## Adding Log Codes

When adding new log codes:

1. Add the code to `src/enums/LogCodes.ts`
2. Update the mapping in `src/utils/LogDecoder.ts`
3. Run `npm run gen:schema` to update the JSON schema
4. Add tests for the new codes

## Testing

We use Jest for testing. Please add tests for any new functionality:

```bash
# Run all tests
npm test

# Run specific test
npm test -- -t "LogDecoder"
```

## Documentation

Please update the documentation when making changes:

- README.md for user-facing documentation
- Code comments for implementation details

## Commit Guidelines

Please follow these guidelines for commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests after the first line

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License. 