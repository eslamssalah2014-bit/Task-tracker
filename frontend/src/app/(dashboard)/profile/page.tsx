'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { User, Bell, Mail, Shield, Globe, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, role } = useAuth();

  const [inAppNotif, setInAppNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [notifyAssigned, setNotifyAssigned] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifyApprovals, setNotifyApprovals] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">User Profile & Preferences</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal account credentials, assigned track roles, and notification dispatch rules.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100 text-center sm:text-left">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user?.full_name}
            className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-md"
          />
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {user?.role_name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {user?.job_title} • {user?.department}
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              readOnly
              value={user?.full_name || ''}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              readOnly
              value={user?.phone || '+20 100 123 4567'}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Timezone</label>
            <input
              type="text"
              readOnly
              value={user?.timezone || 'Africa/Cairo'}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences (Section 93) */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Notification Dispatch Preferences</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose what events trigger in-app notification badge counts and email notifications
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <div className="font-semibold text-slate-900">Task Assigned to You</div>
              <div className="text-[11px] text-slate-400">Receive alert when a manager adds you to a deliverable</div>
            </div>
            <input
              type="checkbox"
              checked={notifyAssigned}
              onChange={(e) => setNotifyAssigned(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <div className="font-semibold text-slate-900">Task Overdue Reminders</div>
              <div className="text-[11px] text-slate-400">Receive alert when task target deadline passes without completion</div>
            </div>
            <input
              type="checkbox"
              checked={notifyOverdue}
              onChange={(e) => setNotifyOverdue(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <div className="font-semibold text-slate-900">Comment Mentions (@you)</div>
              <div className="text-[11px] text-slate-400">Receive alert when tagged in task comments or discussion threads</div>
            </div>
            <input
              type="checkbox"
              checked={notifyMentions}
              onChange={(e) => setNotifyMentions(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <div className="font-semibold text-slate-900">Review & Approval Decisions</div>
              <div className="text-[11px] text-slate-400">Receive alert when deliverables are approved or revisions are requested</div>
            </div>
            <input
              type="checkbox"
              checked={notifyApprovals}
              onChange={(e) => setNotifyApprovals(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {isSaved ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Preferences saved!
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
