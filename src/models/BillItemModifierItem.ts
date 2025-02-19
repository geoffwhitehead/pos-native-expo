import { Model, Relation, tableSchema } from '@nozbe/watermelondb';
import { action, field, immutableRelation, nochange } from '@nozbe/watermelondb/decorators';
import { BillItem } from './BillItem';
import { BillItemModifier } from './BillItemModifier';
import { Modifier } from './Modifier';
import { ModifierItem } from './ModifierItem';
import { PriceGroup } from './PriceGroup';
import { ASSOCIATION_TYPES } from './constants';

export const billItemModifierItemSchema = tableSchema({
  name: 'bill_item_modifier_items',
  columns: [
    { name: 'bill_item_id', type: 'string', isIndexed: true },
    { name: 'bill_item_modifier_id', type: 'string' },
    { name: 'modifier_id', type: 'string' },
    { name: 'modifier_name', type: 'string' },
    { name: 'modifier_item_id', type: 'string' },
    { name: 'modifier_item_name', type: 'string' },
    { name: 'modifier_item_short_name', type: 'string' },
    { name: 'modifier_item_price', type: 'number' },
    { name: 'price_group_name', type: 'string' },
    { name: 'price_group_id', type: 'string' },
    { name: 'is_voided', type: 'boolean' },
    { name: 'is_comp', type: 'boolean' },
  ],
});

export class BillItemModifierItem extends Model {
  static table = 'bill_item_modifier_items';

  @nochange @field('bill_item_id') billItemId!: string;
  @nochange @field('bill_item_modifier_id') billItemModifierId!: string;
  @nochange @field('modifier_id') modifierId!: string;
  @nochange @field('modifier_name') modifierName!: string;
  @nochange @field('modifier_item_id') modifierItemId!: string;
  @nochange @field('modifier_item_price') modifierItemPrice!: number;
  @nochange @field('modifier_item_name') modifierItemName!: string;
  @nochange @field('modifier_item_short_name') modifierItemShortName!: string;
  @nochange @field('price_group_name') priceGroupName!: string;
  @nochange @field('price_group_id') priceGroupId!: string;
  @field('is_voided') isVoided!: boolean;
  @field('is_comp') isComp!: boolean;

  @immutableRelation('bill_items', 'bill_item_id') billItem!: Relation<BillItem>;
  @immutableRelation('modifier_items', 'modifier_item_id') modifierItem!: Relation<ModifierItem>;
  @immutableRelation('bill_item_modifiers', 'bill_item_modifier_id') billItemModifier!: Relation<BillItemModifier>;
  @immutableRelation('price_groups', 'price_group_id') priceGroup!: Relation<PriceGroup>;
  @immutableRelation('modifiers', 'modifier_id') modifier!: Relation<Modifier>;

  static associations = {
    bill_items: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'bill_item_id' },
    modifier_items: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'modifier_item_id' },
    bill_item_modifiers: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'bill_item_modifier_id' },
    modifiers: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'modifier_id' },
  };

  @action async void() {
    await this.update(billItemModifierItem => {
      billItemModifierItem.isVoided = true;
    });
  }
}
