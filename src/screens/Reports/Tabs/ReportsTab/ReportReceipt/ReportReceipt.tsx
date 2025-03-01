import { useDatabase } from '@nozbe/watermelondb/hooks';
import withObservables from '@nozbe/with-observables';
import { capitalize, sumBy } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Loading } from '../../../../../components/Loading/Loading';
import { OrganizationContext } from '../../../../../contexts/OrganizationContext';
import { Col, Content, HStack, List, ListItem, Separator, Text } from '../../../../../core';
import type { BillPeriod } from '../../../../../models';
import type { PeriodReportData} from '../../../../../services/printer/periodReport';
import { periodReportData } from '../../../../../services/printer/periodReport';
import { formatNumber } from '../../../../../utils';
import { RECEIPT_PANEL_BUTTONS_WIDTH, RECEIPT_PANEL_WIDTH } from '../../../../../utils/consts';
import { moderateScale } from '../../../../../utils/scaling';

interface ReportReceiptInnerProps {
  // onPressPrint: () => void;
  closedBillsCount: number;
}

interface ReportReceiptOuterProps {
  // onPressPrint: () => void;
  billPeriod: BillPeriod;
}

export const ReportReceiptInner: React.FC<ReportReceiptInnerProps & ReportReceiptOuterProps> = ({
  // onPressPrint,
  billPeriod,
  closedBillsCount,
}) => {
  const {
    organization: { currency },
  } = useContext(OrganizationContext);

  const database = useDatabase();

  const [reportData, setReportData] = useState<PeriodReportData>();

  useEffect(() => {
    const fetchData = async () => {
      const summary = await periodReportData({ billPeriod, database });
      setReportData(summary);
    };
    fetchData();
  }, [billPeriod, closedBillsCount]);

  if (!reportData) {
    return <Loading />;
  }

  const {
    bills,
    billItems,
    categories,
    categoryTotals,
    modifierTotals,
    discountTotals,
    paymentTotals,
    voidTotal,
    voidCount,
    priceGroupTotals,
    salesTotal,
    compBillItems,
    compBillItemModifierItems,
  } = reportData;

  return (
    <Col style={styles.rightColumn}>
      <Row>
        <Content>
          <List>
            <Separator bordered>
              <Text>Category Totals</Text>
            </Separator>
            {categoryTotals.breakdown.map(({ categoryId, count, total }) => {
              const category = categories.find(c => c.id === categoryId);
              if (!category) {
                return null;
              }
              return (
                <ListItem key={categoryId}>
                  <HStack flex={1} alignItems="center" justifyContent="space-between">
                    <Text>{category.name}</Text>
                    <Text style={styles.listItemRight}>{`${count} / ${formatNumber(total, currency)}`}</Text>
                  </HStack>
                </ListItem>
              );
            })}
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Total</Text>
                <Text style={styles.listItemRight}>{`${categoryTotals.count} / ${formatNumber(categoryTotals.total, currency)}`}</Text>
              </HStack>
            </ListItem>
            <Separator bordered>
              <Text>Modifier Totals</Text>
            </Separator>
            {modifierTotals.breakdown.map(({ modifierName, breakdown, total, count }) => {
              return (
                <>
                  <ListItem itemDivider key={modifierName}>
                    <HStack flex={1} alignItems="center" justifyContent="space-between">
                      <Text>{modifierName}</Text>
                      <Text style={styles.listItemRight}>{`${count} / ${formatNumber(total, currency)}`}</Text>
                    </HStack>
                  </ListItem>
                  {breakdown.map(({ modifierItemName, total, count }) => {
                    return (
                      <ListItem key={modifierName + modifierItemName}>
                        <HStack flex={1} alignItems="center" justifyContent="space-between">
                          <Text>{modifierItemName}</Text>
                          <Text style={styles.listItemRight}>{`${count} / ${formatNumber(total, currency)}`}</Text>
                        </HStack>
                      </ListItem>
                    );
                  })}
                </>
              );
            })}
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Total</Text>
                <Text style={styles.listItemRight}>{`${modifierTotals.count} / ${formatNumber(modifierTotals.total, currency)}`}</Text>
              </HStack>
            </ListItem>
            <Separator bordered>
              <Text>Price Group Totals (excl discounts)</Text>
            </Separator>
            {priceGroupTotals.map(({ name, total, count }) => {
              return (
                <ListItem key={name}>
                  <HStack flex={1} alignItems="center" justifyContent="space-between">
                    <Text>{name}</Text>
                    <Text style={styles.listItemRight}>{`${count} / ${formatNumber(total, currency)}`}</Text>
                  </HStack>
                </ListItem>
              );
            })}
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Total</Text>
                <Text style={styles.listItemRight}>{`${sumBy(priceGroupTotals, ({ count }) => count)} / ${formatNumber(
                  sumBy(priceGroupTotals, ({ total }) => total),
                  currency,
                )}`}</Text>
              </HStack>
            </ListItem>
            <Separator bordered>
              <Text>Discount Totals</Text>
            </Separator>
            {discountTotals.breakdown.map(({ name, total, count }) => {
              return (
                <ListItem key={name}>
                  <HStack flex={1} alignItems="center" justifyContent="space-between">
                    <Text>{name}</Text>
                    <Text style={styles.listItemRight}>{`${count} / ${formatNumber(total, currency)}`}</Text>
                  </HStack>
                </ListItem>
              );
            })}
            <Separator bordered>
              <Text>Complimentary Totals</Text>
            </Separator>
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Items</Text>
                <Text style={styles.listItemRight}>{`${compBillItems.length} / ${formatNumber(sumBy(compBillItems, 'itemPrice'), currency)}`}</Text>
              </HStack>
            </ListItem>
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Modifiers</Text>
                <Text style={styles.listItemRight}>{`${compBillItemModifierItems.length} / ${formatNumber(
                  sumBy(compBillItemModifierItems, 'modifierItemPrice'),
                  currency,
                )}`}</Text>
              </HStack>
            </ListItem>

            <Separator bordered>
              <Text>Payment Totals</Text>
            </Separator>
            {paymentTotals.breakdown.map(({ name, total, count }) => {
              return (
                <ListItem key={name}>
                  <HStack flex={1} alignItems="center" justifyContent="space-between">
                    <Text>{capitalize(name)}</Text>
                    <Text style={styles.listItemRight}>{`${count} / ${formatNumber(total, currency)}`}</Text>
                  </HStack>
                </ListItem>
              );
            })}
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Total</Text>
                <Text style={styles.listItemRight}>{`${paymentTotals.count} / ${formatNumber(paymentTotals.total, currency)}`}</Text>
              </HStack>
            </ListItem>

            {/* BILLS */}
            <Separator bordered>
              <Text>Total</Text>
            </Separator>
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Number of bills</Text>
                <Text style={styles.listItemRight}>{bills.length.toString()}</Text>
              </HStack>
            </ListItem>
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Voids</Text>
                <Text style={styles.listItemRight}>{`${voidCount} / ${formatNumber(voidTotal, currency)}`}</Text>
              </HStack>
            </ListItem>
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Discounts: </Text>
                <Text style={styles.listItemRight}>{`${discountTotals.count} / ${formatNumber(discountTotals.total, currency)}`}</Text>
              </HStack>
            </ListItem>
            <ListItem>
              <HStack flex={1} alignItems="center" justifyContent="space-between">
                <Text>Sales Total: </Text>
                <Text style={styles.listItemRight}>{formatNumber(salesTotal, currency)}</Text>
              </HStack>
            </ListItem>
          </List>
        </Content>
      </Row>
    </Col>
  );
};

const enhance = c =>
  withObservables<ReportReceiptOuterProps, ReportReceiptInnerProps>(['billPeriod'], ({ billPeriod }) => ({
    closedBillsCount: billPeriod.bills.observeCount(),
  }))(c);

export const ReportReceipt = enhance(ReportReceiptInner);

const styles = StyleSheet.create({
  rightColumn: {
    width: moderateScale(RECEIPT_PANEL_WIDTH + RECEIPT_PANEL_BUTTONS_WIDTH),
    borderLeftWidth: 1,
    borderLeftColor: 'lightgrey',
  },
  listItemRight: {
    flex: 1,
  },
  rowPrintButton: { height: 10, padding: 5 },
  printButton: { width: '100%', textAlign: 'center', height: '100%' },
});
