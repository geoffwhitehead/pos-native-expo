import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import React, { useContext, useState } from 'react';
import { ScrollView } from 'react-native';
import { ConfirmationActionsheet } from '../../../../components/ConfirmationActionsheet/ConfirmationActionsheet';
import { Loading } from '../../../../components/Loading/Loading';
import { Modal } from '../../../../components/Modal/Modal';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { Button, Container, Divider, HStack, Icon, Text, useDisclose, VStack } from '../../../../core';
import type { PrinterGroup } from '../../../../models';
import { ModalPrinterGroupDetails } from './ModalPrinterGroupDetails';
import { PrinterGroupRow } from './PrinterGroupRow';
import { tableNames } from '../../../../models/tableNames';

interface PrinterGroupsTabOuterProps {
  database: Database;
}

interface PrinterGroupsTabInnerProps {
  printerGroups: PrinterGroup[];
}

const PrinterGroupsTabInner: React.FC<PrinterGroupsTabOuterProps & PrinterGroupsTabInnerProps> = ({
  printerGroups,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrinterGroup, setSelectedPrinterGroup] = useState<PrinterGroup>();
  const { isOpen, onOpen, onClose } = useDisclose();
  const [printerGroupToDelete, setPrinterGroupToDelete] = useState<PrinterGroup | null>(null);

  const onDelete = async (printerGroup: PrinterGroup) => {
    await printerGroup.remove();
    onClose();
  };

  const onCancelHandler = () => {
    setSelectedPrinterGroup(null);
    setIsModalOpen(false);
  };


  if (!printerGroups) {
    return <Loading />;
  }
  return (
    <Container>
      <VStack>
        <HStack flex={1} alignItems="center" justifyContent="space-between">
          <Text>Printer Groups</Text>
          <HStack justifyContent="flex-end">
            <Button leftIcon={<Icon name="add-circle-outline" size={24} color="white"/>} colorScheme="success" size="sm" onPress={() => setIsModalOpen(true)}>
              Create
            </Button>
          </HStack>
        </HStack>
        <Divider/>
        <ScrollView>
          {printerGroups.map(printerGroup => (
            <PrinterGroupRow
              key={printerGroup.id}
              isSelected={printerGroup === selectedPrinterGroup}
              printerGroup={printerGroup}
              onSelect={() => {
                setSelectedPrinterGroup(printerGroup);
                setIsModalOpen(true);
              }}
              onDelete={() => {
                setPrinterGroupToDelete(printerGroup);
                onOpen();
              }}
            />
          ))}
        </ScrollView>
      </VStack>

      <Modal isOpen={isModalOpen} onClose={onCancelHandler} style={{ maxWidth: 800 }}>
        <ModalPrinterGroupDetails printerGroup={selectedPrinterGroup} onClose={onCancelHandler} />
      </Modal>

      <ConfirmationActionsheet
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => printerGroupToDelete && onDelete(printerGroupToDelete)}
        message="This will permanently remove this printer group and remove this group from any items its assigned to. Are you sure?"
      />
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
