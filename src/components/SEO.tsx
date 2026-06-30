import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  path: string;
  type?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description, path, type = 'website' }) => {
  const url = `https://nexoravid.onrender.com${path === '/' ? '' : path}`;
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="NexoraVid" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'Article' : type === 'WebApplication' ? 'WebApplication' : 'WebPage',
          "name": title,
          "description": description,
          "url": url,
          "applicationCategory": type === 'WebApplication' ? 'MultimediaApplication' : undefined,
          "operatingSystem": type === 'WebApplication' ? 'All' : undefined,
          "publisher": {
            "@type": "Organization",
            "name": "NexoraVid",
            "logo": {
              "@type": "ImageObject",
              "url": "https://nexoravid.onrender.com/favicon.svg"
            }
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
