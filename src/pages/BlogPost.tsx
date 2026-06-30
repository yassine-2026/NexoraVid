import React from 'react';
import SEO from '../components/SEO';
import { useParams, Link } from 'react-router-dom';

const articlesData: Record<string, any> = {
  'how-to-download-videos': {
    title: 'How to Download Videos in 4K and 8K Resolution',
    date: 'June 25, 2026',
    content: (
      <>
        <p>High-resolution displays are becoming the norm, and naturally, you want to enjoy content in the best quality possible. Downloading videos in 4K and 8K resolutions is no longer a luxury but a necessity for enthusiasts and professionals alike.</p>
        <h2>Why Resolution Matters</h2>
        <p>4K offers four times the pixels of standard 1080p HD, and 8K quadruples that again. This means sharper images, more detail, and an immersive viewing experience.</p>
        <h2>Using NexoraVid</h2>
        <p>NexoraVid makes grabbing these high-res files easy. When pasting a link, the system automatically queries the source for the highest available streams. Simply look for the '2160p' (4K) or '4320p' (8K) tags in the formats list and click download.</p>
      </>
    )
  },
  'understanding-video-formats': {
    title: 'MP4 vs WebM vs MKV: Understanding Video Formats',
    date: 'June 20, 2026',
    content: (
      <>
        <p>When downloading videos, you are often faced with a choice of formats. Let's break them down.</p>
        <h2>MP4 (MPEG-4 Part 14)</h2>
        <p>The universal standard. MP4 offers a great balance between quality and file size and plays on virtually every device, browser, and TV.</p>
        <h2>WebM</h2>
        <p>Developed by Google, WebM is designed specifically for the web. It uses the VP8 or VP9 video codecs and is highly optimized for streaming, often providing smaller file sizes for similar quality compared to MP4, especially at high resolutions.</p>
        <h2>MKV (Matroska)</h2>
        <p>MKV is a container that can hold unlimited video, audio, picture, and subtitle tracks. It's the go-to choice for high-quality archiving, though not all mobile devices support it natively without a third-party app.</p>
      </>
    )
  },
  'fair-use-copyright': {
    title: 'Fair Use and Downloading: A Legal Guide',
    date: 'June 15, 2026',
    content: (
      <>
        <p>Downloading content from the internet comes with legal responsibilities. It is crucial to understand copyright and fair use.</p>
        <h2>What is Fair Use?</h2>
        <p>Fair use is a legal doctrine that promotes freedom of expression by permitting the unlicensed use of copyright-protected works in certain circumstances, such as criticism, comment, news reporting, teaching, scholarship, and research.</p>
        <h2>Personal Use vs. Distribution</h2>
        <p>Downloading a video for offline personal viewing is generally considered acceptable in many jurisdictions, provided you do not redistribute, monetize, or use the content for commercial purposes. However, the terms of service of individual platforms (like YouTube) often prohibit downloading without an official button.</p>
        <p><strong>Disclaimer:</strong> This article does not constitute legal advice. Always respect the rights of creators and the terms of service of the platforms you use.</p>
      </>
    )
  }
};

export default function BlogPost() {
  const { slug } = useParams();
  const article = slug ? articlesData[slug] : null;

  if (!article) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
        <Link to="/blog" className="text-blue-400 hover:underline">Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12">
      <SEO 
        title={`${article.title} - NexoraVid Blog`}
        description={article.title}
        path={`/blog/${slug}`}
        type="article"
      />
      
      <Link to="/blog" className="text-sm text-blue-400 hover:underline mb-8 inline-block">&larr; Back to Blog</Link>
      
      <span className="text-xs font-mono text-slate-400 mb-2 block">{article.date}</span>
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white">{article.title}</h1>
      
      <div className="prose prose-invert prose-blue max-w-none text-slate-300">
        {article.content}
      </div>
    </div>
  );
}
