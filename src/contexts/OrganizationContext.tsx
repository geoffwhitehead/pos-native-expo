import React from 'react';
import type { Organization } from '../models';

type OrganizationContextProps = {
  setOrganization: (organization: Organization) => void;
  organization: Organization;
};
export const OrganizationContext = React.createContext<OrganizationContextProps>({
  setOrganization: () => {},
  organization: null as any,
});
