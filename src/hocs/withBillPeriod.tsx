import React, { useContext } from 'react';
import { BillPeriodContext } from '../contexts/BillPeriodContext';

// TODO: remove this / refactor
export const withBillPeriod = <P extends object>(Component: React.ComponentType<P>) => {
  return function component(props: P) {
    const { billPeriod, setBillPeriod } = useContext(BillPeriodContext);
    return <Component {...props} billPeriod={billPeriod} setBillPeriod={setBillPeriod} />;
  };
};
