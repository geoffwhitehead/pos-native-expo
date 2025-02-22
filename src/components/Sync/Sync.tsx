import type { Database } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import React, { useEffect, useState } from 'react';
import { useSync } from '../../hooks/useSync';
import type { Organization } from '../../models';
import { Loading } from '../Loading/Loading';
import { tableNames } from '../../models/tableNames';

type SyncOuterProps = {
  database: Database;
  organizationId: string;
  children: React.ReactNode;
};

type SyncInnerProps = {
  organizations: Organization[];
};

export const SyncInner: React.FC<SyncOuterProps & SyncInnerProps> = ({
  database,
  children,
  organizationId,
  organizations = [],
}) => {
  const [isSyncDone, setIsSyncDone] = useState(false);
  const [_, doSync] = useSync();

  useEffect(() => {
    const checkSync = async () => {
      await doSync();
      // dont prevent loading if sync fails
      setIsSyncDone(true);
    };
    checkSync();
  }, [database]);

  const hasOrganization = organizations.some(o => o.id === organizationId);

  if (!isSyncDone || !hasOrganization) {
    return <Loading />;
  }
  return children;
};

export const Sync = withObservables<SyncOuterProps, SyncInnerProps>([], ({ database }) => ({
  organizations: database.collections.get<Organization>(tableNames.organizations).query(),
}))(SyncInner);
