import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DeleteAccountModal } from './DeleteAccountModal';
import { SettingsSection } from './SettingsSection';

export function DangerZoneSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <SettingsSection
        id="danger-zone-heading"
        title="Danger zone"
        description="These actions are permanent. Make sure before you continue."
        tone="danger"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-legacy-ink dark:text-pale-blue">
              Delete account
            </p>
            <p className="mt-0.5 text-sm text-legacy-ink-muted dark:text-mist">
              Close your account and delete your profile and encryption key. Chats stay with
              the people you talked to. This can&apos;t be undone.
            </p>
          </div>
          <Button variant="danger" size="sm" icon="trash" onClick={() => setModalOpen(true)}>
            Delete
          </Button>
        </div>
      </SettingsSection>
      {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} />}
    </>
  );
}