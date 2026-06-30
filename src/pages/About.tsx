import React from 'react';
import SEO from '../components/SEO';

export default function About() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <SEO 
        title="About Us - NexoraVid" 
        description="Learn more about NexoraVid, the ultimate universal video downloader." 
        path="/about"
      />
      <h1 className="text-3xl font-bold mb-6">About NexoraVid</h1>
      <div className="prose prose-invert max-w-none text-slate-300">
        <p className="mb-4">
          Welcome to NexoraVid, your number one source for downloading videos from the internet safely, quickly, and in the highest quality available. We're dedicated to providing you the very best video downloading experience, with an emphasis on speed, reliability, and broad platform support.
        </p>
        <p className="mb-4">
          Founded with a passion for media accessibility, NexoraVid has come a long way from its beginnings. When we first started out, our passion for helping users keep their favorite content offline drove us to build a tool that supports over 20 platforms, including YouTube, TikTok, Facebook, Twitter, and more.
        </p>
        <p className="mb-4">
          We believe that you should be able to access your favorite videos without worrying about internet connectivity. Our tool supports up to 8K resolution, ensuring you never have to compromise on quality.
        </p>
        <p className="mb-4">
          We hope you enjoy our service as much as we enjoy offering it to you. If you have any questions or comments, please don't hesitate to contact us.
        </p>
        <p className="font-bold mt-8">Sincerely,<br />The NexoraVid Team</p>
      </div>
    </div>
  );
}
