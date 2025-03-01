import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { keyBy } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Modal } from '../../../../components/Modal/Modal';
import { SearchBar } from '../../../../components/SearchBar/SearchBar';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { Box, Container, FormControl, Icon, Picker, Text, VStack } from '../../../../core';
import type { Category, PrintCategory } from '../../../../models';
import { MAX_GRID_SIZE } from '../../../../utils/consts';
import { moderateScale } from '../../../../utils/scaling';
import { CategoryRow } from './CategoryRow';
import { ModalCategoryDetails } from './ModalCategoryDetails';
import { tableNames } from '../../../../models/tableNames';

interface CategoriesTabOuterProps {
  database: Database;
}

interface CategoriesTabInnerProps {
  categories: Category[];
  printCategories: PrintCategory[];
}

const CategoriesTabInner: React.FC<CategoriesTabOuterProps & CategoriesTabInnerProps> = ({
  database,
  categories,
  printCategories,
}) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const { organization } = useContext(OrganizationContext);

  const searchFilter = (category: Category, searchValue: string) =>
    category.name.toLowerCase().includes(searchValue.toLowerCase());

  const onCloseHandler = () => {
    setModalOpen(false);
    setSelectedCategory(null);
  };

  const onSelectCategory = async (category: Category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const onPressCreate = () => setModalOpen(true);

  const handleUpdateGridSize = async (size: number) => organization.updateOrganization({ categoryGridSize: size });

  const keyedPrintCategories = useMemo(() => keyBy(printCategories, ({ id }) => id), [printCategories]);
  const minGridSize = categories.length ? Math.ceil(Math.sqrt(categories.length)) : 3;
  const maxCategories = Math.pow(organization.categoryGridSize, 2);
  const options = [...Array(MAX_GRID_SIZE - minGridSize + 1)].map((_, i) => {
    const size = i + minGridSize;
    return {
      label: `${size} x ${size} Grid`,
      value: size,
    };
  });

  return (
    <Container>
      <SearchBar
        value={searchValue}
        onPressCreate={onPressCreate}
        onSearch={value => setSearchValue(value)}
        isCreateDisabled={categories.length === maxCategories}
      >
        <FormControl.Label>
          <Text style={{ color: 'grey' }}>Category Grid Size: </Text>
        </FormControl.Label>
        <Picker
          mode="dropdown"
          iosHeader="Select a grid size"
          iosIcon={<Icon name="chevron-down-outline"  color="white" size={24} />}
          placeholder="Select a grid size"
          selectedValue={organization.categoryGridSize}
          onValueChange={handleUpdateGridSize}
          textStyle={{
            paddingLeft: 0,
            paddingRight: 0,
          }}
        >
          {options.map(({ label, value }) => {
            return <Picker.Item key={value} label={label} value={value} />;
          })}
        </Picker>
      </SearchBar>
      <ScrollView>
        <VStack>
          {categories
            .filter(category => searchFilter(category, searchValue))
            .map((category, index) => {
              return (
                <CategoryRow
                  key={category.id}
                  index={index}
                  category={category}
                  onSelect={onSelectCategory}
                  printCategory={keyedPrintCategories[category.printCategoryId]}
                />
              );
            })}
        </VStack>
      </ScrollView>
      <Box>
        <Text
          note
          style={{ color: categories.length === maxCategories ? 'red' : 'grey' }}
        >{`Categories: ${categories.length} / ${maxCategories}`}</Text>
      </Box>
      <Modal isOpen={modalOpen} onClose={onCloseHandler}>
        <ModalCategoryDetails printCategories={printCategories} category={selectedCategory} onClose={onCloseHandler} />
      </Modal>
    </Container>
  );
};

export const CategoriesTab = withDatabase(
  withObservables<CategoriesTabOuterProps, CategoriesTabInnerProps>([], ({ database }) => ({
    categories: database.collections.get<Category>(tableNames.categories).query(),
    printCategories: database.collections.get<PrintCategory>(tableNames.printCategories).query(),
  }))(CategoriesTabInner),
);

const styles = StyleSheet.create({
  modal: {
    width: moderateScale(500),
    height: moderateScale(500),
  },
});
