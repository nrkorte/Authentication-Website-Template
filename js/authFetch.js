  /**
   * Makes an authenticated fetch request with JWT from localStorage.
   * Returns parsed JSON. Throws on 401/403 or other HTTP errors.
   *
   * @param {string} url - The URL to fetch
   * @param {object} options - Optional fetch options
   */
  function authFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');

    if (!token) {
      return Promise.reject(new Error("You are not authenticated. Please log in again."));
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    return fetch(url, finalOptions).then(response => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error(`Server responded with status ${response.status}`);
      }
      return response.json();
    });
  }