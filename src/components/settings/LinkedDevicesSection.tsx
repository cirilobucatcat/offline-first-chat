import { useEffect, useState } from 'react';
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
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Notice } from '../ui/Notice';
import { SettingsSection } from './SettingsSection';

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

  // Kept with the account it was loaded for; a list for another account counts as not loaded.
  const [deviceList, setDeviceList] = useState<{ uid: string; devices: DeviceRecord[] } | null>(null);
  const devicesLoaded = deviceList !== null && deviceList.uid === user?.uid;
  const devices = devicesLoaded ? deviceList.devices : [];
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pendingForget, setPendingForget] = useState<DeviceRecord | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [thisDeviceId] = useState(() => getOrCreateLocalDeviceId());

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    return watchDevices(uid, (list) => setDeviceList({ uid, devices: list }));
  }, [user?.uid]);

  const sortedDevices = [...devices].sort((a, b) => {
    if (a.deviceId === thisDeviceId) return -1;
    if (b.deviceId === thisDeviceId) return 1;
    const aMs = a.lastSeen?.toMillis() ?? Infinity;
    const bMs = b.lastSeen?.toMillis() ?? Infinity;
    return bMs - aMs;
  });

  function closeForget() {
    if (isRemoving) return;
    setPendingForget(null);
    setRemoveError(null);
  }

  async function handleForget() {
    if (!user?.uid || !pendingForget) return;
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
  }

  return (
    <SettingsSection id='linked-devices-heading' title='Linked devices' description='Devices signed into your account'>
      <ul aria-busy={!devicesLoaded} className='flex flex-col divide-y divide-line'>
        {!devicesLoaded && (
          <li role='status' className='flex items-center gap-2 py-3 text-subhead text-ink-muted'>
            <Icon name='sync' size={20} spin />
            Loading devices…
          </li>
        )}

        {devicesLoaded && sortedDevices.length === 0 && (
          <li className='py-3 text-subhead text-ink-muted'>No devices yet</li>
        )}

        {devicesLoaded &&
          sortedDevices.map((device) => {
            const isThisDevice = device.deviceId === thisDeviceId;
            return (
              <li key={device.deviceId} className='flex min-h-hit items-center gap-3 py-2'>
                <Icon name='monitor' className='text-ink-muted' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-row-title text-ink'>{device.label}</p>
                  <p className='mt-0.5 text-footnote text-ink-muted'>
                    {isThisDevice ? 'This device' : relativeLastSeen(device.lastSeen)}
                  </p>
                </div>

                {!isThisDevice && (
                  <Button
                    variant='secondary'
                    size='sm'
                    aria-label={`Forget ${device.label}`}
                    aria-haspopup='dialog'
                    onClick={() => {
                      setPendingForget(device);
                      setRemoveError(null);
                    }}
                  >
                    Forget
                  </Button>
                )}
              </li>
            );
          })}
      </ul>

      {/* Never disabled for being offline: the sheet says what linking needs. */}
      <Button variant='secondary' className='self-start' aria-haspopup='dialog' onClick={() => setShowJoinModal(true)}>
        Link a new device
      </Button>

      {isOffline && (
        <p className='text-footnote text-ink-muted'>
          You're offline. Linking a new device needs a connection.
        </p>
      )}

      {showJoinModal && <JoinDeviceModal onClose={() => setShowJoinModal(false)} />}

      {pendingForget && (
        <Modal
          titleId='forget-device-title'
          title='Forget this device?'
          onClose={closeForget}
          footer={
            <div className='flex justify-end gap-2'>
              <Button variant='ghost' onClick={closeForget} disabled={isRemoving}>
                Cancel
              </Button>
              {/* Secondary, not danger: this edits a list and revokes nothing. */}
              <Button variant='secondary' isLoading={isRemoving} onClick={handleForget}>
                Remove from list
              </Button>
            </div>
          }
        >
          <div className='flex flex-col gap-4 px-5 py-5'>
            <p className='text-subhead text-ink-muted'>
              This removes <strong className='font-semibold text-ink'>{pendingForget.label}</strong> from this
              list. It doesn't revoke its access — every linked device holds a
              working copy of your encryption key, and there's no way yet to cut
              one off without resetting the key for your whole account. Real
              device revocation is planned but not built yet.
            </p>

            {removeError && <Notice tone='danger'>{removeError}</Notice>}
          </div>
        </Modal>
      )}
    </SettingsSection>
  );
}
