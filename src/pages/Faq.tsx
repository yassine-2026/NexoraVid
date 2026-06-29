import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function Faq() {
  const faqs = [
    {
      q: 'Is NexoraVid free to use?',
      a: 'Yes, NexoraVid is completely free to use for personal, non-commercial purposes.'
    },
    {
      q: 'Which platforms are supported?',
      a: 'We support over 20 platforms including YouTube, TikTok, Facebook, Twitter (X), Instagram, Vimeo, Reddit, and more.'
    },
    {
      q: 'Is it legal to download videos?',
      a: 'NexoraVid is a tool for downloading user-owned content or content that is explicitly authorized by the copyright holder. You must respect copyright laws and the terms of service of the respective platforms.'
    },
    {
      q: 'What formats and resolutions are supported?',
      a: 'We support MP4, WebM, and MP3 formats. Resolutions range from 144p up to 8K, depending on the original video quality available.'
    },
    {
      q: 'Where are the videos saved?',
      a: 'Videos are downloaded directly to your device\'s default download folder via your web browser.'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <Helmet>
        <title>Frequently Asked Questions (FAQ) - NexoraVid</title>
        <meta name="description" content="Find answers to common questions about NexoraVid." />
      </Helmet>
      <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
      
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-2 text-white">{faq.q}</h3>
            <p className="text-slate-300 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
