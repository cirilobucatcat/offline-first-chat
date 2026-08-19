import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Camera, Lock, User, Mail, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../lib/users';
import { Avatar } from '@/components/Avatar';
import { COLOR } from '@/lib/constants';
import { Field } from '@/components/Field';
import { useState } from 'react';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.displayName ?? 'Your name');
  const [email, setEmail] = useState(user?.email ?? 'you@example.com');
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
        <section
          className="rounded-2xl border p-5 md:p-6 space-y-8"
          style={{ backgroundColor: COLOR.white, borderColor: COLOR.hairline }}
          aria-labelledby="profile-picture-heading"
        >
          <div>
            <div className='mb-4'>
              <h2
                id="account-settings-heading"
                className="text-sm font-semibold uppercase text-primary"
                style={{ letterSpacing: '0.04em' }}
              >
                Profile
              </h2>
              <p className='text-muted text-sm'>Your name and account details</p>
            </div>

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
          </div>
          <div>
            <div className="flex flex-col gap-4">
              <Field
                icon={User}
                label='Full name'
                onChange={() => setName('Settt')}
                id="name"
                type="text"
                value={name}
              />

              <Field
                icon={Mail}
                label='Email'
                onChange={() => setName('Settt')}
                id="email"
                type="email"
                value={email}
              />

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
          </div>
        </section>
        <DangerZoneSection />
      </main>
    </div>
  );
}