import React, { useEffect } from "react";

function App() {
  useEffect(() => {
    const url = "https://identity.netlify.com/v1/netlify-identity-widget.js";
    const script = document.createElement("script");
    script.async = true;

    try {
      // Prefer Trusted Types if available
      if (window.trustedTypes && window.trustedTypes.createPolicy) {
        const policy = window.trustedTypes.createPolicy('netlify-policy', { createScriptURL: (v) => v });
        script.src = policy.createScriptURL(url);
      } else {
        script.src = url;
      }
      document.body.appendChild(script);
    } catch (e) {
      console.warn('Trusted Types prevented setting script.src dynamically, falling back to static insertion', e);
      // Fallback: append a static script tag via DOMParser to avoid direct assignment
      try {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `<script src="${url}" async></script>`;
        document.body.appendChild(wrapper.firstChild);
      } catch (err) {
        console.error('Failed to load Netlify Identity widget:', err);
      }
    }

    script.onload = () => {
      window.netlifyIdentity = window.netlifyIdentity || {};
      window.netlifyIdentity.on('init', () => {
        // Customize here
        console.log('Netlify Identity initialized');
      });
    };
  }, []);

  return (
    <div>
      <h1>Your App Content</h1>
      <p>Netlify Identity Widget is now active.</p>
    </div>
  );
}

export default App;
