import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '@/components/Avatar';
import { Field } from '@/components/Field';
import { useState, type FormEvent } from 'react';
import { updateDisplayName } from '@/lib/account';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Notice } from '@/components/ui/Notice';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';
import { LinkedDevicesSection } from '@/components/settings/LinkedDevicesSection';
import { PrivacySecuritySection } from '@/components/settings/PrivacySecuritySection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { ChatPreferencesSection } from '@/components/settings/ChatPreferencesSection';
import { SettingsLinkRow } from '@/components/settings/SettingsLinkRow';
import { SettingsSection } from '@/components/settings/SettingsSection';

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

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
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
    // The header sits outside the scroller, so it never covers a focused control.
    <div className='flex h-dvh w-full flex-col bg-surface text-ink'>
      <header className='flex h-15 shrink-0 items-center gap-1 border-b border-line px-1'>
        <IconButton icon='back' label='Back to chats' onClick={() => navigate('/chat')} />
        <h1 className='text-title text-ink'>Settings</h1>
      </header>

      <main className='wc-scroll flex-1 overflow-y-auto'>
        <div className='mx-auto flex max-w-160 flex-col gap-6 px-4 py-6'>
          <SettingsSection id='profile-heading' title='Profile' description='Your name and account details'>
            <Avatar name={name} id={user?.uid ?? 'me'} size='xl' />

            <form className='flex flex-col gap-4' onSubmit={handleSaveProfile}>
              <Field
                id='name'
                label='Full name'
                type='text'
                autoComplete='name'
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setProfileError(null);
                }}
              />

              <Field
                id='email'
                label='Email'
                type='email'
                value={email}
                readOnly
                description="Email changes aren't supported yet."
              />

              {profileError && <Notice tone='danger'>{profileError}</Notice>}

              <Button type='submit' block isLoading={isSavingProfile} disabled={!canSaveProfile}>
                {isSavingProfile ? 'Saving…' : profileSaved ? 'Saved' : 'Save changes'}
              </Button>
              <p role='status' className='sr-only'>
                {profileSaved ? 'Your name is saved.' : ''}
              </p>
            </form>

            <SettingsLinkRow
              label='Change password'
              description='Update the password used to sign in'
              onClick={() => setShowPasswordModal(true)}
            />
          </SettingsSection>

          <AppearanceSection />
          <ChatPreferencesSection />
          <NotificationsSection />
          <PrivacySecuritySection />
          <LinkedDevicesSection />
          <DangerZoneSection />
        </div>
      </main>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
