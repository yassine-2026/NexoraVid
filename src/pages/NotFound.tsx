import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-24 text-center">
      <Helmet>
        <title>404 Not Found - NexoraVid</title>
      </Helmet>
      <h1 className="text-6xl font-bold text-blue-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-slate-400 mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg">
        Return Home
      </Link>
    </div>
  );
}
