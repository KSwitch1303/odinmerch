'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminContentPage() {
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [homeHeroDesktopUrl, setHomeHeroDesktopUrl] = useState('');
  const [homeHeroMobileUrl, setHomeHeroMobileUrl] = useState('');
  const [slogan, setSlogan] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [copyrightText, setCopyrightText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHeroDesktop, setUploadingHeroDesktop] = useState(false);
  const [uploadingHeroMobile, setUploadingHeroMobile] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroDesktopFile, setHeroDesktopFile] = useState<File | null>(null);
  const [heroMobileFile, setHeroMobileFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        setBusinessName(json.businessName || 'ODIN');
        setLogoUrl(json.logoUrl || '');
        setHomeHeroDesktopUrl(json.homeHeroDesktopUrl || '');
        setHomeHeroMobileUrl(json.homeHeroMobileUrl || '');
        setSlogan(json.slogan || '');
        setFacebookUrl(json.facebookUrl || '');
        setInstagramUrl(json.instagramUrl || '');
        setTwitterUrl(json.twitterUrl || '');
        setTiktokUrl(json.tiktokUrl || '');
        setYoutubeUrl(json.youtubeUrl || '');
        setLinkedinUrl(json.linkedinUrl || '');
        setContactEmail(json.contactEmail || '');
        setPhoneNumber(json.phoneNumber || '');
        setAddress(json.address || '');
        setCopyrightText(json.copyrightText || '');
      }
      setLoading(false);
    };
    load();
  }, []);

  const uploadAsset = async (params: {
    file: File;
    path: string;
    replaceExisting?: boolean;
  }) => {
    const { file, path, replaceExisting } = params;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || '';
    if (!token) {
      throw new Error('You must be logged in as an admin to upload.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    if (replaceExisting) formData.append('replaceExisting', '1');

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const error = typeof json?.error === 'string' && json.error ? json.error : '';
      const detail = typeof json?.detail === 'string' && json.detail ? json.detail : '';
      throw new Error(detail ? `${error || 'Upload failed'}: ${detail}` : error || `Upload failed (${res.status}).`);
    }
    const url = String(json.data?.url || '');
    if (!url) throw new Error('Upload succeeded, but no URL was returned.');
    return url;
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    setUploading(true);
    setMessage('');
    try {
      const url = await uploadAsset({ file: logoFile, path: 'brand', replaceExisting: true });
      setLogoUrl(url);
      setMessage('Logo uploaded. Click “Save Settings” to apply.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const uploadHeroDesktop = async () => {
    if (!heroDesktopFile) return;
    setUploadingHeroDesktop(true);
    setMessage('');
    try {
      const url = await uploadAsset({ file: heroDesktopFile, path: 'home-hero/desktop' });
      setHomeHeroDesktopUrl(url);
      setMessage('Desktop hero image uploaded. Click “Save Settings” to apply.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploadingHeroDesktop(false);
    }
  };

  const uploadHeroMobile = async () => {
    if (!heroMobileFile) return;
    setUploadingHeroMobile(true);
    setMessage('');
    try {
      const url = await uploadAsset({ file: heroMobileFile, path: 'home-hero/mobile' });
      setHomeHeroMobileUrl(url);
      setMessage('Mobile hero image uploaded. Click “Save Settings” to apply.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploadingHeroMobile(false);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || '';
    if (!token) {
      setMessage('You must be logged in as an admin to save settings.');
      setSaving(false);
      return;
    }
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        businessName,
        logoUrl,
        homeHeroDesktopUrl,
        homeHeroMobileUrl,
        slogan,
        facebookUrl,
        instagramUrl,
        twitterUrl,
        tiktokUrl,
        youtubeUrl,
        linkedinUrl,
        contactEmail,
        phoneNumber,
        address,
        copyrightText,
      }),
    });
    if (res.ok) {
      setMessage('Settings saved.');
      if (businessName) {
        document.title = businessName;
      }
    } else {
      const json = await res.json().catch(() => null);
      const error = typeof json?.error === 'string' && json.error ? json.error : '';
      const detail = typeof json?.detail === 'string' && json.detail ? json.detail : '';
      setMessage(detail ? `${error || 'Failed to save settings'}: ${detail}` : error || `Failed to save settings (${res.status}).`);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-black mb-6">Brand Settings</h1>
      {loading ? (
        <div className="animate-pulse h-32 bg-gray-200 rounded" />
      ) : (
        <form onSubmit={onSave} className="space-y-6 text-black">
          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Business Name</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="e.g. ODIN"
              required
            />
          </div>
          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Slogan</label>
            <textarea
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black min-h-24"
              placeholder="Short description used in the footer"
            />
          </div>
          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Logo</label>
            <div className="space-y-3">
              {logoUrl ? (
                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <img src={logoUrl} alt="Current logo" className="h-12 w-auto" />
                    <button
                      type="button"
                      className="px-4 py-2 border border-black text-black tracking-wider uppercase text-xs disabled:opacity-50"
                      onClick={() => {
                        setLogoUrl('');
                        setLogoFile(null);
                        setMessage('Logo removed. Click “Save Settings” to apply.');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:rounded file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={uploadLogo}
                  disabled={!logoFile || uploading}
                  className="px-6 py-3 bg-black text-white tracking-wider uppercase text-sm disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Upload Logo'}
                </button>
              </div>
              <input
                value={logoUrl}
                readOnly
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Logo URL will appear here after upload"
              />
              <p className="text-xs text-gray-500">Upload a PNG/JPG from your device. Then click “Save Settings”.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Home Hero Background (Desktop)</label>
            <div className="space-y-3">
              {homeHeroDesktopUrl ? (
                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                  <img src={homeHeroDesktopUrl} alt="Home hero desktop background" className="w-full h-40 object-cover rounded" />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 border border-black text-black tracking-wider uppercase text-xs disabled:opacity-50"
                      onClick={() => {
                        setHomeHeroDesktopUrl('');
                        setHeroDesktopFile(null);
                        setMessage('Desktop hero image removed. Click “Save Settings” to apply.');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHeroDesktopFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:rounded file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={uploadHeroDesktop}
                  disabled={!heroDesktopFile || uploadingHeroDesktop}
                  className="px-6 py-3 bg-black text-white tracking-wider uppercase text-sm disabled:opacity-50"
                >
                  {uploadingHeroDesktop ? 'Uploading…' : 'Upload Desktop'}
                </button>
              </div>
              <input
                value={homeHeroDesktopUrl}
                readOnly
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Desktop hero URL will appear here after upload"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Home Hero Background (Mobile)</label>
            <div className="space-y-3">
              {homeHeroMobileUrl ? (
                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                  <img src={homeHeroMobileUrl} alt="Home hero mobile background" className="w-full h-40 object-cover rounded" />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 border border-black text-black tracking-wider uppercase text-xs disabled:opacity-50"
                      onClick={() => {
                        setHomeHeroMobileUrl('');
                        setHeroMobileFile(null);
                        setMessage('Mobile hero image removed. Click “Save Settings” to apply.');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHeroMobileFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:rounded file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={uploadHeroMobile}
                  disabled={!heroMobileFile || uploadingHeroMobile}
                  className="px-6 py-3 bg-black text-white tracking-wider uppercase text-sm disabled:opacity-50"
                >
                  {uploadingHeroMobile ? 'Uploading…' : 'Upload Mobile'}
                </button>
              </div>
              <input
                value={homeHeroMobileUrl}
                readOnly
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Mobile hero URL will appear here after upload"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Instagram URL</label>
              <input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="instagram.com/yourbrand"
              />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Facebook URL</label>
              <input
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="facebook.com/yourbrand"
              />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">X/Twitter URL</label>
              <input
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="x.com/yourbrand"
              />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">TikTok URL</label>
              <input
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="tiktok.com/@yourbrand"
              />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">YouTube URL</label>
              <input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="youtube.com/@yourbrand"
              />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">LinkedIn URL</label>
              <input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="linkedin.com/company/yourbrand"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Contact Email</label>
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="contact@yourbrand.com"
              />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Phone Number</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="+234..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="Your address"
            />
          </div>
          <div>
            <label className="block text-sm uppercase tracking-wider mb-2 text-gray-700">Copyright</label>
            <input
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
              className="w-full border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="© 2026 Your Brand. All rights reserved."
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-black text-white tracking-wider uppercase text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {message && <p className="text-sm mt-2 text-black">{message}</p>}
        </form>
      )}
    </div>
  );
}
