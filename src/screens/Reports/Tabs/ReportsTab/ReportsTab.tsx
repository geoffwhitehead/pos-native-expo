import type { Database} from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import dayjs from 'dayjs';
import React, { useContext, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { ReceiptPrinterContext } from '../../../../contexts/ReceiptPrinterContext';
import {
  Button,
  Container,
  Divider,
  HStack,
  Spinner,
  Text,
  Toast,
  useToast,
  View,
  VStack,
} from '../../../../core';
import type { BillPeriod, Organization, PaymentType, Printer } from '../../../../models';
import type { SidebarDrawerStackParamList } from '../../../../navigators/SidebarNavigator';
import { correctionReport } from '../../../../services/printer/correctionReport';
import { periodReport } from '../../../../services/printer/periodReport';
import { print } from '../../../../services/printer/printer';
import { resolveButtonState } from '../../../../utils/helpers';
import { ReportReceipt } from './ReportReceipt/ReportReceipt';
import { tableNames } from '../../../../models/tableNames';
import { StarXpandCommand } from 'react-native-star-io10';
import { ConfirmationActionsheet } from '../../../../components/ConfirmationActionsheet/ConfirmationActionsheet';
import { useDisclose } from '../../../../core';

interface ReportsTabInnerProps {
  billPeriods: BillPeriod[];
  paymentTypes: PaymentType[];
}

interface ReportsTabOuterProps {
  navigation: DrawerNavigationProp<SidebarDrawerStackParamList, 'Reports'>;
  database: Database;
}

export const ReportsTabInner: React.FC<ReportsTabOuterProps & ReportsTabInnerProps> = ({
  database,
  navigation,
  billPeriods,
}) => {
  const { organization } = useContext(OrganizationContext);
  const { receiptPrinter } = useContext(ReceiptPrinterContext);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBillPeriod, setSelectedBillPeriod] = useState<BillPeriod>(billPeriods[0]);
  const { isOpen, onOpen, onClose } = useDisclose();
  const [billPeriodToClose, setBillPeriodToClose] = useState<BillPeriod | null>(null);

  const toast = useToast();

  navigation.addListener('focus', () => setSelectedBillPeriod(null));

  const onPrintPeriodReport = async (billPeriod: BillPeriod) => {
    setIsLoading(true);
    const printerBuilder = new StarXpandCommand.PrinterBuilder();

    await periodReport({ builder: printerBuilder, billPeriod, database, printer: receiptPrinter, organization });
    
    await print({ printerBuilder, printer: receiptPrinter });
    setIsLoading(false);
  };

  const closePeriod = async (billPeriod: BillPeriod, organization: Organization) => {
    setIsLoading(true);
    await billPeriod.closePeriod(organization);
    await onPrintPeriodReport(billPeriod);
    setIsLoading(false);
    onClose();
  };

  const onPrintCorrectionReport = async (billPeriod: BillPeriod) => {
    setIsLoading(true);
    const printerBuilder = new StarXpandCommand.PrinterBuilder();
    await correctionReport({ builder: printerBuilder, billPeriod, database, printer: receiptPrinter, organization });
    await print({ printerBuilder, printer: receiptPrinter });
    setIsLoading(false);
  };

  const confirmClosePeriod = async (billPeriod: BillPeriod, organization: Organization) => {
    const openBills = await billPeriod.openBills.fetch();
    if (openBills.length > 0) {
      toast.show({
        title: `There are currently ${openBills.length} open bills, please close these first.`,
        duration: 5000,
        placement: 'bottom',
        variant: 'solid',
      });
    } else {
      setBillPeriodToClose(billPeriod);
    onOpen();
    }
  };

  return (
    <Container>
      <HStack>
        <VStack>
            <Text style={{ fontWeight: 'bold' }}>Recent bill periods</Text>
            <Divider/>
          <ScrollView>
            <VStack>
              {billPeriods.map(billPeriod => {
                return (
                    <HStack flex={1} alignItems="center" justifyContent="space-between" key={billPeriod.id} style={billPeriod.id === selectedBillPeriod?.id ? { marginLeft: 0, paddingLeft: 14, backgroundColor: 'lightblue' } : {}} onTouchEnd={() => setSelectedBillPeriod(billPeriod)}>
                      <View style={{ display: 'flex' }}>
                        <Text>{`Opened: ${dayjs(billPeriod.createdAt).format('ddd DD/MM/YYYY HH:mm:ss')}`}</Text>
                        <Text>
                          {`Closed: ${
                            billPeriod.closedAt ? dayjs(billPeriod.closedAt).format('ddd DD/MM/YYYY HH:mm:ss') : ''
                          }`}
                        </Text>
                      </View>
                      <HStack w="200px" justifyContent="flex-end">
                        {!billPeriod.closedAt && (
                          <View>
                            <Button
                              size='sm'
                              {...resolveButtonState(isLoading, 'info')}
                              style={{ marginBottom: 2 }}
                              onPress={() => onPrintPeriodReport(billPeriod)}
                            >
                              Print Status Report
                            </Button>
                            <Button
                              size='sm'
                              {...resolveButtonState(isLoading, 'danger')}
                              onPress={() => confirmClosePeriod(billPeriod, organization)}
                            >
                              Close Period
                            </Button>
                          </View>
                        )}
                        {billPeriod.closedAt && (
                          <View>
                            <Button
                              size='sm'
                              {...resolveButtonState(isLoading, 'primary')}
                              onPress={() => onPrintPeriodReport(billPeriod)}
                              style={{ marginBottom: 2 }}
                            >
                              Print End Period Report
                            </Button>
                            <Button
                              size='sm'
                              {...resolveButtonState(isLoading, 'info')}
                              style={{ marginRight: 2 }}
                              onPress={() => onPrintCorrectionReport(billPeriod)}
                            >
                              Print Correction Report
                            </Button>
                          </View>
                        )}
                      </HStack>
                    </HStack>
                );
              })}
            </VStack>
            {isLoading && <Spinner />}
          </ScrollView>
        </VStack>
        {selectedBillPeriod && (
          <ReportReceipt
            billPeriod={selectedBillPeriod}
            // bills={allBills.filtered('billPeriod._id = $0', selectedBillPeriod._id)}
            // categories={categories}
            // paymentTypes={paymentTypes}
            // discounts={discounts}
            // onPressPrint={() => onPrintPeriodReport(selectedBillPeriod)}
          />
        )}
      </HStack>

      <ConfirmationActionsheet
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => billPeriodToClose && closePeriod(billPeriodToClose, organization)}
        message="Close current billing period and print report?"
        confirmText="Close bill period"
      />
    </Container>
  );
};

const enhance = c =>
  withDatabase<any>(
    withObservables<ReportsTabOuterProps, ReportsTabInnerProps>([], ({ database }) => ({
      paymentTypes: database.collections.get<PaymentType>(tableNames.paymentTypes).query(),
      billPeriods: database.collections
        .get<BillPeriod>(tableNames.billPeriods)
        .query(Q.sortBy('created_at', Q.desc), Q.take(7)),
    }))(c),
  );

export const ReportsTab = enhance(ReportsTabInner);
