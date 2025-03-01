import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import React, { useContext, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SwitchSelector } from '../../../components/SwitchSelector/SwitchSelector';
import { CurrentBillContext } from '../../../contexts/CurrentBillContext';
import { OrganizationContext } from '../../../contexts/OrganizationContext';
import { Box, Button, HStack, Icon, Text, VStack } from '../../../core';
import { database } from '../../../database';
import type { Bill, BillPeriod, TablePlanElement } from '../../../models';
import { BillViewTypeEnum } from '../../../models/Organization';
import { moderateScale } from '../../../utils/scaling';
import { BillRow } from './BillRow';
import { BillRowEmpty } from './BillRowEmpty';
import { TableElementForm } from './TableElementForm';
import type { TableElement} from './TableViewer';
import { TableViewer } from './TableViewer';
import { tableNames } from '../../../models/tableNames';

interface SelectBillInnerProps {
  openBills: Bill[];
  tablePlanElements: TablePlanElement[];
}

interface SelectBillOuterProps {
  billPeriod: BillPeriod;
  /**
   * Optional hook in to select bill on change.
   * This is used when navigated to from the sidebar to redirect the user to the checkout page.
   */
  onSelectBill?: (bill: Bill) => void;
}

export const SelectBillInner: React.FC<SelectBillOuterProps & SelectBillInnerProps> = ({
  onSelectBill,
  openBills,
  billPeriod,
  tablePlanElements,
}) => {
  const { setCurrentBill } = useContext(CurrentBillContext);
  const { organization } = useContext(OrganizationContext);
  const [isFilterOpenSelected, setIsFilterOpenSelected] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<TableElement>();

  const bills: (Bill | null)[] = useMemo(() => {
    const filterOpenOnly = bill => (isFilterOpenSelected ? !!bill : true);

    const billsArr = openBills.reduce((acc, bill) => {
      acc[bill.reference - 1] = bill;
      return [...acc];
    }, Array(organization.maxBills).fill(null));

    return billsArr.filter(filterOpenOnly);
  }, [openBills, isFilterOpenSelected]);

  const _onSelectBill = (bill: Bill) => {
    setCurrentBill(bill);
    onSelectBill && onSelectBill(bill);
  };

  const handleCreateSelectBill = async (reference: number) => {
    const bill = await billPeriod.createBill({ reference });
    _onSelectBill(bill);
  };

  const handleDeleteSelectedTableElement = async () => {
    await selectedElement?.tablePlanElement?.deleteElement();
    setSelectedElement(null);
  };

  const handleSelectElement = (el: TableElement) => {
    if (isEditing) {
      setSelectedElement(el);
    } else {
      const ref = el.tablePlanElement?.billReference;
      if (ref) {
        const bill = openBills.find(bill => bill.reference === ref);
        if (bill) {
          _onSelectBill(bill);
        } else {
          handleCreateSelectBill(ref);
        }
      }
    }
  };

  const handleEditorState = () => {
    setIsEditing(!isEditing);
    setSelectedElement(null);
  };

  const shouldRenderPlanView = organization.billViewType === BillViewTypeEnum.plan;

  const onChangeViewType = async (value: BillViewTypeEnum) => {
    await organization.updateOrganization({ billViewType: value });
  };

  return (
    <>
      <HStack style={styles.controlsItem}>
        {!isEditing && (
          <SwitchSelector
            options={[
              { label: 'Plan', value: BillViewTypeEnum.plan },
              { label: 'List', value: BillViewTypeEnum.list },
            ]}
            initial={organization.billViewType}
            onPress={onChangeViewType}
            style={styles.switch}
          />
        )}
        {!isEditing && (
          <SwitchSelector
            options={[
              { label: 'Show All', value: 0 },
              { label: 'Show Open', value: 1 },
            ]}
            initial={isFilterOpenSelected}
            onPress={value => setIsFilterOpenSelected(value as number)}
            style={styles.switch}
          />
        )}
        {shouldRenderPlanView && (
          <Button style={styles.editPlanButton} success={isEditing} small info={!isEditing} onPress={handleEditorState}>
            {!isEditing && <Icon name="build-outline" size={24}  color="white"/>}
            {isEditing && <Icon name="checkmark"  color="white" size={24}/>}
          </Button>
        )}
      </HStack>
      <HStack>
        {shouldRenderPlanView && (
            <TableViewer
              tableElements={tablePlanElements}
              onSelectElement={handleSelectElement}
              selectedElement={selectedElement}
              gridSize={organization.billViewPlanGridSize}
              openBills={openBills}
              isEditing={isEditing}
            />
        )}
        <VStack style={{ width: shouldRenderPlanView ? moderateScale(500) : '100%' }}>
          {isEditing && !selectedElement && (
            <Text style={{ padding: moderateScale(15) }}>Select a table element to edit...</Text>
          )}
          {isEditing && selectedElement && (
            <TableElementForm
              {...selectedElement}
              maxBills={organization.maxBills}
              onDelete={handleDeleteSelectedTableElement}
            />
          )}
          {!isEditing && (
            <ScrollView>
              <VStack>
                {bills.map((bill, index) => {
                  return bill ? (
                    <BillRow key={bill.id} bill={bill} onSelectBill={_onSelectBill} />
                  ) : (
                    <BillRowEmpty
                      key={'k' + index + 1}
                      reference={index + 1}
                      onCreateSelectBill={handleCreateSelectBill}
                    />
                  );
                })}
              </VStack>
            </ScrollView>
          )}
        </VStack>
      </HStack>
      <Box>
        <Text style={{ padding: 10 }} note>{`Open bills: ${openBills.length} / ${bills.length}`}</Text>
      </Box>
    </>
  );
};

const styles = StyleSheet.create({
  controlsItem: {
    backgroundColor: 'whitesmoke',
    paddingTop: 5,
    paddingBottom: 5,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    alignContent: 'center',
    minHeight: moderateScale(70),
  },
  switch: {
    width: moderateScale(250),
    marginRight: 5,
  },
  editPlanButton: { alignSelf: 'center', marginRight: 5 },
});
export const enhance = c =>
  withDatabase<any>(
    withObservables<SelectBillOuterProps, SelectBillInnerProps>(['billPeriod'], ({ billPeriod }) => ({
      billPeriod,
      openBills: billPeriod.openBills,
      tablePlanElements: database.collections
        .get<TablePlanElement>(tableNames.tablePlanElements)
        .query()
        .observeWithColumns(['bill_reference', 'type', 'rotation']),
    }))(c),
  );

export const SelectBill = enhance(SelectBillInner);
