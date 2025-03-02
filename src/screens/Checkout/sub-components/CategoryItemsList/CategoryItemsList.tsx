import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { Dictionary } from 'lodash';
import React, { memo, useContext, useEffect, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { Modal } from '../../../../components/Modal/Modal';
import { SearchHeader } from '../../../../components/SearchHeader/SearchHeader';
import { CurrentBillContext } from '../../../../contexts/CurrentBillContext';
import { ItemPricesContext } from '../../../../contexts/ItemPricesContext';
import { ItemsContext } from '../../../../contexts/ItemsContext';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { Button, HStack, Text, View, VStack } from '../../../../core';
import type { Item, ItemPrice, Modifier, PriceGroup } from '../../../../models';
import { ItemListViewType } from '../../../../models/Organization';
import type { CheckoutItemStackParamList } from '../../../../navigators/CheckoutItemNavigator';
import { CategoryItemRow } from './sub-components/CategoryItemRow';
import { ModifierList } from './sub-components/ModifierList/ModifierList';
import { tableNames } from '../../../../models/tableNames';

interface CategoryItemsListOuterProps {
  database: Database;
  modifiers: Modifier[];
  route: RouteProp<CheckoutItemStackParamList, 'CategoryItemsList'>;
  navigation: StackNavigationProp<CheckoutItemStackParamList, 'CategoryItemsList'>;
  priceGroupId: PriceGroup;
  categoryItems: Dictionary<Item[]>;
}

interface CategoryItemsListInnerProps {
  items: Item[];
  prices: ItemPrice[];
  priceGroup: PriceGroup;
}

const CategoryItemsInner: React.FC<CategoryItemsListOuterProps & CategoryItemsListInnerProps> = ({
  navigation,
  priceGroup,
  database,
}) => {
  const { groupedItemPrices } = useContext(ItemPricesContext);
  const { categoryItems } = useContext(ItemsContext);

  const [selectableItems, setSelectableItems] = useState<Dictionary<Item[]>>({});
  const [searchValue, setSearchValue] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item>();
  const [itemsToDisplay, setItemsToDisplay] = useState<Dictionary<Item[]>>({});

  const {
    organization: { currency, itemListViewType },
  } = useContext(OrganizationContext);
  const { currentBill } = useContext(CurrentBillContext);

  const goBack = () => navigation.goBack();

  const searchFilter = (stringToSearch: string, searchValue: string) =>
    stringToSearch.toLowerCase().includes(searchValue.toLowerCase());

  const onSearchHandler = (value: string) => setSearchValue(value);
  const onCancelHandler = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const onSelectItem = async (item: Item, modifierCount: number) => {
    if (modifierCount > 0) {
      setSelectedItem(item);
      setModalOpen(true);
    } else {
      await currentBill.addItems({ item, priceGroup, quantity: 1, selectedModifiers: [] });
    }
  };

  useEffect(() => {
    const filteredItemsNoPriceSet = Object.entries(categoryItems).reduce((acc, [key, items]) => {
      /**
       * Items with null prices indicate the item isn't intended to be selected in this price group.
       * I'ts more performant to do all the querying and sorting in the context but due to that its required to
       * do a lookup to see if this item has a price set. Rather than querying watermelon directly.
       */
      const filteredItems = items.filter(item => !!groupedItemPrices?.[priceGroup.id]?.[item.id]);
      const isEmptyGroup = filteredItems.length === 0;

      if (isEmptyGroup) {
        return acc;
      }

      return {
        ...acc,
        [key]: filteredItems,
      };
    }, {});

    setSelectableItems(filteredItemsNoPriceSet);
  }, [groupedItemPrices, categoryItems, priceGroup]);

  useEffect(() => {
    if (!searchValue || searchValue.length === 0) {
      return setItemsToDisplay(selectableItems);
    }

    const filteredItems = Object.entries(selectableItems).reduce((acc, [firstLetter, items]) => {
      return {
        ...acc,
        [firstLetter]: items.filter(item => {
          return searchFilter(item.name, searchValue);
        }),
      };
    }, {});
    setItemsToDisplay(filteredItems);
  }, [selectableItems, searchValue]);

  const isListType = itemListViewType === ItemListViewType.list || itemListViewType === ItemListViewType.listWithHeader;

  return (
    <>
      <HStack flex={1} alignItems="center" justifyContent="flex-start">
        <Button colorScheme="info" size="sm" variant='outline' onPress={goBack}>
          <Text style={{ fontWeight: 'bold' }}>Back</Text>
        </Button>
      </HStack>
      <SearchHeader onChangeText={onSearchHandler} value={searchValue} />
      <ScrollView>
        {isListType && (
          <VStack>
            {Object.entries(itemsToDisplay).map(([key, items]) => {
              if (items.length === 0) {
                return null;
              }

              return (
                <View key={`${key}-divider`}>
                  {itemListViewType === ItemListViewType.listWithHeader && (
                    <HStack flex={1} alignItems="center" justifyContent="space-between" style={{ backgroundColor: 'lightgrey' }}>
                      <Text>{key}</Text>
                    </HStack>
                )}
                  {items.map(item => {
                    const itemPrice = groupedItemPrices[priceGroup.id][item.id];
                    return (
                      <CategoryItemRow
                        key={item.id}
                        item={item}
                        itemPrice={itemPrice}
                        isActive={selectedItem === item}
                        onPressItem={onSelectItem}
                        currency={currency}
                      />
                    );
                  })}
                </View>
              );
            })}
          </VStack>
        )}
      </ScrollView>
      <Modal onClose={onCancelHandler} isOpen={modalOpen}>
        <ModifierList priceGroup={priceGroup} currentBill={currentBill} onClose={onCancelHandler} item={selectedItem} />
      </Modal>
    </>
  );
};

const MemoCategoryItemsInner = memo(CategoryItemsInner);

export const CategoryItems = withDatabase(
  withObservables<CategoryItemsListOuterProps, CategoryItemsListInnerProps>(['route'], ({ route, database }) => {
    const { priceGroupId } = route.params as CheckoutItemStackParamList['CategoryItemsList'];
    return {
      priceGroup: database.collections.get<PriceGroup>(tableNames.priceGroups).findAndObserve(priceGroupId),
    };
  })(MemoCategoryItemsInner),
);
