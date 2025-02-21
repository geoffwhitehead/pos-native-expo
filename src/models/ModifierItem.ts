import { Model, Query, Relation, tableSchema } from '@nozbe/watermelondb';
import { action, children, field, relation } from '@nozbe/watermelondb/decorators';
import { ASSOCIATION_TYPES } from './constants';
import { tableNames } from './tableNames';

import type { Modifier } from './Modifier';
import type { ModifierItemPrice } from './ModifierItemPrice';

type UpdateItemAndPricesValues = {
  name: string;
  shortName: string;
  prices: { modifierItemPrice: ModifierItemPrice; price: number }[];
};

export class ModifierItem extends Model {
  static table = tableNames.modifierItems;

  static associations = {
    modifier_item_prices: { type: ASSOCIATION_TYPES.HAS_MANY, foreignKey: 'modifier_item_id' },
    modifiers: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'modifier_id' },
  };

  @field('name') name!: string;
  @field('short_name') shortName!: string;
  @field('modifier_id') modifierId!: string;

  @relation('modifiers', 'modifier_id') modifier!: Relation<Modifier>;

  @children('modifier_item_prices') prices!: Query<ModifierItemPrice>;

  @action async updateItem(values: UpdateItemAndPricesValues) {
    await this.update(record => Object.assign(record, values));
  };

  @action async updateItemAndPrices(values: UpdateItemAndPricesValues) {
    const { name, prices, shortName } = values;
    const modifierItemToUpdate = this.prepareUpdate(record => Object.assign(record, { name, shortName }));

    const modifierItemPricesToUpdate = prices.map(({ modifierItemPrice, price }) =>
      modifierItemPrice.prepareUpdate(record => Object.assign(record, { price })),
    );

    const batched = [modifierItemToUpdate, ...modifierItemPricesToUpdate];

    await this.database.batch(...batched);
  };
}

export const modifierItemSchema = tableSchema({
  name: 'modifier_items',
  columns: [
    { name: 'modifier_id', type: 'string', isIndexed: true },
    { name: 'name', type: 'string' },
    { name: 'short_name', type: 'string' },
  ],
});