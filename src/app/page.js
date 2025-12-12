// src/app/page.js
import { redirect } from 'next/navigation';

// रूट URL ('/') को सीधे लॉगिन पेज पर रीडायरेक्ट करें
export default function Home() {
  redirect('/login');
}