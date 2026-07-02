/**
 * API Fetch wrapper to handle automatic JWT headers and token refreshes.
 */

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

export async function apiFetch(url, options = {}) {
  // 1. Get access token from localStorage
  const accessToken = localStorage.getItem('accessToken');
  
  // Initialize headers
  options.headers = options.headers || {};
  if (accessToken && !options.headers['Authorization']) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Set Content-Type default if body is not FormData
  if (!(options.body instanceof FormData) && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }

  try {
    let response = await fetch(url, options);

    // 2. Intercept 401 Unauthorized errors (expired token)
    if (response.status === 401) {
      const errorJson = await response.clone().json().catch(() => ({}));
      
      if (errorJson.code === 'TOKEN_EXPIRED') {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, trigger logout event
          window.dispatchEvent(new Event('auth-logout'));
          return response;
        }

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newAccessToken = refreshData.accessToken;
              
              localStorage.setItem('accessToken', newAccessToken);
              isRefreshing = false;
              onRefreshed(newAccessToken);
            } else {
              isRefreshing = false;
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              window.dispatchEvent(new Event('auth-logout'));
              return response;
            }
          } catch (refreshErr) {
            isRefreshing = false;
            window.dispatchEvent(new Event('auth-logout'));
            return response;
          }
        }

        // Wait for token refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            options.headers['Authorization'] = `Bearer ${newToken}`;
            resolve(fetch(url, options));
          });
        });
      }
    }

    return response;
  } catch (err) {
    console.error('Fetch error:', err);
    throw err;
  }
}
