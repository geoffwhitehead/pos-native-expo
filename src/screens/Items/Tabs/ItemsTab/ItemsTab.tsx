import withObservables from '@nozbe/with-observables';
import React, { useState } from 'react';
import { Modal } from '../../../../components/Modal/Modal';
import { SearchBar } from '../../../../components/SearchBar/SearchBar';
import { Container, Box, Text, VStack } from '../../../../core';
import type { Category, Item, Modifier, PrinterGroup } from '../../../../models';
import { ItemsTabRow } from './ItemsTabRow';
import { ItemDetails } from './ModalItemDetails';


interface ItemsTabOuterProps {
  category: Category;
}

interface ItemsTabInnerProps {
  items: Item[];
  printerGroups: PrinterGroup[];
  modifiers: Modifier[];
}

const ItemsTabInner: React.FC<ItemsTabOuterProps & ItemsTabInnerProps> = ({ items, category }) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item>();

  const searchFilter = (item: Item, searchValue: string) => item.name.toLowerCase().includes(searchValue.toLowerCase());

  const onCloseHandler = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const onSelectItem = async (item: Item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  return (
    <Container>
      <SearchBar
        value={searchValue}
        onPressCreate={() => setModalOpen(true)}
        onSearch={value => setSearchValue(value)}
      />
      <VStack>
        {items
          .filter(item => searchFilter(item, searchValue))
          .map((item, index) => {
            return (
              <ItemsTabRow
                index={index}
                key={item.id}
                item={item}
                isActive={selectedItem === item}
                onPressItem={onSelectItem}
                title={item.name}
              />
            );
          })}
      </VStack>

      <Box>
        <Text style={{ padding: 5 }} sub>{`${items.length} Items`}</Text>
      </Box>
      <Modal isOpen={modalOpen} onClose={onCloseHandler}>
        <ItemDetails item={selectedItem} category={category} onClose={onCloseHandler} />
      </Modal>
    </Container>
  );
};

export const ItemsTab = withObservables<ItemsTabOuterProps, ItemsTabInnerProps>(['category'], ({ category }) => ({
  items: category.items,
}))(ItemsTabInner);
