import { useState } from 'react';
import { TriangleAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DeleteAccountModal } from './DeleteAccountModal';
import { SettingsSection } from './SettingsSection';
import { COLOR } from '@/lib/constants';

export function DangerZoneSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <SettingsSection
        icon={TriangleAlert}
        title="Danger zone"
        description="These actions are permanent. Make sure before you continue."
        tone="danger"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: COLOR.ink }}>
              Delete account
            </p>
            <p className="mt-0.5 text-sm" style={{ color: COLOR.inkMuted }}>
              Erase your profile, conversations, and message history. This can&apos;t be undone.
            </p>
          </div>
          <Button
            variant="dangerSolid"
            size="sm"
            icon={Trash2}
            className="shrink-0"
            onClick={() => setModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      </SettingsSection>
      {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} />}
    </>
  );
}