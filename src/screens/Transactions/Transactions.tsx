import withObservables from '@nozbe/with-observables';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import React, { useState } from 'react';
import { SidebarHeader } from '../../components/SidebarHeader/SidebarHeader';
import { Container, Content, View, VStack } from '../../core';
import { withBillPeriod } from '../../hocs/withBillPeriod';
import type { Bill, BillPeriod } from '../../models';
import type { SidebarDrawerStackParamList } from '../../navigators/SidebarNavigator';
import { Receipt } from '../Checkout/sub-components/Receipt/Receipt';
import { TransactionList } from './sub-components/TransactionList';
import { Box } from '@shopify/react-native-skia';

interface TransactionsOuterProps {
  navigation: DrawerNavigationProp<SidebarDrawerStackParamList, 'Transactions'>;
  billPeriod: BillPeriod;
}

interface TransactionsInnerProps {
  closedBills: Bill[];
}

const TransactionsInner: React.FC<TransactionsOuterProps & TransactionsInnerProps> = ({
  navigation,
  closedBills,
}) => {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const handleOnOpen = () => {
    // perf: keeping this open will cause it to keep recalculating as changes are made
    setSelectedBill(null);
    navigation.openDrawer();
  };

  return (
    <Container>
      <SidebarHeader title="Transactions" onOpen={handleOnOpen} />
      <VStack>
        <Content>
          <TransactionList bills={closedBills} selectedBill={selectedBill} onSelectBill={setSelectedBill} />
        </Content>
        {selectedBill && (
        <View width={350}>
          <Receipt bill={selectedBill} isComplete={true} />
        </View>
        )}
      </VStack>
    </Container>
  );
};

const EnhancedTransactions = withBillPeriod(
  withObservables<TransactionsOuterProps, TransactionsInnerProps>(['billPeriod'], ({ billPeriod }) => ({
    billPeriod,
    closedBills: billPeriod.closedBills,
  }))(TransactionsInner)
);

// Create a stable component reference
export const Transactions = React.memo(EnhancedTransactions);
