import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Camera, Lock, User, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../lib/users';
import { Avatar } from '@/components/Avatar';
import { COLOR } from '@/lib/constants';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const name = user?.displayName ?? 'Your name';
  const email = user?.email ?? 'you@example.com';
  const initials = getInitials(name);

  return (
    <div className="min-h-screen w-full" style={{ fontFamily: "'Outfit', sans-serif", backgroundColor: COLOR.paleBlue }}>
      <header
        className="flex items-center gap-3 px-4 md:px-6 py-4 border-b sticky top-0"
        style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}
      >
        <button
          type="button"
          onClick={() => navigate('/chat')}
          aria-label="Back to chats"
          className="wc-icon-btn wc-focus rounded-full p-1.5 -ml-1.5"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <h1 className="text-xl font-semibold" style={{ color: COLOR.ink }}>Settings</h1>
      </header>

      <main className="mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col gap-6" style={{ maxWidth: 640 }}>
        {/* Profile Picture */}
        <section
          className="rounded-2xl border p-5 md:p-6"
          style={{ backgroundColor: COLOR.white, borderColor: COLOR.hairline }}
          aria-labelledby="profile-picture-heading"
        >
          <h2
            id="profile-picture-heading"
            className="text-sm font-semibold uppercase mb-4"
            style={{ color: COLOR.muted, letterSpacing: '0.04em' }}
          >
            Profile Picture
          </h2>

          <div className="flex flex-wrap items-center gap-5">
            <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
              <Avatar initials={initials} uid={user?.uid ?? 'me'} size={96} />
              <button
                type="button"
                aria-label="Change profile picture"
                className="wc-focus absolute flex items-center justify-center rounded-full"
                style={{
                  right: -2,
                  bottom: -2,
                  width: 32,
                  height: 32,
                  backgroundColor: COLOR.primary,
                  color: COLOR.white,
                  border: `2px solid ${COLOR.white}`,
                }}
              >
                <Camera size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="wc-focus rounded-full px-4 py-2 text-sm font-semibold"
                  style={{ backgroundColor: COLOR.primary, color: COLOR.white }}
                >
                  Upload new picture
                </button>
                <button
                  type="button"
                  className="wc-focus rounded-full px-4 py-2 text-sm font-medium"
                  style={{ color: COLOR.muted, border: `1px solid ${COLOR.hairline}` }}
                >
                  Remove
                </button>
              </div>
              <p className="text-xs" style={{ color: COLOR.muted }}>
                JPG or PNG, at least 200×200px
              </p>
            </div>
          </div>
        </section>

        {/* Account Settings */}
        <section
          className="rounded-2xl border p-5 md:p-6"
          style={{ backgroundColor: COLOR.white, borderColor: COLOR.hairline }}
          aria-labelledby="account-settings-heading"
        >
          <h2
            id="account-settings-heading"
            className="text-sm font-semibold uppercase mb-4"
            style={{ color: COLOR.muted, letterSpacing: '0.04em' }}
          >
            Account Settings
          </h2>

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="settings-name" className="text-sm font-medium block mb-1.5" style={{ color: COLOR.ink }}>
                Full name
              </label>
              <div className="relative">
                <User size={17} aria-hidden="true" className="absolute top-1/2 -translate-y-1/2" style={{ left: 14, color: COLOR.muted }} />
                <input
                  id="settings-name"
                  type="text"
                  defaultValue={name}
                  className="wc-focus w-full rounded-full py-2.5 text-sm"
                  style={{ backgroundColor: COLOR.paleBlue, color: COLOR.ink, paddingLeft: 40, paddingRight: 16 }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="settings-email" className="text-sm font-medium block mb-1.5" style={{ color: COLOR.ink }}>
                Email
              </label>
              <div className="relative">
                <Mail size={17} aria-hidden="true" className="absolute top-1/2 -translate-y-1/2" style={{ left: 14, color: COLOR.muted }} />
                <input
                  id="settings-email"
                  type="email"
                  defaultValue={email}
                  disabled
                  className="w-full rounded-full py-2.5 text-sm"
                  style={{ backgroundColor: COLOR.white, color: COLOR.muted, paddingLeft: 40, paddingRight: 16, border: `1px solid ${COLOR.hairline}` }}
                />
              </div>
              <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: COLOR.muted }}>
                <Lock size={11} aria-hidden="true" /> Contact support to change your email
              </p>
            </div>

            <button
              type="button"
              className="wc-item wc-focus flex items-center justify-between rounded-xl px-4 py-3 text-left"
              style={{ border: `1px solid ${COLOR.hairline}` }}
            >
              <span>
                <span className="block text-sm font-medium" style={{ color: COLOR.ink }}>Change password</span>
                <span className="block text-xs mt-0.5" style={{ color: COLOR.muted }}>Update the password used to sign in</span>
              </span>
              <ChevronRight size={18} aria-hidden="true" style={{ color: COLOR.muted, flexShrink: 0 }} />
            </button>
          </div>

          <button
            type="button"
            className="wc-focus w-full rounded-full py-2.5 text-sm font-semibold mt-5"
            style={{ backgroundColor: COLOR.primary, color: COLOR.white }}
          >
            Save changes
          </button>
        </section>
      </main>
    </div>
  );
}