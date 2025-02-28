import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Loading } from '../../components/Loading/Loading';
import { SidebarHeader } from '../../components/SidebarHeader/SidebarHeader';
import { Container, Icon, Label, ListItem, Picker, Tab, Tabs, Text } from '../../core';
import type { Category } from '../../models';
import type { SidebarDrawerStackParamList } from '../../navigators/SidebarNavigator';
import { CategoriesTab } from './Tabs/CategoriesTab/CategoriesTab';
import { ItemsTab } from './Tabs/ItemsTab/ItemsTab';
import { ModifiersTab } from './Tabs/ModifiersTab/ModifiersTab';
import { PriceGroupsTab } from './Tabs/PriceGroupsTab/PriceGroupsTab';
import { tableNames } from '../../models/tableNames';

interface ItemsOuterProps {
  navigation: DrawerNavigationProp<SidebarDrawerStackParamList, 'Items'>;
  database: Database;
}

interface ItemsInnerProps {
  categories: Category[];
}

const ItemsInner: React.FC<ItemsInnerProps & ItemsOuterProps> = ({ navigation, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0] || null);

  if (!categories) {
    return <Loading />;
  }

  return (
    <Container>
      <SidebarHeader title="Items" onOpen={() => navigation.openDrawer()} />
      <Tabs tabBarUnderlineStyle={styles.tabBarUnderline}>
        <Tab heading="Items" tabStyle={styles.tab} textStyle={styles.tabText} activeTabStyle={styles.activeTab} activeTextStyle={styles.activeTabText}>
          <ListItem itemDivider style={styles.categoryPickerItem}>
            <Label>
              <Text style={styles.categoryPickerText}>Category: </Text>
            </Label>
            <Picker
              mode="dropdown"
              iosHeader="Select a category"
              iosIcon={<Icon name="chevron-down-outline" color="white" size={24} />}
              placeholder="Select a category"
              selectedValue={selectedCategory}
              onValueChange={c => setSelectedCategory(c)}
              textStyle={{
                paddingLeft: 0,
                paddingRight: 0,
              }}
            >
              {categories.map(category => {
                return <Picker.Item key={category.id} label={category.name} value={category} />;
              })}
            </Picker>
          </ListItem>
          {selectedCategory && <ItemsTab category={selectedCategory} />}
          {!selectedCategory && <Text>Select a category to show items...</Text>}
        </Tab>
        <Tab heading="Categories" tabStyle={styles.tab} textStyle={styles.tabText} activeTabStyle={styles.activeTab} activeTextStyle={styles.activeTabText}>
          <CategoriesTab />
        </Tab>
        <Tab heading="Modifiers" tabStyle={styles.tab} textStyle={styles.tabText} activeTabStyle={styles.activeTab} activeTextStyle={styles.activeTabText}>
          <ModifiersTab />
        </Tab>
        <Tab heading="Prices" tabStyle={styles.tab} textStyle={styles.tabText} activeTabStyle={styles.activeTab} activeTextStyle={styles.activeTabText}>
          <PriceGroupsTab />
        </Tab>
      </Tabs>
    </Container>
  );
};

const styles = StyleSheet.create({
  categoryPickerItem: { paddingLeft: 15 },
  categoryPickerText: { color: 'grey' },
  tab: {
    backgroundColor: '#f8f9fa'
  },
  tabText: {
    color: '#6c757d'
  },
  activeTab: {
    backgroundColor: '#fff'
  },
  activeTabText: {
    color: '#000'
  },
  tabBarUnderline: {
    backgroundColor: '#007bff'
  }
});

export const Items = withDatabase(
  withObservables<ItemsOuterProps, ItemsInnerProps>([], ({ database }) => ({
    categories: database.collections
      .get<Category>(tableNames.categories)
      .query()
      .observeWithColumns(['name']),
  }))(ItemsInner),
);
