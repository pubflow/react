# Persistent Cache

This document explains how to use persistent cache with the `@pubflow/react` package.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Configuration Options](#configuration-options)
- [Usage with useBridgeCrud](#usage-with-usebridgecrud)
- [Usage with useBridgeQuery](#usage-with-usebridgequery)
- [Advanced Usage](#advanced-usage)
  - [Custom Storage Keys](#custom-storage-keys)
  - [Compression](#compression)
  - [Cache Invalidation](#cache-invalidation)
  - [Debugging](#debugging)

## Overview

By default, SWR (the data fetching library used by Pubflow) stores its cache in memory. This means that when the user refreshes the page or closes and reopens the application, all cached data is lost and must be fetched again.

Persistent cache solves this problem by storing the cache in localStorage (or AsyncStorage for React Native), allowing the data to persist between page refreshes and application restarts. This provides several benefits:

1. **Improved initial load time**: The application can show cached data immediately while fetching fresh data in the background.
2. **Reduced API calls**: The application doesn't need to refetch data that hasn't changed.
3. **Better offline experience**: The application can show cached data even when offline.

## Setup

To enable persistent cache, you need to:

1. Create a persistent cache provider
2. Pass it to the `PubflowProvider`

### React

```jsx
// App.jsx
import React from 'react';
import { PubflowProvider, createPersistentCache } from '@pubflow/react';

function App() {
  // Create a persistent cache provider
  const persistentCacheProvider = createPersistentCache({
    prefix: 'my_app_cache',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    debug: process.env.NODE_ENV === 'development'
  });
  
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        bridgeBasePath: '/bridge',
        authBasePath: '/auth'
      }}
      persistentCache={{
        enabled: true,
        provider: persistentCacheProvider
      }}
    >
      <YourApp />
    </PubflowProvider>
  );
}

export default App;
```

### Next.js

```jsx
// _app.js
import { PubflowProvider, createPersistentCache } from '@pubflow/nextjs';

function MyApp({ Component, pageProps }) {
  // Create a persistent cache provider
  const persistentCacheProvider = createPersistentCache({
    prefix: 'my_nextjs_app_cache',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    debug: process.env.NODE_ENV === 'development'
  });
  
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        bridgeBasePath: '/bridge',
        authBasePath: '/auth'
      }}
      persistentCache={{
        enabled: true,
        provider: persistentCacheProvider
      }}
    >
      <Component {...pageProps} />
    </PubflowProvider>
  );
}

export default MyApp;
```

### React Native

```jsx
// App.js
import React from 'react';
import { PubflowProvider, createPersistentCache } from '@pubflow/react-native';

function App() {
  // Create a persistent cache provider
  const persistentCacheProvider = createPersistentCache({
    prefix: 'my_rn_app_cache',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    debug: __DEV__
  });
  
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        bridgeBasePath: '/bridge',
        authBasePath: '/auth'
      }}
      persistentCache={{
        enabled: true,
        provider: persistentCacheProvider
      }}
    >
      <YourApp />
    </PubflowProvider>
  );
}

export default App;
```

## Configuration Options

The `createPersistentCache` function accepts the following options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| prefix | string | Prefix for storage keys | 'pubflow_cache' |
| ttl | number | Time to live in milliseconds | 24 * 60 * 60 * 1000 (24 hours) |
| maxItemSize | number | Maximum size of a cache item in bytes | 2 * 1024 * 1024 (2MB) |
| compress | boolean | Whether to compress cache data to save space | false |
| serialize | function | Custom serialization function | JSON.stringify |
| deserialize | function | Custom deserialization function | JSON.parse |
| debug | boolean | Whether to log cache operations | false |
| storage | string | Storage mechanism to use (React only) | 'localStorage' |

## Usage with useBridgeCrud

Once you've set up persistent cache, it will automatically work with `useBridgeCrud`. The cache keys are generated based on the entity configuration and search parameters, ensuring that the cache is properly maintained.

```jsx
import { useBridgeCrud } from '@pubflow/react';

function UserList() {
  const {
    items: users,
    loading,
    error,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    hasMore
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    }
  });
  
  // The data will be cached and persisted between page refreshes
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

## Usage with useBridgeQuery

Similarly, `useBridgeQuery` will automatically use the persistent cache:

```jsx
import { useBridgeApi, useBridgeQuery } from '@pubflow/react';

function UserList() {
  const userService = useBridgeApi({ endpoint: 'users' });
  const { 
    data: users, 
    isLoading, 
    error, 
    refetch 
  } = useBridgeQuery(
    userService,
    'list',
    { limit: 10, page: 1 }
  );
  
  // The data will be cached and persisted between page refreshes
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

## Advanced Usage

### Custom Storage Keys

By default, the cache keys are generated based on the entity configuration and search parameters. However, you can customize the prefix to avoid conflicts with other applications:

```jsx
const persistentCacheProvider = createPersistentCache({
  prefix: 'my_custom_app_cache'
});
```

### Compression

For large datasets, you can enable compression to reduce the storage size:

```jsx
const persistentCacheProvider = createPersistentCache({
  compress: true
});
```

### Cache Invalidation

The cache is automatically invalidated when:

1. The TTL (time to live) expires
2. A mutation operation is performed (create, update, delete)

You can also manually invalidate the cache by calling the `clear` method on the SWR cache:

```jsx
import { useSWRConfig } from 'swr';

function ClearCacheButton() {
  const { cache } = useSWRConfig();
  
  const handleClearCache = () => {
    cache.clear();
  };
  
  return (
    <button onClick={handleClearCache}>
      Clear Cache
    </button>
  );
}
```

### Debugging

You can enable debug mode to see cache operations in the console:

```jsx
const persistentCacheProvider = createPersistentCache({
  debug: process.env.NODE_ENV === 'development'
});
```

This will log cache hits, misses, and other operations, which can be useful for debugging.
