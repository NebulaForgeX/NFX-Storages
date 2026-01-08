# Frontend Documentation

## Overview

The frontend is a modern React-based web console for managing storage services, providing an intuitive user interface for storage operations, user management, policy configuration, and system monitoring.

## Architecture

### Storage Console

**Storage Console** is a React + TypeScript + Vite application for managing storage services.

**Technology Stack:**
- **React 19**: Modern React with latest features
- **TypeScript 5.9**: Type-safe development
- **Vite**: Fast build tool and dev server (using rolldown-vite)
- **React Router 7**: Client-side routing
- **TanStack Query 5**: Data fetching and caching
- **Zustand**: Lightweight state management
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **i18next**: Internationalization support
- **Axios**: HTTP client
- **Lucide React**: Icon library

## Project Structure

```
storage-console/
├── src/
│   ├── components/         # React components
│   │   ├── common/        # Shared components
│   │   ├── forms/         # Form components
│   │   └── layout/       # Layout components
│   ├── pages/             # Page components
│   │   ├── dashboard/    # Dashboard page
│   │   ├── buckets/       # Bucket management
│   │   ├── objects/       # Object browser
│   │   ├── users/         # User management
│   │   ├── policies/      # Policy management
│   │   └── settings/      # Settings page
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   │   ├── api.ts         # API client
│   │   └── ...            # Service modules
│   ├── store/             # Zustand stores
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   ├── i18n/              # Internationalization
│   │   ├── locales/       # Translation files
│   │   └── config.ts      # i18n configuration
│   ├── styles/            # Global styles
│   └── App.tsx            # Root component
├── public/                # Static assets
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── eslint.config.js       # ESLint configuration
└── Dockerfile             # Docker image
```

## Quick Start

### Prerequisites

- **Node.js 18+** (or use `.nvmrc` for version management)
- **npm** or **pnpm** package manager
- **Git** for cloning the repository

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

**Hot Module Replacement (HMR)** is enabled for instant updates during development.

## Features

### Core Features

- **Dashboard**: Overview of storage system status, metrics, and health
- **Bucket Management**: Create, list, delete, and configure buckets
- **Object Browser**: Browse, upload, download, and manage objects
- **User Management**: Create, update, and manage users and access keys
- **Policy Management**: Configure and manage access policies
- **Monitoring**: System metrics, health monitoring, and logs
- **Settings**: System configuration and preferences

### UI Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Theme support with system preference detection
- **Internationalization**: Multi-language support (i18n)
- **Real-time Updates**: Live data updates using TanStack Query
- **Error Handling**: Comprehensive error messages and handling
- **Loading States**: Smooth loading indicators and skeletons
- **Accessibility**: WCAG-compliant components

## Configuration

### Environment Variables

Create `.env` file in the root directory:

```bash
# API endpoint
VITE_API_URL=http://localhost:9001

# Feature flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true

# Build configuration
VITE_BUILD_TIME=__BUILD_TIME__
```

### Build Configuration

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:9001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query']
        }
      }
    }
  }
})
```

## API Integration

### API Client

The application uses Axios for API calls with automatic case conversion:

```typescript
import { apiClient } from '@/services/api'

// Example: List buckets
const response = await apiClient.get('/buckets')
const buckets = response.data

// Example: Create bucket
await apiClient.post('/buckets', {
  name: 'my-bucket',
  region: 'us-east-1'
})

