import { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Loading } from '../../../../components/Loading/Loading';
import { Modal } from '../../../../components/Modal/Modal';
import { ActionSheet, Button, Container, Icon, Left, List, ListItem, Right, Text } from '../../../../core';
import { PrinterGroup, tableNames } from '../../../../models';
import { ModalPrinterGroupDetails } from './ModalPrinterGroupDetails';
import { PrinterGroupRow } from './PrinterGroupRow';

interface PrinterGroupsTabOuterProps {
  database: Database;
}

interface PrinterGroupsTabInnerProps {
  printerGroups: PrinterGroup[];
}

const PrinterGroupsTabInner: React.FC<PrinterGroupsTabOuterProps & PrinterGroupsTabInnerProps> = ({
  printerGroups,
}) => {
  const [selectedPrinterGroup, setSelectedPrinterGroup] = useState<PrinterGroup>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onCancelHandler = () => {
    setSelectedPrinterGroup(null);
    setIsModalOpen(false);
  };

  const onSelect = (printerGroup: PrinterGroup) => {
    setSelectedPrinterGroup(printerGroup);
    setIsModalOpen(true);
  };

  const onDelete = async (printerGroup: PrinterGroup) => {
    await printerGroup.remove();
  };

  const areYouSure = (fn, printerGroup: PrinterGroup) => {
    const options = ['Yes', 'Cancel'];
    ActionSheet.show(
      {
        options,
        title:
          'This will permanently remove this printer group and remove this group from any items its assigned to. Are you sure?',
      },
      index => {
        index === 0 && fn(printerGroup);
      },
    );
  };

  if (!printerGroups) {
    return <Loading />;
  }
  return (
    <Container>
      <List>
        <ListItem itemDivider>
          <Left>
            <Text>Printer Groups</Text>
          </Left>
          <Right>
            <Button iconLeft success small onPress={() => setIsModalOpen(true)}>
              <Icon name="ios-add-circle-outline" />
              <Text>Create</Text>
            </Button>
          </Right>
        </ListItem>
        <ScrollView>
          {printerGroups.map(printerGroup => (
            <PrinterGroupRow
              key={printerGroup.id}
              isSelected={printerGroup === selectedPrinterGroup}
              printerGroup={printerGroup}
              onSelect={onSelect}
              onDelete={() => areYouSure(onDelete, printerGroup)}
            />
          ))}
        </ScrollView>
      </List>
      <Modal isOpen={isModalOpen} onClose={onCancelHandler} style={{ maxWidth: 800 }}>
        <ModalPrinterGroupDetails printerGroup={selectedPrinterGroup} onClose={onCancelHandler} />
      </Modal>
    </Container>
  );
};

const enhance = c =>
  withDatabase<any>(
    withObservables<PrinterGroupsTabOuterProps, PrinterGroupsTabInnerProps>([], ({ database }) => ({
      printerGroups: database.collections.get<PrinterGroup>(tableNames.printerGroups).query(),
    }))(c),
  );

export const PrinterGroupsTab = enhance(PrinterGroupsTabInner);
