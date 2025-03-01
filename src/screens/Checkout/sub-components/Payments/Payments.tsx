import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { capitalize } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { Box, Button, FormControl, HStack, Input, Text, VStack } from '../../../../core';
import type { Bill, BillDiscount, BillItem, BillPayment, Discount, PaymentType } from '../../../../models';
import type { MinimalBillSummary } from '../../../../utils';
import { formatNumber, getDefaultCashDenominations, minimalBillSummary } from '../../../../utils';
import { paymentTypeNames } from '../../../../utils/consts';
import { moderateScale } from '../../../../utils/scaling';
import { tableNames } from '../../../../models/tableNames';

interface PaymentOuterProps {
  bill: Bill;
  onCompleteBill: () => Promise<void>;
  database: Database;
  onBack: () => void;
}

interface PaymentInnerProps {
  discounts: Discount[];
  paymentTypes: PaymentType[];
  billDiscounts: BillDiscount[];
  billPayments: BillPayment[];
  chargableBillItems: BillItem[];
}

const PaymentsInner: React.FC<PaymentOuterProps & PaymentInnerProps> = ({
  billDiscounts,
  billPayments,
  chargableBillItems,
  bill,
  discounts,
  paymentTypes,
  onCompleteBill,
  database,
  onBack,
}) => {
  const [value, setValue] = useState<string>('');
  // TODO: this / payment types will need refactoring so not having to use find
  const cashType: PaymentType = paymentTypes.find(pt => pt.name.toLowerCase() === paymentTypeNames.CASH);

  const {
    organization: { currency },
  } = useContext(OrganizationContext);

  const denominations = getDefaultCashDenominations(currency);

  const [summary, setSummary] = useState<MinimalBillSummary>(null);

  const onValueChange = (value: string) => setValue(value);

  useEffect(() => {
    const summary = async () => {
      const summary = await minimalBillSummary({
        chargableBillItems,
        billDiscounts,
        billPayments,
        discounts,
        database,
      });
      setSummary(summary);
    };
    summary();
  }, [billPayments, chargableBillItems, billDiscounts]);

  useEffect(() => {
    const finalize = async () => {
      await bill.addPayment({ paymentType: cashType, amount: summary.balance, isChange: true });
      await bill.close();
      await Promise.all(
        billDiscounts.map(async billDiscount => {
          const amt = summary.discountBreakdown.find(d => d.billDiscountId === billDiscount.id).calculatedDiscount;
          await billDiscount.finalize(amt);
        }),
      );
      onCompleteBill();
    };
    summary && summary.balance <= 0 && finalize();
  }, [summary, bill]);

  const addPayment = async (paymentType: PaymentType, amt: number) => {
    await bill.addPayment({ paymentType, amount: amt || Math.max(summary.balance, 0) });
    setValue('');
  };

  const addDiscount = async (discount: Discount) => bill.addDiscount({ discount });

  return (
    <HStack>
      <Box style={styles.leftPanel} />
      <VStack style={styles.rightPanel}>
        <Button small bordered info onPress={onBack} style={styles.backRow}>
          <Text style={{ fontWeight: 'bold' }}>Back</Text>
        </Button>
        <Box style={styles.rowCustomAmount}>
          <Box style={{ width: '100%', height: moderateScale(120) }}>
            <FormControl.Label>Custom amount</FormControl.Label>
            <Input
              value={value}
              onChangeText={onValueChange}
              keyboardType="number-pad"
              style={{ lineHeight: moderateScale(100), fontSize: moderateScale(80) }}
            />
          </Box>
        </Box>
        <HStack style={styles.row}>
          <Box style={styles.buttonColumn}>
            <FormControl.Label style={styles.columnLabel}>Discounts</FormControl.Label>
            {discounts.map(discount => {
              return (
                <Button
                  key={discount.id}
                  full
                  onPress={() => addDiscount(discount)}
                  style={{ ...styles.discountButton, backgroundColor: 'goldenrod' }}
                >
                  <Text style={styles.buttonText}>{discount.name}</Text>
                </Button>
              );
            })}
          </Box>
          <Box style={styles.denomButtonColumn}>
            {denominations.map(amt => {
              return (
                <Button key={amt} full info style={styles.button} onPress={() => addPayment(cashType, amt)}>
                  <Text style={styles.buttonText}>{`${formatNumber(amt, currency)}`}</Text>
                </Button>
              );
            })}
          </Box>
          <Box style={styles.buttonColumn}>
            {paymentTypes.map(paymentType => {
              return (
                <Button
                  full
                  key={paymentType.id}
                  style={{ ...styles.button, backgroundColor: 'seagreen' }}
                  onPress={() => addPayment(paymentType, parseFloat(value))}
                >
                  <Text style={styles.buttonText}>{capitalize(paymentType.name)}</Text>
                </Button>
              );
            })}
          </Box>
        </HStack>
      </VStack>
    </HStack>
  );
};

const enhance = component =>
  withDatabase<any>(
    withObservables<PaymentOuterProps, PaymentInnerProps>(['bill'], ({ database, bill }) => ({
      bill,
      discounts: database.collections
        .get<Discount>(tableNames.discounts)
        .query()
        .observe(),
      paymentTypes: database.collections
        .get<PaymentType>(tableNames.paymentTypes)
        .query()
        .observe(),
      billPayments: bill.billPayments,
      billDiscounts: bill.billDiscounts,
      chargableBillItems: bill.chargableBillItems,
    }))(component),
  );

export const Payments = enhance(PaymentsInner);

const styles = StyleSheet.create({
  backRow: {
    height: moderateScale(40),
  },
  rowCustomAmount: {
    height: moderateScale(130),
  },
  row: {
    padding: moderateScale(10),
  },
  leftPanel: {
    borderRightColor: 'lightgrey',
    borderRightWidth: 1,
    backgroundColor: 'whitesmoke',
  },
  rightPanel: {
    padding: moderateScale(10),
    width: moderateScale(600),
  },
  buttonColumn: {
    flexDirection: 'column',
    padding: moderateScale(5),
  },
  denomButtonColumn: {
    flexDirection: 'column',
    padding: moderateScale(5),
    // paddingLeft: moderateScale(80),
    flex: 1,
    alignItems: 'stretch',
  },
  button: {
    marginBottom: moderateScale(10),
    textAlign: 'center',
    alignContent: 'center',
    flex: 1,
  },
  discountButton: {
    marginBottom: moderateScale(10),
    textAlign: 'center',
    alignContent: 'center',
  },
  buttonText: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  col: { padding: 0 },
  columnLabel: { padding: 10, color: 'grey', width: '100%', textAlign: 'center' },
});
