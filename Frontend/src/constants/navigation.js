import {
  LayoutDashboard,
  Mic,
  ReceiptText,
  Users,
  Package,
  BarChart,
  BotMessageSquare,
  Settings,
} from 'lucide-react';

export const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Voice Billing', href: '/billing', icon: Mic },
  { name: 'Bills', href: '/bills', icon: ReceiptText },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Analytics', href: '/analytics', icon: BarChart },
  { name: 'AI Advisor', href: '/advisor', icon: BotMessageSquare },
  { name: 'Profile', href: '/profile', icon: Settings },
];

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
];

export const SHOP_TYPES = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'other', label: 'Other' },
];
