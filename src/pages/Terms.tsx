import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function Terms() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <Helmet>
        <title>Terms of Service - NexoraVid</title>
        <meta name="description" content="Terms of Service for using NexoraVid." />
      </Helmet>
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose prose-invert max-w-none text-slate-300">
        <p className="mb-4">Last updated: June 29, 2026</p>
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">1. Acceptance of Terms</h2>
        <p className="mb-4">By accessing and using NexoraVid, you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">2. Use License</h2>
        <p className="mb-4">NexoraVid is a tool intended for downloading user-owned content or content that is explicitly authorized by the copyright holder for download. Users are strictly prohibited from using this service to infringe upon the intellectual property rights of others.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">3. Disclaimer</h2>
        <p className="mb-4">The materials on NexoraVid are provided on an 'as is' basis. NexoraVid makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-white">4. Limitations</h2>
        <p className="mb-4">In no event shall NexoraVid or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on NexoraVid's website.</p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-white">5. Governing Law</h2>
        <p className="mb-4">These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
      </div>
    </div>
  );
}
