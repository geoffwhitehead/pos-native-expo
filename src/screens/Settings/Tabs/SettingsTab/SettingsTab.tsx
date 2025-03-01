import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import withObservables from '@nozbe/with-observables';
import { Formik } from 'formik';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import * as Yup from 'yup';
import { HeaderButtonBar } from '../../../../components/HeaderButtonBar/HeaderButtonBar';
import { ItemField } from '../../../../components/ItemField/ItemField';
import { Loading } from '../../../../components/Loading/Loading';
import { ConfirmationActionsheet } from '../../../../components/ConfirmationActionsheet/ConfirmationActionsheet';
import { AuthContext } from '../../../../contexts/AuthContext';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { ReceiptPrinterContext } from '../../../../contexts/ReceiptPrinterContext';
import { Box, Button, Container, FormControl, Icon, Input, Picker, Text, VStack, View, useDisclose } from '../../../../core';
import type { Bill, BillPeriod, PriceGroup, Printer } from '../../../../models';
import { ItemListViewType } from '../../../../models/Organization';
import { moderateScale } from '../../../../utils/scaling';
import { commonStyles } from '../styles';
import { tableNames } from '../../../../models/tableNames';

interface SettingsTabOuterProps {
  database: Database;
  billPeriod: BillPeriod;
}

interface SettingsTabInnerProps {
  printers: Printer[];
  priceGroups: PriceGroup[];
  openBills: Bill[];
}

const settingsSchema = Yup.object().shape({
  defaultPriceGroupId: Yup.string()
    .min(1, 'Too Short')
    .max(40, 'Too Long')
    .required('Required'),
  receiptPrinterId: Yup.string()
    .min(1, 'Too Short')
    .max(40, 'Too Long')
    .required('Required'),
  currency: Yup.string().required('Required'),
  maxBills: Yup.number()
    .min(1, 'Too Low')
    .max(100, 'Too High')
    .required('Required'),
  tablePlannerGridSize: Yup.number()
    .min(5, 'Too Low')
    .max(40, 'Too High')
    .required('Required'),
  itemListViewType: Yup.string().required('Required'),
});

const currencies = [
  {
    id: 'gbp',
    name: 'GBP',
  },
  {
    id: 'eur',
    name: 'EUR',
  },
];

