import React, { useState } from 'react';
import SEO from '../components/SEO';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to send message.');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-12">
      <SEO 
        title="Contact Us - NexoraVid" 
        description="Get in touch with the NexoraVid team for support, business inquiries, or feedback." 
        path="/contact"
      />
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      
      {submitted ? (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-6 rounded-2xl flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8" />
          <div>
            <h3 className="font-bold text-lg mb-1">Message Sent!</h3>
            <p className="text-sm">Thank you for contacting us. We will get back to you shortly.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Name</label>
            <input type="text" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input type="email" id="email" value={formData.email} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
            <input type="text" id="subject" value={formData.subject} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1">Message</label>
            <textarea id="message" value={formData.message} onChange={handleChange} required rows={5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"></textarea>
          </div>
          <button type="submit" disabled={loading} className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-slate-500 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  );
}
