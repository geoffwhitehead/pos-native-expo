import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import withObservables from '@nozbe/with-observables';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import { capitalize } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ConfirmationActionsheet } from '../../../../components/ConfirmationActionsheet/ConfirmationActionsheet';
import { ItemField } from '../../../../components/ItemField/ItemField';
import { Modal } from '../../../../components/Modal/Modal';
import { ModalContentButton } from '../../../../components/Modal/ModalContentButton';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { Actionsheet, Button, Form, Icon, Input, List, Text, useDisclose, VStack } from '../../../../core';
import type { Bill, BillDiscount, BillItem, BillPayment, PaymentType } from '../../../../models';
import type { BillSummary } from '../../../../utils';
import { moderateScale } from '../../../../utils/scaling';
import { BillCalls } from './sub-components/BillCalls';
import { DiscountsBreakdown } from './sub-components/DiscountsBreakdown';
import { ItemsBreakdown } from './sub-components/ItemsBreakdown';
import type { ModifyReason } from './sub-components/ModalReason';
import { ModalReason } from './sub-components/ModalReason';
import { PaymentsBreakdown } from './sub-components/PaymentsBreakdown';
import { tableNames } from '../../../../models/tableNames';
import { ReceiptItemAction } from './sub-components/constants';

type ReceiptItemsOuterProps = {
  readonly: boolean;
  billPayments: BillPayment[];
  discountBreakdown: BillSummary['discountBreakdown'];
  billDiscounts: BillDiscount[];
  bill: Bill;
  database: Database;
};

type ReceiptItemsInnerProps = {
  billItemsCount: number;
  paymentTypes: PaymentType[];
};

