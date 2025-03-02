import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import type { Dictionary} from 'lodash';
import { groupBy } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { SwitchSelector } from '../../../components/SwitchSelector/SwitchSelector';
import { OrganizationContext } from '../../../contexts/OrganizationContext';
import { Divider, HStack, Text, VStack } from '../../../core';
import type { Bill, PaymentType } from '../../../models';
import { TransactionGroupingEnum, TransactionOrderEnum } from '../../../models/Organization';
import { TransactionListRow } from './TransactionListRow';
import { tableNames } from '../../../models/tableNames';
interface TransactionListInnerProps {
  paymentTypes: PaymentType[];
}

interface TransactionListOuterProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  selectedBill?: Bill;
  database: Database;
}

export const TransactionListInner: React.FC<TransactionListOuterProps & TransactionListInnerProps> = ({
  bills,
  onSelectBill,
  selectedBill,
  paymentTypes,
}) => {
  const { organization } = useContext(OrganizationContext);
  const [sortedBillsGrouped, setSortedBillsGrouped] = useState<Dictionary<Bill[]>>({});
  const [sortedBills, setSortedBills] = useState<Bill[]>([]);
  const [transactionGrouping, setTransactionGrouping] = useState(organization.transactionGrouping);
  const [transactionOrder, setTransactionOrder] = useState(organization.transactionOrder);

  const sorterClosedAtDescending = (b1: Bill, b2: Bill) => b2.closedAt - b1.closedAt;
  const sorterClosedAtAscending = (b1: Bill, b2: Bill) => b1.closedAt - b2.closedAt;

  const sorter =
    transactionOrder === TransactionOrderEnum.descending ? sorterClosedAtDescending : sorterClosedAtAscending;

  useEffect(() => {
    const sortedBills = bills.sort(sorter);
    setSortedBills(sortedBills);
  }, [bills, transactionOrder, transactionGrouping, setSortedBills]);

  useEffect(() => {
    const sortedBillsGrouped = groupBy(sortedBills, bill => bill.reference);
    setSortedBillsGrouped(sortedBillsGrouped);
  }, [sortedBills, setSortedBillsGrouped, transactionOrder, transactionGrouping]);

  const hasNoTransactions = bills.length === 0;
  const isGrouped = transactionGrouping === TransactionGroupingEnum.grouped;

  return (
    <VStack>
      <HStack style={{}}>
        <SwitchSelector
          options={[
            { label: 'Descending', value: TransactionOrderEnum.descending },
            { label: 'Ascending', value: TransactionOrderEnum.ascending },
          ]}
          initial={organization.transactionOrder}
          onPress={value => setTransactionOrder(value)}
          style={{ paddingRight: 10, width: 300 }}
        />
        <SwitchSelector
          options={[
            { label: 'Ungrouped', value: TransactionGroupingEnum.ungrouped },
            { label: 'Grouped', value: TransactionGroupingEnum.grouped },
          ]}
          initial={organization.transactionGrouping}
          onPress={value => setTransactionGrouping(value)}
          style={{ paddingRight: 10, width: 300 }}
        />
      </HStack>

      {hasNoTransactions ? (
        <Text style={{ padding: 15 }}>There aren't any completed transactions ...</Text>
      ) : isGrouped ? (
        <ScrollView>
          {Object.entries(sortedBillsGrouped).map(([billReference, sortedBillsByReference = []]) => {
            return (
              <VStack key={`${billReference}-seperator`} itemDivider>
                <Text style={{ fontWeight: 'bold', fontSize: 20 }}>{`Bill: ${billReference}`}</Text>
                <Divider/>
                {sortedBillsByReference.map(bill => {
                  const isSelected = selectedBill && bill.id === selectedBill.id;
                  return (
                    <TransactionListRow
                    key={bill.id}
                    paymentTypes={paymentTypes}
                    bill={bill}
                    isSelected={isSelected}
                    onSelectBill={onSelectBill}
                    showBillRef={false}
                    />
                  );
                })}
              </VStack>
            )
            
          })}
        </ScrollView>
      ) : (
        <ScrollView>
          {sortedBills.map(bill => {
            const isSelected = selectedBill && bill.id === selectedBill.id;
            return (
              <TransactionListRow
                key={bill.id}
                paymentTypes={paymentTypes}
                bill={bill}
                isSelected={isSelected}
                onSelectBill={onSelectBill}
              />
            );
          })}
        </ScrollView>
      )}
    </VStack>
  );
};

const enhance = c =>
  withDatabase(
    withObservables<TransactionListOuterProps, TransactionListInnerProps>([], ({ database }) => ({
      paymentTypes: database.collections.get<PaymentType>(tableNames.paymentTypes).query(),
    }))(c),
  );

export const TransactionList = enhance(TransactionListInner);
