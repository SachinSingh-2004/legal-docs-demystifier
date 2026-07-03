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

function makeResponseRobust(response) {
  if (!response) return response;

  return new Proxy(response, {
    get(target, prop) {
      if (prop === 'json') {
        return async () => {
          const contentType = target.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              return await target.json();
            } catch (jsonErr) {
              return { error: 'Failed to parse server response as JSON' };
            }
          }

          try {
            const text = await target.text();
            if (!text) {
              return { error: `Connection failed: Backend server is offline or returned an empty response (Status ${target.status})` };
            }
            if (text.length < 200 && !text.trim().startsWith('<')) {
              return { error: text.trim() };
            }
            return { error: `Server returned an error page (Status ${target.status}). Please check if the backend server is running.` };
          } catch (textErr) {
            return { error: `Network error or invalid response (Status ${target.status})` };
          }
        };
      }
      
      const value = target[prop];
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    }
  });
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
    response = makeResponseRobust(response);

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
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken) => {
            try {
              options.headers['Authorization'] = `Bearer ${newToken}`;
              const retryRes = await fetch(url, options);
              resolve(makeResponseRobust(retryRes));
            } catch (err) {
              if (err.message === 'Failed to fetch') {
                reject(new Error('Could not connect to the server. Please ensure the backend is running.'));
              } else {
                reject(err);
              }
            }
          });
        });
      }
    }

    return response;
  } catch (err) {
    console.error('Fetch error:', err);
    if (err.message === 'Failed to fetch') {
      throw new Error('Could not connect to the server. Please ensure the backend is running.');
    }
    throw err;
  }
}

