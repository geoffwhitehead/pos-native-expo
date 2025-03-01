import type { Database} from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import withObservables from '@nozbe/with-observables';
import dayjs from 'dayjs';
import { flatten } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Loading } from '../../../../components/Loading/Loading';
import { TimePicker } from '../../../../components/TimePicker/TimePicker';
import { ConfirmationActionsheet } from '../../../../components/ConfirmationActionsheet/ConfirmationActionsheet';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { ReceiptPrinterContext } from '../../../../contexts/ReceiptPrinterContext';
import { Box, HStack, useDisclose, Button, Icon, Spinner, Text, View, VStack } from '../../../../core';
import type {
  Bill,
  BillCallLog,
  BillCallPrintLog,
  BillDiscount,
  BillPayment,
  Category,
  Discount,
  PaymentType,
  PriceGroup,
  PrintCategory,
  Printer,
} from '../../../../models';
import type { BillItem } from '../../../../models/BillItem';
import { kitchenCall, kitchenReceipt } from '../../../../services/printer/kitchenReceipt';
import { print } from '../../../../services/printer/printer';
import { receiptBill } from '../../../../services/printer/receiptBill';
import { buttons, fonts, spacing } from '../../../../theme';
import type { MinimalBillSummary } from '../../../../utils';
import { formatNumber, minimalBillSummary } from '../../../../utils';
import { RECEIPT_PANEL_BUTTONS_WIDTH } from '../../../../utils/consts';
import { paddingHelper, resolveButtonState } from '../../../../utils/helpers';
import { moderateScale } from '../../../../utils/scaling';
import { ReceiptItems } from './ReceiptItems';
import { PrintStatus } from '../../../../models/constants';
import { tableNames } from '../../../../models/tableNames';
import { StarXpandCommand } from 'react-native-star-io10';

interface ReceiptInnerProps {
  billPayments: BillPayment[];
  billDiscounts: BillDiscount[];
  chargableBillItems: BillItem[];
  discounts: Discount[];
  billModifierItemsCount: number;
  itemsRequiringPrepTimeCount: number;
  incompleteBillCallPrintLogs: number;
}

interface ReceiptOuterProps {
  onStore?: () => void;
  onCheckout?: () => void;
  bill: Bill;
  database: Database;
  isComplete: boolean;
  hideFunctionButtons?: boolean;
}

