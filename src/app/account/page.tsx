'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { User, Package, Clock, CreditCard, MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Order {
  _id: string;
  total_amount: number;
  status: string;
  created_at: string | Date;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    size: string;
    product?: {
      _id: string;
      name: string;
      price: number;
      images: string[];
    };
  }>;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [addressForm, setAddressForm] = useState({ address: '', city: '', state: '', zipCode: '' });
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchOrders();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.access_token) {
        router.replace('/login?next=' + encodeURIComponent('/account'));
        return;
      }

      const fullName = String(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '').trim();
      const [firstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
      const lastName = rest.join(' ');

      setUser({
        id: session.user.id,
        email: String(session.user.email || ''),
        firstName: firstName || 'Customer',
        lastName: lastName || '',
        address: String(session.user.user_metadata?.address || ''),
        city: String(session.user.user_metadata?.city || ''),
        state: String(session.user.user_metadata?.state || ''),
        zipCode: String(session.user.user_metadata?.zipCode || ''),
        phone: String(session.user.user_metadata?.phone || ''),
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.success && Array.isArray(json?.data)) {
        setOrders(json.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.replace('/login');
    } catch (e) {
      setLoggingOut(false);
    }
  };

  const startEditProfile = () => {
    setProfileError('');
    setEditingAddress(false);
    setAddressError('');
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    });
    setEditingProfile(true);
  };

  const startEditAddress = () => {
    setAddressError('');
    setEditingProfile(false);
    setProfileError('');
    setAddressForm({
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
    });
    setEditingAddress(true);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError('');
    try {
      const firstName = profileForm.firstName.trim();
      const lastName = profileForm.lastName.trim();
      const fullName = `${firstName} ${lastName}`.trim();
      if (!firstName) {
        setProfileError('First name is required.');
        setSavingProfile(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: profileForm.phone.trim(),
        },
      });
      if (error) {
        setProfileError(error.message || 'Failed to update profile.');
        setSavingProfile(false);
        return;
      }
      setUser((prev) =>
        prev
          ? {
              ...prev,
              firstName,
              lastName,
              phone: profileForm.phone.trim(),
            }
          : prev
      );
      setEditingProfile(false);
    } catch (e) {
      setProfileError('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveAddress = async () => {
    setSavingAddress(true);
    setAddressError('');
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          address: addressForm.address.trim(),
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          zipCode: addressForm.zipCode.trim(),
        },
      });
      if (error) {
        setAddressError(error.message || 'Failed to update address.');
        setSavingAddress(false);
        return;
      }
      setUser((prev) =>
        prev
          ? {
              ...prev,
              address: addressForm.address.trim(),
              city: addressForm.city.trim(),
              state: addressForm.state.trim(),
              zipCode: addressForm.zipCode.trim(),
            }
          : prev
      );
      setEditingAddress(false);
    } catch (e) {
      setAddressError('Failed to update address.');
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-black mb-4">Please sign in</h1>
            <p className="text-gray-600 mb-8">
              You need to be signed in to view your account.
            </p>
            <Link href="/login" className="luxury-button">
              Sign In
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">My Account</h1>
          <p className="text-gray-600">Welcome back, {user.firstName}!</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-gold text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-gold text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Order History
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-black mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-gold" />
                  Personal Information
                </h2>

                {editingProfile ? (
                  <div className="space-y-4">
                    {profileError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{profileError}</p>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:ring-2 focus:ring-gold focus:border-transparent"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:ring-2 focus:ring-gold focus:border-transparent"
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:ring-2 focus:ring-gold focus:border-transparent"
                        placeholder="Phone"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={saveProfile}
                        disabled={savingProfile}
                        className="luxury-button disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingProfile ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        className="luxury-button-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-black">{user.firstName} {user.lastName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-black">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-black">{user.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startEditProfile}
                      className="mt-4 text-black hover:text-gray-700 text-sm font-medium"
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-black mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gold" />
                  Default Shipping Address
                </h2>

                {editingAddress ? (
                  <div className="space-y-4">
                    {addressError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{addressError}</p>
                      </div>
                    ) : null}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        value={addressForm.address}
                        onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:ring-2 focus:ring-gold focus:border-transparent"
                        placeholder="Street address"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:ring-2 focus:ring-gold focus:border-transparent"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <input
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:ring-2 focus:ring-gold focus:border-transparent"
                          placeholder="State"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                      <input
                        value={addressForm.zipCode}
                        onChange={(e) => setAddressForm((p) => ({ ...p, zipCode: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:ring-2 focus:ring-gold focus:border-transparent"
                        placeholder="ZIP"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={saveAddress}
                        disabled={savingAddress}
                        className="luxury-button disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingAddress ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAddress(false)}
                        className="luxury-button-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-2">
                      <p className="text-black">{user.address || 'Not provided'}</p>
                      <p className="text-black">
                        {user.city && user.state ? `${user.city}, ${user.state} ${user.zipCode}` : 'Not provided'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startEditAddress}
                      className="mt-4 text-black hover:text-gray-700 text-sm font-medium"
                    >
                      Edit Address
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full luxury-button-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-6">Start shopping to see your orders here.</p>
                <Link href="/products" className="luxury-button">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order._id} className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-black">Order #{order._id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">{formatDate(String(order.created_at))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-black">{formatPrice(order.total_amount)}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {(item.product?.name || 'Item')} (Size: {item.size}) × {item.quantity}
                            </span>
                            <span className="text-black">{formatPrice(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
