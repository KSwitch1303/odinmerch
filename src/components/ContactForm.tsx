'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!name.trim()) return 'Please enter your name.';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return 'Please enter a valid email address.';
    if (message.trim().length < 10) return 'Message should be at least 10 characters.';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (e) {
      setStatus('error');
      setError('We could not send your message. Please try again.');
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <label className="block text-sm uppercase tracking-wider mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            placeholder="Your full name"
            required
          />
        </div>
        <div>
          <label className="block text-sm uppercase tracking-wider mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm uppercase tracking-wider mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-40 border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            placeholder="How can we help?"
            required
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black tracking-wider uppercase text-sm hover:opacity-90 transition"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Sending…' : 'Send Message'}
          </button>
          {status === 'success' && (
            <span className="text-green-600 dark:text-green-400 text-sm">Message sent. We will reply soon.</span>
          )}
          {error && (
            <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
          )}
        </div>
      </div>
    </form>
  );
}

