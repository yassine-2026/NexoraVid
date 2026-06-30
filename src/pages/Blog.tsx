import React from 'react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

const articles = [
  {
    slug: 'how-to-download-videos',
    title: 'How to Download Videos in 4K and 8K Resolution',
    excerpt: 'Learn the best methods for keeping high-quality video content offline...',
    date: 'June 25, 2026'
  },
  {
    slug: 'understanding-video-formats',
    title: 'MP4 vs WebM vs MKV: Understanding Video Formats',
    excerpt: 'A comprehensive guide to different video formats and which one to choose...',
    date: 'June 20, 2026'
  },
  {
    slug: 'fair-use-copyright',
    title: 'Fair Use and Downloading: A Legal Guide',
    excerpt: 'Understand your rights and responsibilities when saving online content...',
    date: 'June 15, 2026'
  }
];

export default function Blog() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <SEO 
        title="Blog - NexoraVid" 
        description="Read articles about video downloading, formats, and fair use on the NexoraVid blog." 
        path="/blog"
      />
      <h1 className="text-3xl font-bold mb-8 text-center">Blog</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <Link key={article.slug} to={`/blog/${article.slug}`} className="block bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-2xl p-6 transition-colors">
            <span className="text-xs font-mono text-blue-400 mb-2 block">{article.date}</span>
            <h2 className="text-xl font-bold mb-3 text-white">{article.title}</h2>
            <p className="text-slate-400 text-sm">{article.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
