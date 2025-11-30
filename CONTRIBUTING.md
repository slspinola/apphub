# Contributing to AppHub

Thank you for your interest in contributing to AppHub! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/apphub.git
   cd apphub
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/slspinola/apphub.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up your environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
6. **Run database migrations**:
   ```bash
   npx prisma migrate dev
   ```
7. **Start the development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

1. **Create a feature branch** from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes** thoroughly

4. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```

5. **Keep your branch up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

6. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** on GitHub

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Examples

```bash
feat(auth): add password reset functionality

Implement password reset flow with email verification.
Includes token generation and expiration handling.

Closes #123
```

```bash
fix(dashboard): correct user count display

The user count was showing incorrect data due to
a filtering bug in the query.
```

## Pull Request Process

1. **Ensure your PR**:
   - Has a clear title and description
   - References related issues (e.g., "Closes #123")
   - Includes tests if applicable
   - Passes all CI checks
   - Follows coding standards

2. **PR Title Format**:
   ```
   <type>: <description>
   ```
   Example: `feat: add email verification flow`

3. **PR Description Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   How has this been tested?

   ## Related Issues
   Closes #issue_number
   ```

4. **Review Process**:
   - At least one maintainer approval required
   - Address all review comments
   - Keep discussions constructive and professional

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define proper types, avoid `any`
- Use interfaces for object shapes
- Use type aliases for unions/intersections

### React Components

- Use functional components with hooks
- Use Server Components by default
- Add 'use client' only when necessary
- Proper component naming (PascalCase)
- Keep components focused and small

### File Structure

```
src/
├── app/              # Next.js pages (App Router)
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── forms/       # Form components
├── features/        # Feature-based modules
│   └── [feature]/
│       ├── actions.ts    # Server actions
│       └── schemas.ts    # Zod schemas
├── lib/             # Utility functions
└── types/           # TypeScript types
```

### Naming Conventions

- **Files**: kebab-case (e.g., `user-list.tsx`)
- **Components**: PascalCase (e.g., `UserList`)
- **Functions**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_USERS`)
- **Types/Interfaces**: PascalCase (e.g., `UserData`)

### Code Style

- Use Prettier for formatting (automatic)
- Follow ESLint rules
- Maximum line length: 100 characters
- Use meaningful variable names
- Add comments for complex logic
- Use async/await over promises

### Import Order

1. External packages
2. Absolute imports (@/)
3. Relative imports
4. CSS imports

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getUsers } from './actions'
import './styles.css'
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

### Writing Tests

- Write tests for new features
- Update tests for bug fixes
- Aim for meaningful test coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Test Structure

```typescript
describe('UserList', () => {
  it('should render list of users', () => {
    // Arrange
    const users = [{ id: '1', name: 'John' }]
    
    // Act
    render(<UserList users={users} />)
    
    // Assert
    expect(screen.getByText('John')).toBeInTheDocument()
  })
})
```

## Database Changes

### Creating Migrations

```bash
# Create a new migration
npx prisma migrate dev --name description_of_changes

# Reset database (development only)
npx prisma migrate reset
```

### Migration Guidelines

- Use descriptive migration names
- Test migrations before committing
- Never edit existing migrations
- Document breaking changes
- Include rollback strategy for production

## Documentation

- Update README.md for major features
- Document new environment variables
- Add JSDoc comments for complex functions
- Update API documentation
- Include examples in documentation

## Questions?

If you have questions or need help:

1. Check existing documentation
2. Search closed issues
3. Open a new issue with the `question` label
4. Contact the maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to AppHub! 🚀

