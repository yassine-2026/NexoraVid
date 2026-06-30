import React from 'react';
import SEO from '../components/SEO';

export default function Cookies() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <SEO 
        title="Cookie Policy - NexoraVid" 
        description="Cookie Policy for NexoraVid. Understand how we use cookies." 
        path="/cookie-policy"
      />
      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
      <div className="prose prose-invert max-w-none text-slate-300">
        <p className="mb-4">Last updated: June 29, 2026</p>
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">What Are Cookies</h2>
        <p className="mb-4">As is common practice with almost all professional websites this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience. This page describes what information they gather, how we use it and why we sometimes need to store these cookies.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">How We Use Cookies</h2>
        <p className="mb-4">We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">The Cookies We Set</h2>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Site preferences cookies:</strong> In order to provide you with a great experience on this site we provide the functionality to set your preferences for how this site runs when you use it (like your language selection). In order to remember your preferences we need to set cookies.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4 text-white">Third Party Cookies</h2>
        <p className="mb-4">In some special cases we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.</p>
        <ul className="list-disc pl-6 mb-4">
          <li>The Google AdSense service we use to serve advertising uses a DoubleClick cookie to serve more relevant ads across the web and limit the number of times that a given ad is shown to you.</li>
          <li>For more information on Google AdSense see the official Google AdSense privacy FAQ.</li>
        </ul>
      </div>
    </div>
  );
}
