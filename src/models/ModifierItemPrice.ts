import { Model, Relation, tableSchema } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import type { ModifierItem } from './ModifierItem';
import type { PriceGroup } from './PriceGroup';
import { ASSOCIATION_TYPES } from './constants';
import { tableNames } from './tableNames';

// Forward declare types to avoid circular dependencies

export class ModifierItemPrice extends Model {
  static table = tableNames.modifierItemPrices;

  static associations = {
    modifier_items: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'modifier_item_id' },
    price_groups: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'price_group_id' },
  };

  @field('price') price?: number;
  @field('price_group_id') priceGroupId!: string;
  @field('modifier_item_id') modifierItemId!: string;

  @relation('price_groups', 'price_group_id') priceGroup!: Relation<PriceGroup>;
  @relation('modifier_items', 'modifier_item_id') modifierItem!: Relation<ModifierItem>;
}

export const modifierItemPriceSchema = tableSchema({
  name: tableNames.modifierItemPrices,
  columns: [
    { name: 'price', type: 'number', isOptional: true }, // null field indicates this item is not available in this price group
    { name: 'price_group_id', type: 'string' },
    { name: 'modifier_item_id', type: 'string', isIndexed: true },
  ],
});
