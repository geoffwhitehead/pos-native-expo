import { capitalize, keyBy } from 'lodash';
import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { OrganizationContext } from '../../../../../contexts/OrganizationContext';
import { Divider, HStack, Text } from '../../../../../core';
import type { BillPayment, PaymentType } from '../../../../../models';
import { formatNumber } from '../../../../../utils';
import { ITEM_SPACING } from '../../../../../utils/consts';

interface PaymentsBreakdownProps {
  payments: BillPayment[];
  paymentTypes: PaymentType[];
  readonly: boolean;
  onSelect: (BillPayment: BillPayment) => void;
}

const PaymentsBreakdown: React.FC<PaymentsBreakdownProps> = ({ payments, readonly, onSelect, paymentTypes }) => {
  const {
    organization: { currency },
  } = useContext(OrganizationContext);

  if (!payments || !payments.length) {
    return null;
  }

  const keyedPaymentTypes = keyBy(paymentTypes, ({ id }) => id);

  return (
    <>
      <Text>Payments</Text>
      <Divider key="payment-separator" />
      {payments
        .filter(payment => !payment.isChange)
        .map(payment => {
          const paymentType = keyedPaymentTypes[payment.paymentTypeId];
          return (
            <HStack flex={1} alignItems="center" justifyContent="space-between" key={payment.id} onTouchEnd={() => !readonly && onSelect(payment)} style={styles.listItem}>
              <HStack flex={1}>
                <Text>{`Payment: ${capitalize(paymentType.name)}`}</Text>
              </HStack>
              <HStack flex={1} justifyContent="flex-end">
                <Text note>{`${formatNumber(payment.amount, currency)}`}</Text>
              </HStack>
            </HStack>
          );
        })}
    </>
  );
};

export { PaymentsBreakdown };

const styles = StyleSheet.create({
  listItem: {
    paddingTop: ITEM_SPACING,
    paddingBottom: ITEM_SPACING,
  },
});
