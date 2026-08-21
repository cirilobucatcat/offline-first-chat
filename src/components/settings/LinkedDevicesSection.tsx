import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { JoinDeviceModal } from '../JoinDeviceModal';
import {
  forgetDevice,
  getOrCreateLocalDeviceId,
  type DeviceRecord,
  watchDevices,
} from '@/lib/devices';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

function relativeLastSeen(ts: DeviceRecord['lastSeen']): string {
  if (!ts) return 'Active now';
  const ms = Date.now() - ts.toMillis();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'Active now';
  if (mins < 60) return `Active ${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.round(hours / 24);
  return `Active ${days}d ago`;
}

/**
 * Drop-in for the stubbed Privacy & Security section in Settings. I don't
 * have that host file, so this is self-contained rather than wired in
 * directly — send it over and I'll place it precisely.
 */
export function LinkedDevicesSection() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pendingForget, setPendingForget] = useState<DeviceRecord | null>(null);
  const thisDeviceId = getOrCreateLocalDeviceId();

  useEffect(() => {
    if (!user?.uid) return;
    return watchDevices(user.uid, setDevices);
  }, [user?.uid]);

  return (
    <section className='flex flex-col gap-4'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h3 className='text-base font-semibold text-ink'>Linked devices</h3>
          <p className='text-sm text-ink/60'>
            Devices signed into your account.
          </p>
        </div>
        <Button size='sm' onClick={() => setShowJoinModal(true)}>
          Link a new device
        </Button>
      </div>

      <ul className='flex flex-col divide-y divide-border rounded-xl border border-border'>
        {devices.map((device) => (
          <li
            key={device.deviceId}
            className='flex items-center justify-between gap-4 px-4 py-3'
          >
            <div className='flex items-center gap-3'>
              <Monitor className='h-5 w-5 text-primary' aria-hidden='true' />
              <div>
                <p className='text-sm font-medium text-ink'>
                  {device.label}
                  {device.deviceId === thisDeviceId && (
                    <span className='ml-2 text-xs font-normal text-ink/50'>
                      This device
                    </span>
                  )}
                </p>
                <p className='text-xs text-ink/50'>
                  {relativeLastSeen(device.lastSeen)}
                </p>
              </div>
            </div>
            <Button
              variant='dangerGhost'
              size='sm'
              onClick={() => setPendingForget(device)}
            >
              Forget
            </Button>
          </li>
        ))}
        {devices.length === 0 && (
          <li className='px-4 py-6 text-center text-sm text-ink/50'>
            No devices yet.
          </li>
        )}
      </ul>

      {showJoinModal && (
        <JoinDeviceModal onClose={() => setShowJoinModal(false)} />
      )}

      {pendingForget && (
        <Modal
          titleId='forget-device-title'
          title='Forget this device?'
          onClose={() => setPendingForget(null)}
        >
          <div className='flex flex-col gap-4 px-5 py-5'>
            {/* Honesty note (see forgetDevice() in lib/devices.ts): this is
                bookkeeping, not revocation. Path A gives every linked device
                a full copy of the identity key — this app can't yet cut one
                off without rotating that key for everyone. Say so plainly. */}
            <p className='text-sm text-ink'>
              This removes <strong>{pendingForget.label}</strong> from this
              list. It doesn't revoke its access — every linked device holds a
              working copy of your encryption key, and there's no way yet to cut
              one off without resetting the key for your whole account. Real
              device revocation is planned but not built yet.
            </p>
            <div className='flex justify-end gap-2'>
              <Button variant='ghost' onClick={() => setPendingForget(null)}>
                Cancel
              </Button>
              <Button
                variant='dangerSolid'
                onClick={async () => {
                  if (user?.uid)
                    await forgetDevice(user.uid, pendingForget.deviceId);
                  setPendingForget(null);
                }}
              >
                Remove from list
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