const SettingsTabInner: React.FC<SettingsTabOuterProps & SettingsTabInnerProps> = ({
  printers,
  openBills,
  priceGroups,
}) => {
  const { organization } = useContext(OrganizationContext);
  const { setReceiptPrinter } = useContext(ReceiptPrinterContext);
  const { signOut, unlink } = useContext(AuthContext);
  const { 
    isOpen: isLogoutOpen, 
    onOpen: onLogoutOpen, 
    onClose: onLogoutClose 
  } = useDisclose();
  const { 
    isOpen: isUnlinkOpen, 
    onOpen: onUnlinkOpen, 
    onClose: onUnlinkClose 
  } = useDisclose();
  const [loading, setLoading] = useState(false);
  const database = useDatabase();

  if (!printers || !openBills) {
    return <Loading />;
  }

  const initialValues = {
    defaultPriceGroupId: organization.defaultPriceGroupId,
    receiptPrinterId: organization.receiptPrinterId,
    currency: organization.currency,
    maxBills: organization.maxBills.toString(),
    tablePlannerGridSize: organization.billViewPlanGridSize.toString(),
    itemListViewType: organization.itemListViewType,
  };

  const updateOrganization = async values => {
    setLoading(true);
    const priceGroup = priceGroups.find(pG => pG.id === values.defaultPriceGroupId);
    const receiptPrinter = printers.find(p => p.id === values.receiptPrinterId);
    if (!priceGroup || !receiptPrinter) {
      console.error('Failed to update organization');
    }

    setReceiptPrinter(receiptPrinter);

    await database.write(() =>
      organization.update(org => {
        org.defaultPriceGroup.set(priceGroup);
        org.receiptPrinter.set(receiptPrinter);
        org.currency = values.currency;
        org.maxBills = parseInt(values.maxBills);
        org.billViewPlanGridSize = parseInt(values.tablePlannerGridSize);
        org.itemListViewType = values.itemListViewType;
      }),
    );

    setLoading(false);
  };

  const onLogout = async () => {
    await signOut();
    onLogoutClose();
  };

  const onUnlink = async () => {
    await unlink();
    onUnlinkClose();
  };

  return (
    <VStack alignItems="space-between">
      <Formik
        initialValues={initialValues}
        validationSchema={settingsSchema}
        onSubmit={values => updateOrganization(values)}
      >
        {({ handleChange, handleBlur, handleSubmit, errors, touched, values }) => {
          const {
            defaultPriceGroupId,
            receiptPrinterId,
            currency,
            maxBills,
            tablePlannerGridSize,
            itemListViewType,
          } = values;

          const hasOpenBills = openBills.length > 0;

          return (
            <Container>
              <HeaderButtonBar onPressPrimary={handleSubmit} primaryText="Save Changes"></HeaderButtonBar>
              <ScrollView style={commonStyles.content}>
                <FormControl>
                  <ItemField
                    picker
                    label="Receipt Printer"
                    touched={touched.receiptPrinterId}
                    name="receiptPrinterId"
                    errors={errors.receiptPrinterId}
                    style={{
                      alignItems: 'flex-start',
                    }}
                  >
                    <Picker
                      mode="dropdown"
                      iosIcon={<Icon name="chevron-down-outline" color="white" size={24} />}
                      placeholder="Select receipt printer"
                      selectedValue={receiptPrinterId}
                      onValueChange={handleChange('receiptPrinterId')}
                      textStyle={{
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                    >
                      {printers.map(printer => (
                        <Picker.Item key={printer.id} label={printer.name} value={printer.id} />
                      ))}
                    </Picker>
                  </ItemField>

                  <ItemField
                    picker
                    label="Default Price Group"
                    touched={touched.defaultPriceGroupId}
                    name="defaultPriceGroupId"
                    errors={errors.defaultPriceGroupId}
                    style={{
                      alignItems: 'flex-start',
                    }}
                  >
                    <Picker
                      mode="dropdown"
                      iosIcon={<Icon name="chevron-down-outline" color="white" size={24} />}
                      placeholder="Select default price group"
                      selectedValue={defaultPriceGroupId}
                      onValueChange={handleChange('defaultPriceGroupId')}
                      textStyle={{
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                    >
                      {priceGroups.map(priceGroup => (
                        <Picker.Item key={priceGroup.id} label={priceGroup.name} value={priceGroup.id} />
                      ))}
                    </Picker>
                  </ItemField>

                  <ItemField label="Max open bills" touched={touched.maxBills} name="maxBills" errors={errors.maxBills}>
                    <Input onChangeText={handleChange('maxBills')} onBlur={handleBlur('maxBills')} value={maxBills} />
                  </ItemField>

                  <ItemField
                    label="Table planner grid size"
                    touched={touched.tablePlannerGridSize}
                    name="tablePlannerGridSize"
                    errors={errors.tablePlannerGridSize}
                  >
                    <Input
                      onChangeText={handleChange('tablePlannerGridSize')}
                      onBlur={handleBlur('tablePlannerGridSize')}
                      value={tablePlannerGridSize}
                    />
                  </ItemField>

                  <ItemField
                    picker
                    label="Currency"
                    touched={touched.currency}
                    name="currency"
                    errors={errors.currency}
                    style={{
                      alignItems: 'flex-start',
                    }}
                  >
                    <Picker
                      mode="dropdown"
                      iosIcon={<Icon name="chevron-down-outline" color="white" size={24} />}
                      placeholder="Select currency"
                      selectedValue={currency}
                      onValueChange={handleChange('currency')}
                      enabled={!hasOpenBills}
                      textStyle={{
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                    >
                      {currencies.map(currency => (
                        <Picker.Item key={currency.id} label={currency.name} value={currency.id} />
                      ))}
                    </Picker>
                  </ItemField>

                  <ItemField
                    picker
                    label="Item List View Type"
                    touched={touched.itemListViewType}
                    name="itemListViewType"
                    errors={errors.itemListViewType}
                    style={{
                      alignItems: 'flex-start',
                    }}
                  >
                    <Picker
                      mode="dropdown"
                      iosIcon={<Icon name="chevron-down-outline" color="white" size={24} />}
                      placeholder="Select list view type"
                      selectedValue={itemListViewType}
                      onValueChange={handleChange('itemListViewType')}
                      textStyle={{
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                    >
                      {Object.values(ItemListViewType).map(listType => (
                        <Picker.Item key={listType} label={listType} value={listType} /> // TODO update label to be readable
                      ))}
                    </Picker>
                  </ItemField>
                </FormControl>
              </ScrollView>
              
            </Container>
          );
        }}
      </Formik>
      <Box>
        <View style={{ display: 'flex', flexDirection: 'row', padding: 5 }}>
          <Button style={{ marginRight: 10 }} onPress={onLogoutOpen}>
            <Text>Sign out</Text>
          </Button>
          <Button danger bordered onPress={onUnlinkOpen}>
            <Text>Delete local account</Text>
          </Button>
        </View>
      </Box>

      <ConfirmationActionsheet
        isOpen={isLogoutOpen}
        onClose={onLogoutClose}
        onConfirm={onLogout}
        message="Are you sure you want to logout?"
      />

      <ConfirmationActionsheet
        isOpen={isUnlinkOpen}
        onClose={onUnlinkClose}
        onConfirm={onUnlink}
        message="Are you sure you want to unlink this device? This will remove all local data."
      />
    </VStack>
  );
};

const enhance = c =>
  withDatabase<any>(
    withObservables<SettingsTabOuterProps, SettingsTabInnerProps>([], ({ database, billPeriod }) => ({
      billPeriod,
      openBills: billPeriod.openBills,
      printers: database.collections.get<Printer>(tableNames.printers).query(),
      priceGroups: database.collections.get<PriceGroup>(tableNames.priceGroups).query(),
    }))(c),
  );

export const SettingsTab = enhance(SettingsTabInner);

const styles = StyleSheet.create({
  errorLabel: {
    color: 'red',
  },
  form: {
    width: moderateScale(400),
  },
  row: {
    padding: 5,
  },
  noEditFields: {
    marginLeft: moderateScale(15),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(20),
    padding: moderateScale(10),
    paddingLeft: moderateScale(30),
    borderLeftWidth: 1,
    borderRadius: 5,
    borderColor: 'lightgrey',
  },
});
