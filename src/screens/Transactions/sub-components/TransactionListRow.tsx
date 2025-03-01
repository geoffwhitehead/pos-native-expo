import { useDatabase } from '@nozbe/watermelondb/hooks';
import withObservables from '@nozbe/with-observables';
import dayjs from 'dayjs';
import { capitalize, keyBy } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { HStack, VStack, ListItem, Spinner, Text } from '../../../core';
import { OrganizationContext } from '../../../contexts/OrganizationContext';
import type { Bill, BillDiscount, BillItem, BillPayment, PaymentType } from '../../../models';
import type { TransactionSummary } from '../../../utils';
import { formatNumber, transactionSummary } from '../../../utils';

interface TransactionListRowOuterProps {
  bill: Bill;
  onSelectBill: (bill: Bill) => void;
  isSelected: boolean;
  showBillRef?: boolean;
  paymentTypes: PaymentType[];
}

interface TransactionListRowInnerProps {
  chargableBillItems: BillItem[];
  billDiscounts: BillDiscount[];
  billPayments: BillPayment[];
}

const TransactionListRowInner: React.FC<TransactionListRowOuterProps & TransactionListRowInnerProps> = ({
  isSelected,
  onSelectBill,
  bill,
  chargableBillItems,
  billDiscounts,
  billPayments,
  paymentTypes,
  showBillRef = true,
  ...props
}) => {
  const {
    organization: { currency },
  } = useContext(OrganizationContext);

  const [summary, setSummary] = useState<TransactionSummary>();
  const database = useDatabase();

  useEffect(() => {

    const fetchSummary = async () => {
      const summary = await transactionSummary({ chargableBillItems, billDiscounts, billPayments, database });
      setSummary(summary);
    };
    fetchSummary();
  }, [chargableBillItems, billDiscounts, billPayments]);
  if (!summary) {
    return <Spinner />;
  }

  const keyedPaymentTypes = keyBy(paymentTypes, type => type.id);
  const hasDiscount = summary.discountTotal > 0;

  return (
    <ListItem {...props} noIndent style={isSelected ? styles.selected : {}} onPress={() => onSelectBill(bill)}>
      <HStack flex={1} alignItems="flex-start" justifyContent="space-between">
        <VStack flex={1} space={1}>
          {showBillRef && (
            <Text style={styles.billRef}>{`Table: ${bill.reference}`}</Text>
          )}
          <Text>{`Closed at: ${dayjs(bill.closedAt).format('HH:mm').toString()}`}</Text>
        </VStack>
        <VStack flex={1} space={1}>
          <Text>{`Total: ${formatNumber(summary.total, currency)}`}</Text>
          {hasDiscount && <Text>{`Discount: ${formatNumber(summary.discountTotal, currency)}`}</Text>}
        </VStack>
        <VStack w="120px" alignItems="flex-end" space={1}>
          {summary.paymentBreakdown.map(type => {
            const paymentTypeName = keyedPaymentTypes[type.paymentTypeId].name;
            const key = `${bill.id}-${type.paymentTypeId}`;
            const amount = formatNumber(type.totalPayed, currency);
            return <Text key={key}>{`${capitalize(paymentTypeName)}: ${amount}`}</Text>;
          })}
        </VStack>
      </HStack>
    </ListItem>
  );
};

const enhance = withObservables<TransactionListRowOuterProps, TransactionListRowInnerProps>(['bill'], ({ bill }) => ({
  chargableBillItems: bill.chargableBillItems,
  billDiscounts: bill.billDiscounts,
  billPayments: bill.billPayments,
}));

export const TransactionListRow = enhance(TransactionListRowInner);

const styles = StyleSheet.create({
  selected: {
    backgroundColor: '#cde1f9',
  },
  billRef: {
    alignSelf: 'flex-start',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
