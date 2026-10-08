import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '@/components/Avatar';
import { Field } from '@/components/Field';
import { useState } from 'react';
import { updateDisplayName } from '@/lib/account';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';
import { LinkedDevicesSection } from '@/components/settings/LinkedDevicesSection';
import { PrivacySecuritySection } from '@/components/settings/PrivacySecuritySection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { ChatPreferencesSection } from '@/components/settings/ChatPreferencesSection';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.displayName ?? 'Your name');
  const [savedName, setSavedName] = useState(user?.displayName ?? 'Your name');
  const [email] = useState(user?.email ?? 'you@example.com');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const trimmedName = name.trim();
  const canSaveProfile =
    trimmedName.length > 0 && trimmedName !== savedName && !isSavingProfile;

  async function handleSaveProfile() {
    if (!user || !canSaveProfile) return;
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    const result = await updateDisplayName(user, trimmedName);

    setIsSavingProfile(false);
    if (result.status === 'success') {
      setSavedName(trimmedName);
      setName(trimmedName);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } else {
      setProfileError("Couldn't save your name. Try again.");
    }
  }

  return (
    <div className='min-h-screen w-full bg-pale-blue dark:bg-legacy-ink' style={{ fontFamily: "'Outfit', sans-serif" }}>
      <header className='flex items-center gap-3 px-4 md:px-6 py-4 border-b border-hairline dark:border-hairline-dark sticky top-0 bg-white dark:bg-legacy-surface'>
        <button
          type='button'
          onClick={() => navigate('/chat')}
          aria-label='Back to chats'
          className='wc-icon-btn wc-focus rounded-full p-1.5 -ml-1.5'
        >
          <ChevronLeft size={22} aria-hidden='true' />
        </button>
        <h1 className='text-xl font-semibold text-legacy-ink dark:text-pale-blue'>
          Settings
        </h1>
      </header>

      <main className='mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col gap-6' style={{ maxWidth: 640 }}>
        <section
          className='rounded-2xl border border-hairline dark:border-hairline-dark p-5 md:p-6 space-y-8 bg-white dark:bg-legacy-surface'
          aria-labelledby='account-settings-heading'
        >
          <div>
            <div className='mb-4'>
              <h2 id='account-settings-heading' className='text-sm font-semibold uppercase text-primary dark:text-accent' style={{ letterSpacing: '0.04em' }}>
                Profile
              </h2>
              <p className='text-muted dark:text-mist text-sm'>Your name and account details</p>
            </div>

            <Avatar name={name} id={user?.uid ?? 'me'} size='xl' />
          </div>
          <div>
            <div className='flex flex-col gap-4'>
              <Field
                label='Full name'
                onChange={(e) => {
                  setName(e.target.value);
                  setProfileError(null);
                }}
                id='name'
                type='text'
                value={name}
              />

              <div>
                <label htmlFor='email' className='text-sm font-medium block mb-1.5 text-legacy-ink dark:text-pale-blue'>
                  Email
                </label>
                <div
                  id='email'
                  className='flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-sm border-[#D7E8F8] dark:border-hairline-dark bg-[#F7FBFF] dark:bg-legacy-ink text-muted dark:text-mist'
                >
                  <Mail size={16} aria-hidden='true' />
                  <span className='truncate'>{email}</span>
                </div>
                <p className='text-xs mt-1.5 text-muted dark:text-mist'>
                  Email changes aren't supported yet.
                </p>
              </div>

              <button
                type='button'
                onClick={() => setShowPasswordModal(true)}
                className='wc-item wc-focus flex items-center justify-between rounded-xl px-4 py-3 text-left border border-hairline dark:border-hairline-dark'
              >
                <span>
                  <span className='block text-sm font-medium text-legacy-ink dark:text-pale-blue'>
                    Change password
                  </span>
                  <span className='block text-xs mt-0.5 text-muted dark:text-mist'>
                    Update the password used to sign in
                  </span>
                </span>
                <ChevronRight size={18} aria-hidden='true' className='shrink-0 text-muted dark:text-mist' />
              </button>
            </div>

            {profileError && (
              <p role='alert' className='text-sm mt-3 text-error dark:text-error-dark'>
                {profileError}
              </p>
            )}

            <button
              type='button'
              onClick={handleSaveProfile}
              disabled={!canSaveProfile}
              aria-live='polite'
              className='wc-focus w-full rounded-full py-2.5 text-sm font-semibold mt-5 disabled:opacity-50 disabled:cursor-not-allowed bg-primary dark:bg-accent text-white dark:text-legacy-ink'
            >
              {isSavingProfile ? 'Saving…' : profileSaved ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </section>
        <AppearanceSection />
        <ChatPreferencesSection />
        <NotificationsSection />
        <PrivacySecuritySection />
        <LinkedDevicesSection />
        <DangerZoneSection />
      </main>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}