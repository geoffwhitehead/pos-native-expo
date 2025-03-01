import { useDatabase } from '@nozbe/watermelondb/hooks';
import dayjs from 'dayjs';
import { useContext, useState } from 'react';
import { LastSyncedAtContext } from '../contexts/LastSyncedAtContext';
import { useToast } from '../core';
import { sync } from '../services/sync';

export const useSync = () => {
  const { setLastSyncedAt } = useContext(LastSyncedAtContext);
  const database = useDatabase();
  const toast = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const doSync = async () => {
    try {
      setIsSyncing(true);
      await sync(database);
      setLastSyncedAt(dayjs());
      setIsSyncing(false);
    } catch (err) {
      toast.show({
        title: `Sync Failed. Error ${err}`,
        duration: 5000,
        placement: 'bottom',
        variant: 'solid',
      });
      setIsSyncing(false);

      return { success: false };
    }
    return { success: true };
  };

  return [isSyncing, doSync] as const;
};
