import type { Dictionary } from 'lodash';
import React from 'react';
import type { Item } from '../models';

// categoryid => firstChar => array of items
export type GroupedSortedItems = Dictionary<CategoryItems>;
export type CategoryItems = Dictionary<Item[]>;
type ItemsContextProps = {
  setGroupedSortedItems: (groupedSortedItems: GroupedSortedItems) => void;
  groupedSortedItems: GroupedSortedItems;
  categoryItems: CategoryItems;
  setCategoryItems: (categoryItems: CategoryItems) => void;
};

export const ItemsContext = React.createContext<ItemsContextProps>({
  setGroupedSortedItems: null as any,
  groupedSortedItems: {},
  categoryItems: {},
  setCategoryItems: null as any,
});
