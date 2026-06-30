import React from 'react';
import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <SEO 
        title="Privacy Policy - NexoraVid" 
        description="Privacy Policy for NexoraVid. Learn how we handle your data." 
        path="/privacy-policy"
      />
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none text-slate-300">
        <p className="mb-4">Last updated: June 29, 2026</p>
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">1. Introduction</h2>
        <p className="mb-4">Welcome to NexoraVid. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">2. The Data We Collect About You</h2>
        <p className="mb-4">We do not require you to create an account to use our basic downloading services. However, when you visit the site, we may collect technical data such as your IP address, browser type and version, time zone setting and location, and operating system.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">3. Third-Party Vendors and Google AdSense</h2>
        <p className="mb-4">We use third-party advertising companies, including Google AdSense, to serve ads when you visit our website. These companies may use information (not including your name, address, email address, or telephone number) about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites.</li>
          <li>Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.</li>
          <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Ads Settings</a>.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4 text-white">4. Analytics</h2>
        <p className="mb-4">We may use third-party Service Providers to monitor and analyze the use of our Service.</p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-white">5. Changes to This Privacy Policy</h2>
        <p className="mb-4">We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-white">6. Contact Us</h2>
        <p className="mb-4">If you have any questions about this Privacy Policy, please contact us at support@nexoravid.com.</p>
      </div>
    </div>
  );
}
