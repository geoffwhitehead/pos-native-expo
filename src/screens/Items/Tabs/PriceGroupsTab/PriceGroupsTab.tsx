import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { sortBy } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { Loading } from '../../../../components/Loading/Loading';
import { Modal } from '../../../../components/Modal/Modal';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { Button, Container, Divider, HStack, Icon, Text, useDisclose, VStack } from '../../../../core';
import { ConfirmationActionsheet } from '../../../../components/ConfirmationActionsheet/ConfirmationActionsheet';
import type { Category, Item, PriceGroup } from '../../../../models';
import { commonStyles } from '../../../Settings/Tabs/styles';
import { PriceGroupDetails } from './PriceGroupDetails';
import { PriceGroupItemsModal } from './PriceGroupItemsModal';
import { tableNames } from '../../../../models/tableNames';

interface PriceGroupsTabOuterProps {
  database: Database;
}

interface PriceGroupsTabInnerProps {
  priceGroups: PriceGroup[];
  items: Item[];
  categories: Category[];
}

const PriceGroupsTabInner: React.FC<PriceGroupsTabOuterProps & PriceGroupsTabInnerProps> = ({
  database,
  priceGroups,
  items,
  categories,
}) => {
  const [selectedPriceGroup, setSelectedPriceGroup] = useState<PriceGroup>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPricesModalOpen, setIsPricesModalOpen] = useState(false);
  const { organization } = useContext(OrganizationContext);
  const { isOpen, onOpen, onClose } = useDisclose();
  const [priceGroupToDelete, setPriceGroupToDelete] = useState<PriceGroup | null>(null);

  const onCancelHandler = () => {
    setSelectedPriceGroup(null);
    setIsModalOpen(false);
  };

  const onCancelPricesHandler = () => {
    setSelectedPriceGroup(null);
    setIsPricesModalOpen(false);
  };

  const onDelete = async (priceGroup: PriceGroup) => {
    await priceGroup.remove(organization);
    onClose();
  };

  const onSelect = priceGroup => {
    setSelectedPriceGroup(priceGroup);
    setIsModalOpen(true);
  };

  const onSelectPrices = priceGroup => {
    setSelectedPriceGroup(priceGroup);
    setIsPricesModalOpen(true);
  };

  const sortedItems = useMemo(() => {
    return sortBy(items, item => item.name.toLowerCase());
  }, [items]);

  if (!priceGroups) {
    return <Loading />;
  }

  return (
    <Container>
      <VStack>
          <HStack flex={1} alignItems="center" justifyContent="space-between">
            <Text>Price Groups</Text>
            <HStack justifyContent="flex-end">
              <Button colorScheme="success" size="sm" onPress={() => setIsModalOpen(true)} leftIcon={<Icon name="add-circle-outline" size={24} color="white" />}>
                Create
              </Button>
            </HStack>
          </HStack>
          <Divider/>  
        <ScrollView>
          {priceGroups.map(priceGroup => (
              <HStack flex={1} alignItems="center" justifyContent="space-between" key={priceGroup.id} onTouchEnd={() => setSelectedPriceGroup(priceGroup)} style={priceGroup === selectedPriceGroup ? commonStyles.selectedRow : {}}>
                <HStack flex={1}>
                  <Text>{priceGroup.name}</Text>
                </HStack>
                <HStack flex={1} justifyContent="flex-end">
                  <Button
                    style={{ marginRight: 10 }}
                    variant='outline'
                    colorScheme='info'
                    size='sm'
                    onPress={() => onSelectPrices(priceGroup)}
                  >
                    Bulk Edit Prices
                  </Button>
                  <Button
                    style={{ marginRight: 10 }}
                    variant="outline"
                    colorScheme='danger'
                    size="sm"
                    isDisabled={priceGroups.length === 1}
                    onPress={() => {
                      setPriceGroupToDelete(priceGroup);
                      onOpen();
                    }}
                  >
                    Delete
                  </Button>
                  <Button variant='outline' colorScheme='info' size='sm' onPress={() => onSelect(priceGroup)}>
                    Edit
                  </Button>
                </HStack>
              </HStack>
          ))}
        </ScrollView>
      </VStack>

      <Modal isOpen={isModalOpen} onClose={onCancelHandler}>
        <PriceGroupDetails priceGroup={selectedPriceGroup} onClose={onCancelHandler} />
      </Modal>

      <Modal isOpen={isPricesModalOpen} onClose={onCancelPricesHandler}>
        {selectedPriceGroup && (
          <PriceGroupItemsModal
            categories={categories}
            priceGroup={selectedPriceGroup}
            onClose={onCancelPricesHandler}
            sortedItems={sortedItems}
          />
        )}
      </Modal>

      <ConfirmationActionsheet
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => priceGroupToDelete && onDelete(priceGroupToDelete)}
        message="Permanently remove this price group and remove its prices for all items?"
      />
    </Container>
  );
};

const enhance = c =>
  withDatabase<any>(
    withObservables<PriceGroupsTabOuterProps, PriceGroupsTabInnerProps>([], ({ database }) => ({
      priceGroups: database.collections
        .get<PriceGroup>(tableNames.priceGroups)
        .query()
        .observeWithColumns(['name']),
      categories: database.collections
        .get<Category>(tableNames.categories)
        .query()
        .observeWithColumns(['name']),
      items: database.collections
        .get<Item>(tableNames.items)
        .query()
        .observeWithColumns(['name']),
    }))(c),
  );

export const PriceGroupsTab = enhance(PriceGroupsTabInner);
