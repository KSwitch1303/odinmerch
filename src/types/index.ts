// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  created_at: Date;
  updated_at: Date;
}

// Product Types
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  category: string;
  images: string[];
  sizes: string[];
  inventory: number;
  is_active: boolean;
  created_at: Date;
}

// Cart Types
export interface Cart {
  _id: string;
  user_id: string;
  items: CartItem[];
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  _id: string;
  product_id: string;
  quantity: number;
  size: string;
  product?: Product;
}

// Order Types
export interface Order {
  _id: string;
  user_id: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: Address;
  total_amount: number;
  payment_method: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  _id: string;
  product_id: string;
  quantity: number;
  price: number;
  size: string;
  product?: Product;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  session: unknown; // Supabase session
}
