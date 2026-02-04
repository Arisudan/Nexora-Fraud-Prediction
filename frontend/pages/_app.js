// FILE: pages/_app.js
// Main App component with global providers

import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
