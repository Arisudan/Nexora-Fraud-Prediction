// FILE: components/Layout.js
// Main layout wrapper component

import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children, title = 'Nexora Fraud Predictor' }) {
  const pageTitle = `${title} | Crowd Intelligence Fraud Detection`;
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Predict scams before they happen using crowd intelligence. Check phone numbers, emails, and UPI IDs for fraud risk." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <Footer />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          },
          success: {
            style: {
              background: 'linear-gradient(135deg, #059669, #10b981)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#059669',
            },
          },
          error: {
            style: {
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#dc2626',
            },
          },
        }}
      />
    </>
  );
}
