
// Inject token into all gallery requests
(function() {
  // Function to add Authorization header to fetch requests
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // Only intercept gallery URLs
    if (typeof url === 'string' && url.includes('/galleries/')) {
      const token = localStorage.getItem('gallery_auth_token');
      
      if (token) {
        options.headers = options.headers || {};
        options.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return originalFetch.call(this, url, options);
  };
  
  // Add token to XHR requests
  const originalOpen = XMLHttpRequest.prototype.open;
  
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this._url = url;
    originalOpen.apply(this, arguments);
  };
  
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.send = function(body) {
    if (typeof this._url === 'string' && this._url.includes('/galleries/')) {
      const token = localStorage.getItem('gallery_auth_token');
      
      if (token) {
        this.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    }
    
    originalSend.apply(this, arguments);
  };
})();
