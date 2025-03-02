import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { groupBy, times } from 'lodash';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Modal } from '../../../../components/Modal/Modal';
import { SearchHeader } from '../../../../components/SearchHeader/SearchHeader';
import { ItemsContext } from '../../../../contexts/ItemsContext';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { PriceGroupContext } from '../../../../contexts/PriceGroupContext';
import { Box, Button, Container, Divider, HStack, Icon, Text, VStack } from '../../../../core';
import type { Category, PriceGroup } from '../../../../models';
import { CategoryViewTypeEnum } from '../../../../models/Organization';
import type { CheckoutItemStackParamList } from '../../../../navigators/CheckoutItemNavigator';
import { fontSizes } from '../../../../theme';
import { GRID_SPACING } from '../../../../utils/consts';
import { EditDisplayModal } from './sub-components/EditDisplayModal/EditDisplayModal';

interface CategoriesInnerProps {
  categories: Category[];
}

interface CategoriesOuterProps {
  database: Database;
  route: RouteProp<CheckoutItemStackParamList, 'CategoryList'>;
  navigation: StackNavigationProp<CheckoutItemStackParamList, 'CategoryList'>;
}

export const CategoriesInner: React.FC<CategoriesOuterProps & CategoriesInnerProps> = ({ navigation, categories }) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const { priceGroup } = useContext(PriceGroupContext);
  const { organization } = useContext(OrganizationContext);
  const { groupedSortedItems, setCategoryItems } = useContext(ItemsContext);
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const [selectedPositionIndex, setSelectedPositionIndex] = useState<number>();

  const onPressCategoryFactory = (params: { category: Category; priceGroup: PriceGroup }) => () => {
    const { category, priceGroup } = params;
    if (isEditing) {
      setSelectedCategory(category);
      setSelectedPositionIndex(category.positionIndex);
      setModalOpen(true);
    } else {
      setCategoryItems(groupedSortedItems[category.id]);
      navigation.navigate('CategoryItemsList', {
        priceGroupId: priceGroup.id,
      });
    }
  };

  const onCloseHandler = () => {
    setModalOpen(false);
    setSelectedCategory(null);
    setSelectedPositionIndex(null);
  };

  const handleEmptyPosition = (index: number) => {
    setModalOpen(true);
    setSelectedPositionIndex(index);
  };

  const onSearchHandler = (value: string) => setSearchValue(value);

  const searchFilter = (category: Category, searchValue: string) =>
    category.name.toLowerCase().includes(searchValue.toLowerCase());

  const isListView = organization.categoryViewType === CategoryViewTypeEnum.list;
  const isGridView = organization.categoryViewType === CategoryViewTypeEnum.grid;

  const gridSize = organization.categoryGridSize;

  const searchedCategories = categories.filter(category => searchFilter(category, searchValue));

  const groupedCategoriesByPosition = groupBy(searchedCategories, category => category.positionIndex);

  const handleSetEditing = () => {
    setIsEditing(!isEditing);
  };
  return (
    <Container>
      <SearchHeader onChangeText={onSearchHandler} value={searchValue} showPriceGroup />
      <HStack style={styles.itemHeader}>
        <Text style={{ fontWeight: 'bold' }}>Categories</Text>
        {isGridView && (
          <Button
            style={styles.editButton}
            colorScheme={isEditing ? 'success' : 'info'}
            size="sm"
            onPress={handleSetEditing}
            leftIcon={isEditing ? <Icon name="checkmark" size={20} color="white" /> : <Icon name="build-outline" size={20} color="white" />}
          />
        )}
      </HStack>
      <Divider/>

      {isListView && (
        <ScrollView>
          <VStack>
            {searchedCategories.map(category => {
              return (
                <HStack key={category.id} onTouchEnd={() => onPressCategoryFactory({ category, priceGroup })}>
                  <HStack flex={1} alignItems="center" justifyContent="space-between">
                    <HStack flex={1}>
                      <Text>{category.name}</Text>
                    </HStack>
                  </HStack>
                </HStack>
              );
            })}
          </VStack>
        </ScrollView>
      )}

      {isGridView && (
        <VStack style={styles.grid}>
          {times(gridSize, row => {
            return (
              <HStack key={row} style={styles.row}>
                {times(gridSize, column => {
                  const position = gridSize * row + column;
                  const group = groupedCategoriesByPosition[position];
                  const category = group && group[0];
                  return (
                    <Box key={`${row}-${column}`} style={styles.col}>
                      {category && (
                        <Button
                          style={{ ...styles.button, backgroundColor: category.backgroundColor }}
                          colorScheme="info"
                          onPress={onPressCategoryFactory({ priceGroup, category })}
                        >
                          <Text
                            style={{
                              ...styles.buttonText,
                              fontSize: gridSize > 4 ? fontSizes[4] : fontSizes[5],
                              color: category.textColor,
                            }}
                          >
                            {category.name}
                          </Text>
                        </Button>
                      )}
                      {isEditing && !category && (
                        <Button
                          style={{ ...styles.button, backgroundColor: 'lightgrey' }}
                          colorScheme="info"
                          onPress={() => handleEmptyPosition(position)}
                        >
                          <Text
                            style={{
                              ...styles.buttonText,
                              fontSize: gridSize > 4 ? fontSizes[4] : fontSizes[5],
                            }}
                          ></Text>
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </HStack>
            );
          })}
        </VStack>
      )}
      <Modal isOpen={modalOpen} onClose={onCloseHandler}>
        <EditDisplayModal
          selectedCategory={selectedCategory}
          onClose={onCloseHandler}
          categories={categories}
          selectedPositionIndex={selectedPositionIndex}
        />
      </Modal>
    </Container>
  );
};

export const Categories = withDatabase<any>(
  withObservables<CategoriesOuterProps, CategoriesInnerProps>([], ({ database }) => ({
    categories: database.collections
      .get('categories')
      .query()
      .observeWithColumns(['position_index', 'backgroundColor', 'textColor']),
  }))(CategoriesInner),
);

const styles = StyleSheet.create({
  grid: {
    padding: GRID_SPACING,
    height: '100%',
    width: '100%',
  },
  row: {
    paddingTop: GRID_SPACING,
    paddingBottom: GRID_SPACING,
  },
  col: {
    paddingLeft: GRID_SPACING,
    paddingRight: GRID_SPACING,
  },
  button: {
    height: '100%',
    width: '100%',

    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 4,
    shadowColor: 'whitesmoke',
    shadowOpacity: 0.8,
    shadowRadius: 2,
    shadowOffset: {
      height: 2,
      width: 4,
    },
  },
  buttonText: {
    width: '100%',
    textAlign: 'center',

    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  itemHeader: { justifyContent: 'space-between' },
  editButton: { alignSelf: 'center', marginRight: 5 },
});
