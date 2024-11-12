import React, { useEffect } from "react";

function App() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://identity.netlify.com/v1/netlify-identity-widget.js";
    script.async = true;
    document.body.appendChild(script);

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
