# metabolikal

A Internal Dashboard (Refine) project built with Session-Driven Development.

## Tech Stack

- **Framework**: Refine (latest) + Next.js 16.0.7
- **Language**: TypeScript 5.9.3
- **Ui**: React 19.2.1 + shadcn/ui components
- **Forms**: React Hook Form 7.66.0 + Zod 4.1.12
- **Styling**: Tailwind CSS 4.1.17

## Quality Gates: Standard

- ✓ Linting (ESLint/Ruff)
- ✓ Formatting (Prettier/Ruff)
- ✓ Type checking (TypeScript strict/Pyright)
- ✓ Basic unit tests (Jest/pytest)
- ✓ 80% test coverage minimum
- ✓ Pre-commit hooks (Husky + lint-staged)
- ✓ Secret scanning (git-secrets, detect-secrets)
- ✓ Dependency vulnerability scanning
- ✓ Basic SAST (ESLint security/bandit)
- ✓ License compliance checking

**Test Coverage Target**: 80%

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

### Environment Setup

```bash
# Copy environment template
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### Supabase Configuration

This project uses [Supabase](https://supabase.com) as the backend. You need to configure the following environment variables:

```bash
# Required - Get these from your Supabase project dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional - For admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

To get these values:

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy the Project URL and anon public key

### Health Check

The application exposes a health check endpoint at `/api/health`:

```bash
# Check application health
curl http://localhost:3000/api/health
```

Response when healthy:

```json
{
  "status": "ok",
  "timestamp": "2026-01-19T10:00:00.000Z",
  "database": "connected"
}
```

Response when database is unreachable (HTTP 503):

```json
{
  "status": "degraded",
  "timestamp": "2026-01-19T10:00:00.000Z",
  "database": "disconnected"
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## Additional Features

- ✓ **GitHub Actions CI/CD**: Automated testing and deployment workflows
- ✓ **Environment Templates**: .env files and .editorconfig for all editors

## Documentation

See `ARCHITECTURE.md` for detailed technical documentation including:

- Architecture decisions and trade-offs
- Project structure reference
- Code patterns and examples
- Database workflow
- Troubleshooting guides

## Session-Driven Development

This project uses Session-Driven Development (Solokit) for organized, AI-augmented development.

### Commands

- `/sk:work-new` - Create a new work item
- `/sk:work-list` - List all work items
- `/sk:start` - Start working on a work item
- `/sk:status` - Check current session status
- `/sk:validate` - Validate quality gates
- `/sk:end` - Complete current session
- `/sk:learn` - Capture a learning

### Documentation

See `.session/` directory for:

- Work item specifications (`.session/specs/`)
- Session briefings (`.session/briefings/`)
- Session summaries (`.session/history/`)
- Captured learnings (`.session/tracking/learnings.json`)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
