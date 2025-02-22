import React from 'react';
import type { Bill } from '../models/Bill';

type CurrentBillContextProps = {
  setCurrentBill: (bill: Bill) => void;
  currentBill: Bill;
};
export const CurrentBillContext = React.createContext<CurrentBillContextProps>({
  setCurrentBill: () => {},
  currentBill: null as any,
});
