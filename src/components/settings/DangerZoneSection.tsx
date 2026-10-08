import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DeleteAccountModal } from './DeleteAccountModal';
import { SettingsSection } from './SettingsSection';

export function DangerZoneSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <SettingsSection
        id="delete-account-heading"
        title="Delete account"
        description="Close your account and delete your profile and encryption key. Chats stay with the people you talked to. This can't be undone."
        tone="danger"
      >
        {/* Secondary, lifted off the red ground: this only opens the confirmation, which holds the one danger button. */}
        <Button
          variant="secondary"
          className="self-start bg-surface-raised text-danger hover:bg-surface"
          aria-haspopup="dialog"
          onClick={() => setModalOpen(true)}
        >
          Delete account
        </Button>
      </SettingsSection>
      {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