export const ReceiptInner: React.FC<ReceiptOuterProps & ReceiptInnerProps> = ({
  bill,
  chargableBillItems,
  billDiscounts,
  billPayments,
  onStore,
  onCheckout,
  isComplete,
  discounts,
  itemsRequiringPrepTimeCount,
  billModifierItemsCount,
  incompleteBillCallPrintLogs,
  hideFunctionButtons,
}) => {
  const [summary, setSummary] = useState<MinimalBillSummary>();
  const database = useDatabase();
  const { organization } = useContext(OrganizationContext);
  const { receiptPrinter } = useContext(ReceiptPrinterContext);
  const { currency } = organization;
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [hasStored, setHasStored] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleOnStore = async () => {
    // check if a prep time is required and set
    const priceGroups = await bill.assignedPriceGroups.fetch();

    if (priceGroups.some(priceGroup => priceGroup.isPrepTimeRequired) && !bill.prepAt) {
      return setIsDatePickerVisible(true);
    }

    onStore();

    // fetch print logs
    const [billCallPrintLogs, billItemsPrintLogs] = await Promise.all([
      bill.toPrintBillCallPrintLogs.fetch(),
      bill.toPrintBillLogs.fetch(),
    ]);

    if (billItemsPrintLogs.length > 0 || billCallPrintLogs.length > 0) {
      // updates the status of the print records to processing
      const updates = billItemsPrintLogs.map(billItemPrintLog => ({
        billItemPrintLog,
        status: PrintStatus.processing,
      }));

      const callUpdates = billCallPrintLogs.map(billCallPrintLog => ({
        billCallPrintLog,
        status: PrintStatus.processing,
      }));

      await bill.processPrintLogs(updates);
      await bill.processCallLogs(callUpdates);

      // filter items not being printed and generate print commands
      const ids = billItemsPrintLogs.map(log => log.billItemId);

      // fetch all the bill items associated with the print logs, the printers, and the price groups.
      const [billItems, printers, priceGroups, categories, printCategories] = await Promise.all([
        database.collections
          .get<BillItem>(tableNames.billItems)
          .query(Q.where('id', Q.oneOf(ids)))
          .fetch(),
        database.collections
          .get<Printer>(tableNames.printers)
          .query()
          .fetch(),
        database.collections
          .get<PriceGroup>(tableNames.priceGroups)
          .query()
          .fetch(),
        database.collections
          .get<Category>(tableNames.categories)
          .query()
          .fetch(),
        database.collections
          .get<PrintCategory>(tableNames.printCategories)
          .query()
          .fetch(),
      ]);

      // this will generate the print commands to fire off to all the printers.
      const toPrintBillItemLogs = await kitchenReceipt({
        billItems,
        billItemPrintLogs: billItemsPrintLogs,
        printers,
        priceGroups,
        reference: bill.reference.toString(),
        prepTime: bill.prepAt ? dayjs(bill.prepAt) : null,
        categories,
        printCategories,
        printItemGrouping: organization.printItemGrouping,
      });

      const toPrintCallLogs = await kitchenCall({
        bill,
        billCallPrintLogs,
        printers,
      });

      // attempt to print the receipts
      const printStatuses = await Promise.all(
        toPrintBillItemLogs.map(async ({ billItemPrintLogs, printer, printerBuilder }) => {
          const res = await print({ printerBuilder, printer });
          const status = res.success ? PrintStatus.succeeded : PrintStatus.errored;

          return billItemPrintLogs.map(billItemPrintLog => {
            return {
              billItemPrintLog,
              status,
            };
          });
        }),
      );

      await bill.processPrintLogs(flatten(printStatuses));

      const printCallStatuses = await Promise.all(
        toPrintCallLogs.map(async ({ billCallPrintLog, printer, printerBuilder }) => {
          const res = await print({ printerBuilder, printer });
          const status = res.success ? PrintStatus.succeeded : PrintStatus.errored;
          return {
            billCallPrintLog,
            status,
          };
        }),
      );

      await bill.processCallLogs(printCallStatuses);
    }

    await bill.storeBill
  };

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
  }, [chargableBillItems, billDiscounts, billPayments, billModifierItemsCount]);

  const onPrint = async () => {
    setIsPrinting(true);
    const [billItems, paymentTypes, priceGroups] = await Promise.all([
      bill.billItemsExclVoids.fetch(), // include comps - receipts will show comps but not voids
      database.collections
        .get<PaymentType>(tableNames.paymentTypes)
        .query()
        .fetch(),
      database.collections
        .get<PriceGroup>(tableNames.priceGroups)
        .query()
        .fetch(),
    ]);

    const printerBuilder = new StarXpandCommand.PrinterBuilder();

    await receiptBill(
      printerBuilder,
      bill,
      billItems,
      billDiscounts,
      billPayments,
      discounts,
      priceGroups,
      paymentTypes,
      receiptPrinter,
      organization,
    );

    await print({ printerBuilder, printer: receiptPrinter });
    setIsPrinting(false);
  };

  const handleSetPrepTime = async (date: Date) => {
    await bill.updateBill({ prepAt: date });
    setIsDatePickerVisible(false);
    handleOnStore();
  };

  const handleCancelPrepTimeModal = () => {
    setIsDatePickerVisible(false);
  };

  // const { isOpen: isCallActionOpen, onOpen: onCallActionOpen, onClose: onCallActionClose } = useDisclose();
  const { isOpen: isConfirmActionOpen, onOpen: onConfirmActionOpen, onClose: onConfirmActionClose } = useDisclose();

  if (!bill || !summary) {
    return <Loading />;
  }

  const createCallLog = async (message?: string) => {
    // TODO: pass message
    onConfirmActionClose()
    await database.write(async () => {
      const billCallLog = database.collections.get<BillCallLog>(tableNames.billCallLogs).prepareCreate(record => {
        record.bill.set(bill);
        Object.assign(record, {
          printMessage: message,
        });
      });

      const printers = await database.collections
        .get<Printer>(tableNames.printers)
        .query(Q.where('receives_bill_calls', Q.eq(true)))
        .fetch();

      const billCallPrintLogs = printers.map(printer =>
        database.collections.get<BillCallPrintLog>(tableNames.billCallPrintLogs).prepareCreate(record => {
          record.printer.set(printer);
          Object.assign(record, {
            billCallLogId: billCallLog.id,
            status: PrintStatus.pending,
          });
        }),
      );

      const batched = [billCallLog, ...billCallPrintLogs];

      await database.batch(...batched);
    });
  };




  const { totalDiscount, total, totalPayable, balance } = summary;

  // const requiresPrepTime =
  //   priceGroups.some(priceGroup => priceGroup.isPrepTimeRequired) && itemsRequiringPrepTimeCount > 0;
  const dateString = bill.prepAt ? dayjs(bill.prepAt).format('h:mm A') : '';
  const isCallButtonDisabled = incompleteBillCallPrintLogs > 0;
  const hasDiscount = totalDiscount > 0;

  return (
    <VStack style={styles.grid}>
      <HStack>
        {!(isComplete || hideFunctionButtons) && (
          <Box style={styles.columnMainButtons}>
            <Box style={{ height: buttons.large }}>
              <Button style={styles.buttonLeft} colorScheme='info' onPress={onStore} leftIcon={<Icon name="layers" size={24} color="white" />}>
                Bills
              </Button>
            </Box>
            <Box style={{ height: buttons.large }}>
              <Button
                {...resolveButtonState(isCallButtonDisabled, 'warning')}
                onPress={onConfirmActionOpen}
                style={styles.buttonLeft}
                leftIcon={<Icon name="notifications" size={24} color="white" />}
              >
                Call
              </Button>
            </Box>
            <Box />
            <Box>
              <Button colorScheme='success' onPress={onCheckout} style={styles.buttonLeft} leftIcon={<Icon name="cart" size={24}  color="white"/>}>
                Pay
              </Button>
            </Box>
            <Box style={{}}>
              <Button onPress={handleOnStore} style={styles.buttonLeft} leftIcon={<Icon name="download" size={24}  color="white"/>}>
                Store
              </Button>
            </Box>
          </Box>
        )}
        <Box style={styles.colummMain}>
          <Box style={styles.rowDetails}>
            <View style={styles.billDetail}>
              <Text style={styles.detailLabel} sub>
                Open
              </Text>
              <Text style={styles.textTimes}>
                {dayjs(bill.createdAt)
                  .format('DD/MM/YYYY h:mm a')
                  .toString()}
              </Text>
            </View>
            <View style={styles.billDetail}>
              <Text style={styles.detailLabel} sub>
                Prep
              </Text>
              <Text style={styles.textTimes}>{dateString}</Text>
            </View>
            <View style={styles.billDetail}>
              <Text style={styles.detailLabel} sub>
                Bill
              </Text>
              <Text style={styles.textTimes}>{bill.reference}</Text>
            </View>
          </Box>
          <Box style={styles.itemsRow}>
            <ReceiptItems
              bill={bill}
              readonly={isComplete}
              discountBreakdown={summary.discountBreakdown}
              billPayments={billPayments}
              billDiscounts={billDiscounts}
            />
          </Box>
          <Box style={styles.subTotalRow}>
            <Text>{`Subtotal: ${formatNumber(total, currency)}`}</Text>

            {hasDiscount && <Text>{`Discount: ${formatNumber(0 - totalDiscount, currency)}`}</Text>}

            <Text>{`Total: ${formatNumber(totalPayable, currency)}`}</Text>
            {isComplete && (
              <Text>{`Change Due: ${formatNumber(
                Math.abs(billPayments.find(payment => payment.isChange).amount),
                currency,
              )}`}</Text>
            )}
            <Text style={fonts.h2}>{`Balance: ${formatNumber(balance, currency)}`}</Text>
          </Box>
          <Box style={styles.printRow}>
            <Button
              isDisabled={!receiptPrinter}
              {...resolveButtonState(!receiptPrinter || isPrinting, 'info')}
              leftIcon={<Icon name="receipt" color="white" size={24} />}
              style={styles.printButton}
              onPress={onPrint}
              isLoading={isPrinting}
            >Print
            </Button>
          </Box>

          <TimePicker
            isVisible={isDatePickerVisible}
            onCancel={handleCancelPrepTimeModal}
            onConfirm={handleSetPrepTime}
            value={bill.prepAt}
            title="Please select a preperation time"
            mode="time"
          />

          <ConfirmationActionsheet
            isOpen={isConfirmActionOpen}
            onClose={onConfirmActionClose}
            onConfirm={createCallLog}
            message="Confirm call?"
            confirmText="Call"
            cancelText="Cancel"
          />
        </Box>
      </HStack>
    </VStack>
  );
};

