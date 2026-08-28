import { useEffect, useState } from 'react';
import { Loader2, Monitor } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
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

export function LinkedDevicesSection() {
  const { user } = useAuth();
  const networkStatus = useNetworkStatus();
  const isOffline = networkStatus === 'offline';

  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [devicesLoaded, setDevicesLoaded] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pendingForget, setPendingForget] = useState<DeviceRecord | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [thisDeviceId] = useState(() => getOrCreateLocalDeviceId());

  useEffect(() => {
    if (!user?.uid) return;
    setDevicesLoaded(false);
    return watchDevices(user.uid, (list) => {
      setDevices(list);
      setDevicesLoaded(true);
    });
  }, [user?.uid]);

  const sortedDevices = [...devices].sort((a, b) => {
    if (a.deviceId === thisDeviceId) return -1;
    if (b.deviceId === thisDeviceId) return 1;
    const aMs = a.lastSeen?.toMillis() ?? Infinity;
    const bMs = b.lastSeen?.toMillis() ?? Infinity;
    return bMs - aMs;
  });

  return (
    <section className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold text-ink dark:text-pale-blue'>Linked devices</h3>
          <p className='text-sm text-ink/60 dark:text-pale-blue/60'>
            Devices signed into your account.
          </p>
        </div>
        <Button
          size='sm'
          onClick={() => setShowJoinModal(true)}
          disabled={isOffline}
          title={isOffline ? 'Linking a device needs a connection' : undefined}
        >
          Link a new device
        </Button>
      </div>

      {isOffline && (
        <p className='text-xs text-ink/50 dark:text-pale-blue/50'>
          You're offline — linking a new device needs a live connection to pair.
        </p>
      )}

      <ul
        className='flex flex-col divide-y divide-border dark:divide-hairline-dark rounded-xl border border-border dark:border-hairline-dark'
        aria-busy={!devicesLoaded}
      >
        {!devicesLoaded && (
          <li className='flex items-center justify-center gap-2 px-4 py-6 text-sm text-ink/50 dark:text-pale-blue/50' role='status' aria-live='polite'>
            <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
            Loading devices…
          </li>
        )}

        {devicesLoaded && sortedDevices.length === 0 && (
          <li className='px-4 py-6 text-center text-sm text-ink/50 dark:text-pale-blue/50'>
            No devices yet.
          </li>
        )}

        {devicesLoaded &&
          sortedDevices.map((device) => (
            <li key={device.deviceId} className='flex items-center justify-between gap-4 px-4 py-3'>
              <div className='flex min-w-0 items-center gap-3'>
                <Monitor className='h-5 w-5 shrink-0 text-primary dark:text-accent' aria-hidden='true' />
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-ink dark:text-pale-blue'>
                    {device.label}
                    {device.deviceId === thisDeviceId && (
                      <span className='ml-2 text-xs font-normal text-ink/50 dark:text-pale-blue/50'>
                        This device
                      </span>
                    )}
                  </p>
                  <p className='text-xs text-ink/50 dark:text-pale-blue/50'>
                    {relativeLastSeen(device.lastSeen)}
                  </p>
                </div>
              </div>

              {device.deviceId === thisDeviceId ? (
                <span className='shrink-0 text-xs text-ink/40 dark:text-pale-blue/40'>In use</span>
              ) : (
                <Button
                  variant='dangerGhost'
                  size='sm'
                  onClick={() => {
                    setPendingForget(device);
                    setRemoveError(null);
                  }}
                >
                  Forget
                </Button>
              )}
            </li>
          ))}
      </ul>

      {showJoinModal && <JoinDeviceModal onClose={() => setShowJoinModal(false)} />}

      {pendingForget && (
        <Modal
          titleId='forget-device-title'
          title='Forget this device?'
          onClose={() => {
            if (isRemoving) return;
            setPendingForget(null);
            setRemoveError(null);
          }}
        >
          <div className='flex flex-col gap-4 px-5 py-5'>
            <p className='text-sm text-ink dark:text-pale-blue'>
              This removes <strong>{pendingForget.label}</strong> from this
              list. It doesn't revoke its access — every linked device holds a
              working copy of your encryption key, and there's no way yet to cut
              one off without resetting the key for your whole account. Real
              device revocation is planned but not built yet.
            </p>

            {removeError && (
              <p className='text-sm text-danger dark:text-danger-dark' role='alert'>
                {removeError}
              </p>
            )}

            <div className='flex justify-end gap-2'>
              <Button
                variant='ghost'
                onClick={() => {
                  setPendingForget(null);
                  setRemoveError(null);
                }}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                variant='dangerSolid'
                isLoading={isRemoving}
                onClick={async () => {
                  if (!user?.uid) return;
                  setIsRemoving(true);
                  setRemoveError(null);
                  try {
                    await forgetDevice(user.uid, pendingForget.deviceId);
                    setPendingForget(null);
                  } catch {
                    setRemoveError("Couldn't remove that device. Check your connection and try again.");
                  } finally {
                    setIsRemoving(false);
                  }
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