import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import React from 'react';

export const metadata = {
  title: 'Task Tracker - Intelligent Operational Management',
  description: 'Lightweight intelligent project and task management system for internal team operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