const enhance = component =>
  withDatabase<any>(
    withObservables<ReceiptOuterProps, ReceiptInnerProps>(['bill'], ({ bill, database }) => ({
      bill,
      incompleteBillCallPrintLogs: bill.incompleteBillCallPrintLogs.observeCount(),
      billPayments: bill.billPayments,
      billDiscounts: bill.billDiscounts,
      itemsRequiringPrepTimeCount: bill.itemsRequiringPrepTimeCount,
      chargableBillItems: bill.chargableBillItems, // include any items that are send to the kitchen
      discounts: database.collections.get<Discount>(tableNames.discounts).query(),
      priceGroups: bill.priceGroups.observeWithColumns(['isPrepTimeRequired']),
      /**
       * billModifierItems is here purely to cause a re render and recalculation of the
       * bill summary on adding a modifier item.
       */
      billModifierItemsCount: bill.billModifierItems.observeCount(),
    }))(component),
  );

export const Receipt = enhance(ReceiptInner);

const styles = StyleSheet.create({
  grid: {
    borderLeftWidth: 1,
    borderLeftColor: 'lightgrey',
  },
  columnMainButtons: { width: RECEIPT_PANEL_BUTTONS_WIDTH, backgroundColor: 'whitesmoke' },
  colummMain: { minWidth: 1 },
  buttonLeft: {
    height: '100%',
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  textTimes: { fontWeight: 'bold' },
  billDetail: {
    ...paddingHelper(spacing[2], spacing[4]),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  columnsOptions: { ...paddingHelper(spacing[2], spacing[4]), justifyContent: 'flex-end', alignContent: 'flex-end' },
  rowDetails: {
    ...paddingHelper(spacing[4], spacing[0]),
    backgroundColor: 'ivory',
    borderLeftWidth: 1,
    borderColor: 'lightgrey',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 0,
  },
  detailLabel: {
    minWidth: moderateScale(75),
    alignSelf: 'center',
  },
  itemsRow: { borderLeftWidth: 1, borderLeftColor: 'lightgrey' },
  subTotalRow: {
    backgroundColor: 'ivory',
    flex: 0,
    borderTopColor: 'lightgrey',
    borderTopWidth: 1,
    flexDirection: 'column',
    ...paddingHelper(spacing[5], spacing[4]),
    borderLeftWidth: 1,
    borderLeftColor: 'lightgrey',
    color: 'white',
  },
  printRow: {
    height: buttons.medium,
  },
  printButton: {
    height: '100%',
    width: '100%',
    textAlign: 'center',
  },
  receiptTextHeaders: {
    textAlign: 'center',
  },
});
