# Frontend Architecture

## Overview
React 18 SPA with Vite, Tailwind CSS, and Firebase authentication. Features HLS video streaming, ML-powered recommendations, and real-time watch parties.

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | React 18.3.1, Vite |
| **Routing** | React Router DOM 7.1.4 |
| **Styling** | Tailwind CSS 3.4.17, PostCSS |
| **HTTP Client** | Axios 1.7.9 |
| **Video** | HLS.js 1.5.22 |
| **Auth** | Firebase 11.1.0 |
| **WebSocket** | Socket.IO Client 4.8.1 |
| **UI** | React Icons, Lucide React, React Hot Toast |

---

## Project Structure

```
FRONTEND/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Root component
│   ├── firebase.js           # Firebase config
│   │
│   ├── api/                  # HTTP clients
│   │   ├── movieApi.js
│   │   ├── userApi.js
│   │   └── watchPartyApi.js
│   │
│   ├── components/           # Reusable UI
│   │   ├── MovieCard.jsx
│   │   ├── MoviePlayerComponent.jsx  # Legacy player
│   │   ├── SecureMoviePlayer.jsx     # Secure player
│   │   ├── Navbar.jsx
│   │   └── ...
│   │
│   ├── context/              # Global state
│   │   ├── AuthContext.jsx
│   │   └── MovieContext.jsx
│   │
│   ├── pages/                # Routes
│   │   ├── Home.jsx
│   │   ├── Browse.jsx
│   │   ├── MovieDetail.jsx
│   │   ├── Player.jsx
│   │   ├── WatchParty.jsx
│   │   └── ...
│   │
│   └── utils/                # Helpers
│
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Architecture Patterns

### Component Hierarchy
```
App
├── AuthProvider (Context)
│   └── MovieProvider (Context)
│       ├── Navbar
│       ├── Router
│       │   ├── Home (HeroSection, Recommendations)
│       │   ├── Browse (SearchBar, FilterSidebar, MovieGrid)
│       │   ├── MovieDetail (MovieHero, ActionButtons, SimilarMovies)
│       │   ├── Player (SecureMoviePlayer/Legacy)
│       │   ├── WatchParty (Controls, ParticipantList)
│       │   └── AdminDashboard
│       └── Footer
```

### State Management
- **Context API**: Global auth & movie state
- **useState**: Component-local state
- **Server State**: Fetched from backend APIs
- **LocalStorage**: Theme, preferences

---

## Key Features

### 1. Video Streaming
**Legacy Player** (Unsecured):
```javascript
// Direct HLS streaming
getStreamUrl: (id) => `/api/movies/stream/${id}/master.m3u8`
```

**Secure Player** (Tokenized):
```javascript
// Token-based with auto-refresh
getSecureStreamUrl: async (id) => {
  const { playlistUrl, expiresIn } = await axios.get(`/videos/${id}/player`);
  // Auto-refresh token at 80% expiry
}
```

### 2. Authentication Flow
```
Login → Firebase Auth → Get JWT → Backend Validation → AuthContext Update
```

**Firebase Integration:**
- Email/password authentication
- Token auto-refresh
- Backend sync via `/api/auth/register`

### 3. Routing
**Public Routes**: `/`, `/browse`, `/movie/:id`, `/login`  
**Protected Routes**: `/player/:id`, `/profile`, `/watchlist`  
**Admin Routes**: `/admin`

**Protected Route Guard:**
```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  return children;
}
```

### 4. API Integration
**Axios Instance** with Firebase token interceptor:
```javascript
axiosInstance.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Key Endpoints:**
- Movies: CRUD, search, filter, recommendations
- Users: Watchlist, favorites, history, progress
- Streaming: Legacy (`/movies/stream`) + Secure (`/videos/player`)
- Watch Parties: Create, join, sync

---

## Performance Optimizations

1. **Code Splitting**: Lazy load admin & watch party pages
2. **Image Lazy Loading**: `loading="lazy"` attribute
3. **Memoization**: `useMemo`, `memo` for expensive renders
4. **Debounced Search**: 500ms delay on search input
5. **API Caching**: 5-minute client-side cache
6. **Virtual Scrolling**: Large lists with `react-window`

---

## Build & Deployment

**Development:**
```bash
npm run dev    # Port 5173
```

**Production:**
```bash
npm run build  # Output: dist/
```

**Environment Variables:**
```env
VITE_API_URL=http://localhost:8080/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

**Vite Config:**
- Dev proxy: `/api` → `localhost:8080`
- Build chunks: vendor (React), firebase, video (HLS.js)

---

## Responsive Design
Mobile-first with Tailwind breakpoints:
```jsx
<div className="grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
```

---

**Version**: 1.0  
**Last Updated**: December 29, 2025