export const ReceiptItemsInner: React.FC<ReceiptItemsOuterProps & ReceiptItemsInnerProps> = ({
  readonly,
  billItemsCount,
  discountBreakdown,
  billPayments,
  billDiscounts,
  paymentTypes,
  bill,
}) => {
  const refContentList = useRef<ScrollView>(null);
  const database = useDatabase();
  const [selectedBillItem, setSelectedBillItem] = useState<BillItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BillPayment | BillDiscount | null>(null);
  const [deleteItemHandler, setDeleteItemHandler] = useState<((item: BillPayment | BillDiscount) => void) | null>(null);
  const [action, setAction] = useState<ReceiptItemAction>();
  const { isOpen: isBillItemActionOpen, onOpen: onBillItemActionOpen, onClose: onBillItemActionClose } = useDisclose();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclose();
  const { organization } = useContext(OrganizationContext);
  const [printMessage, setPrintMessage] = useState('');

  useEffect(() => {
    if (refContentList.current) {
      refContentList.current.scrollToEnd({ animated: true });
    }
  }, [billItemsCount, billDiscounts, billPayments]);

  useEffect(() => {}, [selectedBillItem]);

  const onRemoveBillItem = async (billItem: BillItem, values?: ModifyReason) => {
    await billItem.void(values)
    onCloseModalHandler();
  };

  const onRemoveBillDiscount = (billDiscount: BillDiscount) => billDiscount.void();
  const onRemoveBillPayment = (billPayment: BillPayment) => billPayment.void();

  const onMakeComplimentary = async (billItem: BillItem, values: ModifyReason) => {
    await billItem.makeComp(values)
    onCloseModalHandler();
  };

  const addPrintMessage = async values => {
    await selectedBillItem?.updateBillItem(values);
    onCloseModalHandler();
  };

  const billItemDialog = (billItem: BillItem) => {
    setSelectedBillItem(billItem);
    onBillItemActionOpen();
  };

  const areYouSureDialog = (item: BillPayment | BillDiscount, fn: (item: BillPayment | BillDiscount) => void) => {
    setItemToDelete(item);
    setDeleteItemHandler(() => fn);
    onDeleteOpen();
  };

  const onCloseModalHandler = () => {
    setSelectedBillItem(null);
    setAction(null);
  };

  const isReasonModalOpen = !!selectedBillItem && (action === ReceiptItemAction.comp || action === ReceiptItemAction.void);
  const isPrintMessageModalOpen = !!selectedBillItem && action === ReceiptItemAction.message;

  return (
    <View style={styles.container}>
      <VStack style={styles.receiptItems}>
        <BillCalls bill={bill} />
        <ItemsBreakdown bill={bill} readonly={readonly} onSelect={billItemDialog} />
        <DiscountsBreakdown
          readonly={readonly}
          discountBreakdown={discountBreakdown}
          onSelect={billDiscount => areYouSureDialog(billDiscount, onRemoveBillDiscount)}
          billDiscounts={billDiscounts}
        />
        <PaymentsBreakdown
          readonly={readonly}
          onSelect={billPayment => areYouSureDialog(billPayment, onRemoveBillPayment)}
          payments={billPayments}
          paymentTypes={paymentTypes}
        />
      </VStack>
      <Modal onClose={onCloseModalHandler} isOpen={isReasonModalOpen}>
        <ModalReason
          onClose={onCloseModalHandler}
          onComplete={values => {
            if (action === ReceiptItemAction.void) {
              onRemoveBillItem(selectedBillItem, values);
            }
            if (action === ReceiptItemAction.comp) {
              onMakeComplimentary(selectedBillItem, values);
            }
          }}
          mode={action}
          title={capitalize(selectedBillItem?.itemName)}
        />
      </Modal>
      <Modal onClose={onCloseModalHandler} isOpen={isPrintMessageModalOpen}>
        <Formik
          initialValues={{ printMessage }}
          validationSchema={Yup.object().shape({
            printMessage: Yup.string()
              .min(1, 'Too Short')
              .max(30, 'Too Long')
              .required('Required'),
          })}
          onSubmit={addPrintMessage}
        >
          {({ handleChange, handleBlur, handleSubmit, errors, touched, values }) => {
            const { printMessage } = values;

            return (
              <ModalContentButton
                onPressPrimaryButton={handleSubmit}
                onPressSecondaryButton={onCloseModalHandler}
                secondaryButtonText="Cancel"
                primaryButtonText="Save"
                title={`${selectedBillItem.itemName}: Print Message`}
                size="small"
              >
                <Form>
                  <ItemField
                    label="Print Message"
                    touched={!!touched.printMessage}
                    name="printMessage"
                    errors={errors.printMessage}
                  >
                    <Input
                      onChangeText={handleChange('printMessage')}
                      onBlur={handleBlur('printMessage')}
                      value={printMessage}
                    />
                  </ItemField>
                </Form>
              </ModalContentButton>
            );
          }}
        </Formik>
      </Modal>
      {/* Bill Item Actions Actionsheet */}
      <Actionsheet isOpen={isBillItemActionOpen} onClose={onBillItemActionClose}>
        <Actionsheet.Content>
          {selectedBillItem && (
            <>
              <Actionsheet.Item onPress={() => {
                setAction(ReceiptItemAction.message);
                onBillItemActionClose();
              }}>Add Message</Actionsheet.Item>
              <Actionsheet.Item onPress={() => {
                setAction(ReceiptItemAction.comp);
                onBillItemActionClose();
              }}>Make complimentary</Actionsheet.Item>
              <Actionsheet.Item onPress={() => {
                const endOfGracePeriod = dayjs(selectedBillItem.createdAt).add(organization.gracePeriodMinutes, 'minute');
                const hasGracePeriodExpired = dayjs().isAfter(endOfGracePeriod);
                if (hasGracePeriodExpired) {
                  setAction(ReceiptItemAction.void);
                } else {
                  onRemoveBillItem(selectedBillItem);
                }
                onBillItemActionClose();
              }} _text={{ color: "red.500" }}>Remove</Actionsheet.Item>
              <Actionsheet.Item onPress={onBillItemActionClose}>Cancel</Actionsheet.Item>
            </>
          )}
        </Actionsheet.Content>
      </Actionsheet>

      {/* Delete Confirmation Actionsheet */}
      <ConfirmationActionsheet
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={() => itemToDelete && deleteItemHandler && deleteItemHandler(itemToDelete)}
        message="Remove this item?"
      />
    </View>
  );
};

const enhance = component =>
  withDatabase(
    withObservables<ReceiptItemsOuterProps, ReceiptItemsInnerProps>(
      ['bill', 'billPayments', 'billDiscounts'],
      ({ bill, database }) => ({
        bill,
        billItemsCount: bill.billItems.observeCount(),
        paymentTypes: database.collections.get<PaymentType>(tableNames.paymentTypes).query(),
      }),
    )(component),
  );

export const ReceiptItems = enhance(ReceiptItemsInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  receiptItems: {
    paddingBottom: moderateScale(60),
  },
});
