import { Model, Q, Query, tableSchema } from '@nozbe/watermelondb';
import { action, children, field, lazy, writer } from '@nozbe/watermelondb/decorators';
import { ASSOCIATION_TYPES } from './constants';
import { tableNames } from './tableNames';

import type { ModifierItem } from './ModifierItem';
import type { ModifierItemPrice } from './ModifierItemPrice';

type UpdateValues = {
  name: string;
  minItems: number;
  maxItems: number;
};

export class Modifier extends Model {
  static table = tableNames.modifiers;

  static associations = {
    item_modifiers: { type: ASSOCIATION_TYPES.HAS_MANY, foreignKey: 'modifier_id' },
    modifier_items: { type: ASSOCIATION_TYPES.HAS_MANY, foreignKey: 'modifier_id' },
    items: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'modifier_id' },
  };

  @field('name') name!: string;
  @field('min_items') minItems!: number;
  @field('max_items') maxItems!: number;

  @children('modifier_items') modifierItems!: Query<ModifierItem>;
  @children('item_modifiers') itemModifiers!: Query<ModifierItem>; // pivot table - items assigned to this printer

  @lazy modifierItemPrices = this.collections
    .get<ModifierItemPrice>(tableNames.modifierItemPrices)
    .query(Q.on(tableNames.modifierItems, 'modifier_id', this.id)) as Query<ModifierItemPrice>;

  @writer async updateItem(values: UpdateValues) {
    await this.update(record => Object.assign(record, values));
  }

  @writer async remove() {
    const [modifierItems, itemModifiers] = await Promise.all([this.modifierItems.fetch(), this.itemModifiers.fetch()]);
    const modifierItemsToDelete = modifierItems.map(modifierItem => modifierItem.prepareMarkAsDeleted());
    const itemModifiersToDelete = itemModifiers.map(itemModifier => itemModifier.prepareMarkAsDeleted());
    const toDelete = [...modifierItemsToDelete, ...itemModifiersToDelete, this.prepareMarkAsDeleted()];
    await this.database.batch(...toDelete);
  };
}

export const modifierSchema = tableSchema({
  name: tableNames.modifiers,
  columns: [
    { name: 'name', type: 'string' },
    { name: 'min_items', type: 'number' },
    { name: 'max_items', type: 'number' },
  ],
});
