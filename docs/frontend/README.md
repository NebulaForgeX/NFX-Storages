# Frontend Documentation

## Overview

The frontend is a modern React-based web console for managing storage services, providing an intuitive user interface for storage operations.

## Architecture

### Storage Console

**Storage Console** is a React + TypeScript + Vite application for managing storage services.

**Technology Stack:**
- **React 19**: Modern React with latest features
- **TypeScript 5.9**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **Zustand**: State management
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **i18next**: Internationalization

## Project Structure

```
storage-console/
├── src/
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── store/              # Zustand stores
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   ├── i18n/               # Internationalization
│   └── App.tsx             # Root component
├── public/                 # Static assets
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── Dockerfile              # Docker image
```

## Quick Start

### Prerequisites

- Node.js 18+ (or use `.nvmrc` for version management)
- npm or pnpm

### Development

```bash
cd storage-console

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev

# Build for production
npm run build
# or
pnpm build

# Preview production build
npm run preview
# or
pnpm preview
```

### Development Server

The dev server runs on `http://localhost:5173` (Vite default port).

## Features

### Core Features

- **Dashboard**: Overview of storage system status
- **Bucket Management**: Create, list, and manage buckets
- **Object Browser**: Browse and manage objects
- **User Management**: Manage users and access keys
- **Policy Management**: Configure access policies
- **Monitoring**: System metrics and health monitoring
- **Settings**: System configuration

### UI Features

- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Theme support
- **Internationalization**: Multi-language support
- **Real-time Updates**: Live data updates
- **Error Handling**: Comprehensive error messages
- **Loading States**: Smooth loading indicators

## Configuration

### Environment Variables

Create `.env` file:

```bash
# API endpoint
VITE_API_URL=http://localhost:9001

# Feature flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Build Configuration

Edit `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:9001',
        changeOrigin: true
      }
    }
  }
})
```

## API Integration

### API Client

The application uses Axios for API calls:

```typescript
import { apiClient } from '@/services/api'

// Example: List buckets
const buckets = await apiClient.get('/buckets')
```

### Authentication

The console supports:
- Access key / Secret key authentication
- Session management
- Token refresh

## Development

### Code Quality

```bash
# Lint code
npm run lint
# or
pnpm lint

# Type check
npm run type-check
# or
pnpm type-check
```

### Testing

```bash
# Run tests
npm test
# or
pnpm test

# Test with UI
npm run test:ui
# or
pnpm test:ui
```

### Project Scripts

- `dev`: Start development server
- `build`: Build for production
- `preview`: Preview production build
- `lint`: Run ESLint
- `type-check`: TypeScript type checking

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t storage-console:latest .

# Run container
docker run -p 3000:80 storage-console:latest
```

### Static Hosting

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy `dist/` directory to:
   - Nginx
   - Apache
   - CDN (Cloudflare, AWS CloudFront, etc.)
   - GitHub Pages
   - Netlify / Vercel

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name storage.example.com;
    root /var/www/storage-console;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://storage-backend:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Architecture Patterns

### State Management

- **Zustand**: Global state management
- **TanStack Query**: Server state and caching
- **React Context**: Theme and i18n

### Component Structure

- **Atomic Design**: Components organized by complexity
- **Composition**: Reusable component composition
- **Custom Hooks**: Shared logic extraction

### Routing

- **React Router**: Client-side routing
- **Protected Routes**: Authentication guards
- **Lazy Loading**: Code splitting for performance

## Internationalization

The application supports multiple languages via i18next:

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('welcome.title')}</h1>
}
```

## Styling

- **CSS Modules**: Component-scoped styles
- **Tailwind CSS** (if configured): Utility-first CSS
- **CSS Variables**: Theme customization

## Performance Optimization

- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: Optimized asset loading
- **Caching**: API response caching with TanStack Query

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend service is running
   - Check `VITE_API_URL` environment variable
   - Check CORS configuration in backend

2. **Build Failures**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Type Errors**
   - Run `npm run type-check`
   - Ensure TypeScript version is compatible
   - Check type definitions

### Debug Mode

Enable debug logging:
```bash
VITE_ENABLE_DEBUG=true npm run dev
```

## Related Documentation

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [TanStack Query](https://tanstack.com/query)
- [React Router](https://reactrouter.com/)

## License

See project root LICENSE file.