// Example: Upload object
const formData = new FormData()
formData.append('file', file)
await apiClient.post('/buckets/my-bucket/objects', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

### Authentication

The console supports:

- **Access Key / Secret Key**: Primary authentication method
- **Session Management**: Token-based sessions
- **Token Refresh**: Automatic token refresh
- **Logout**: Secure session termination

**Authentication Flow:**

```typescript
// Login
const { data } = await apiClient.post('/auth/login', {
  accessKey: 'your-access-key',
  secretKey: 'your-secret-key'
})

// Store token
localStorage.setItem('token', data.token)

// Use token in requests
apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

## Development

### Code Quality

```bash
# Lint code
npm run lint
# or
pnpm lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
# or
pnpm type-check

# Format code
npm run format
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

# Coverage
npm run test:coverage
```

### Project Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start development server |
| `build` | Build for production |
| `preview` | Preview production build |
| `lint` | Run ESLint |
| `lint:fix` | Fix ESLint issues |
| `type-check` | TypeScript type checking |
| `format` | Format code with Prettier |

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t storage-console:latest .

# Run container
docker run -p 3000:80 \
  -e VITE_API_URL=http://storage-backend:9000 \
  storage-console:latest
```

### Static Hosting

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` directory to:**
   - **Nginx**: Web server
   - **Apache**: Web server
   - **CDN**: Cloudflare, AWS CloudFront, etc.
   - **GitHub Pages**: Static site hosting
   - **Netlify / Vercel**: Modern hosting platforms

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name storage.example.com;
    root /var/www/storage-console;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://storage-backend:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Architecture Patterns

### State Management

- **Zustand**: Global state management for UI state
- **TanStack Query**: Server state and caching
- **React Context**: Theme and i18n context

**Example Zustand Store:**

```typescript
import { create } from 'zustand'

interface AppState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme })
}))
```

### Component Structure

- **Atomic Design**: Components organized by complexity
- **Composition**: Reusable component composition
- **Custom Hooks**: Shared logic extraction

**Component Hierarchy:**

```
Pages
  └── Layout Components
      └── Feature Components
          └── Common Components
              └── UI Primitives
```

### Routing

- **React Router**: Client-side routing
- **Protected Routes**: Authentication guards
- **Lazy Loading**: Code splitting for performance

**Route Configuration:**

```typescript
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'

const Dashboard = lazy(() => import('@/pages/dashboard'))
const Buckets = lazy(() => import('@/pages/buckets'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/buckets',
    element: <Buckets />
  }
])
```

## Internationalization

The application supports multiple languages via i18next:

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t, i18n } = useTranslation()
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <button onClick={() => i18n.changeLanguage('zh')}>
        {t('common.switchLanguage')}
      </button>
    </div>
  )
}
```

**Translation Files:**

```
src/i18n/locales/
├── en/
│   └── translation.json
├── zh/
│   └── translation.json
└── ...
```

## Styling

- **CSS Modules**: Component-scoped styles
- **CSS Variables**: Theme customization
- **Responsive Design**: Mobile-first approach

**Theme Variables:**

```css
:root {
  --color-primary: #007bff;
  --color-background: #ffffff;
  --color-text: #333333;
  --spacing-unit: 8px;
}
```

## Performance Optimization

- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: Optimized asset loading
- **Caching**: API response caching with TanStack Query
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: For large lists

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend service is running
   - Check `VITE_API_URL` environment variable
   - Check CORS configuration in backend
   - Verify network connectivity

2. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Check Node.js version
   node --version  # Should be 18+
   ```

3. **Type Errors**
   ```bash
   # Run type check
   npm run type-check
   
   # Ensure TypeScript version is compatible
   npm list typescript
   ```

4. **Port Already in Use**
   ```bash
   # Change port in vite.config.ts
   server: {
     port: 3001
   }
   ```

### Debug Mode

Enable debug logging:

```bash
VITE_ENABLE_DEBUG=true npm run dev
```

### Browser DevTools

- **React DevTools**: Component inspection
- **TanStack Query DevTools**: Query state inspection
- **Network Tab**: API request monitoring
- **Console**: Error and warning messages

## Best Practices

1. **Component Design**: Keep components small and focused
2. **Type Safety**: Use TypeScript strictly
3. **Error Handling**: Implement comprehensive error boundaries
4. **Performance**: Optimize re-renders and bundle size
5. **Accessibility**: Follow WCAG guidelines
6. **Testing**: Write unit and integration tests
7. **Documentation**: Document complex logic and components

## Related Documentation

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [TanStack Query](https://tanstack.com/query)
- [React Router](https://reactrouter.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [TypeScript](https://www.typescriptlang.org/)

## License

See project root LICENSE file.
