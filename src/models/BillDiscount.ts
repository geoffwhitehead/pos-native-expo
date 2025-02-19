import { Model, Relation, tableSchema } from '@nozbe/watermelondb';
import { action, date, field, immutableRelation, nochange, readonly } from '@nozbe/watermelondb/decorators';
import { Bill } from './Bill';
import { Discount } from './Discount';
import { ASSOCIATION_TYPES } from './constants';

export const billDiscountSchema = tableSchema({
  name: 'bill_discounts',
  columns: [
    { name: 'bill_id', type: 'string', isIndexed: true },
    { name: 'discount_id', type: 'string' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'closing_amount', type: 'number' },
  ],
});

export class BillDiscount extends Model {
  static table = 'bill_discounts';

  @nochange @field('bill_id') billId!: string;
  @nochange @field('discount_id') discountId!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  /**
   * Not ideal - prefer amount to be always be generated based on the bill items but its more performant this way for reporting.
   */
  @field('closing_amount') closingAmount!: number;

  @immutableRelation('bills', 'bill_id') bill!: Relation<Bill>;
  @immutableRelation('discounts', 'discount_id') discount!: Relation<Discount>;

  static associations = {
    bills: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'bill_id' },
    discounts: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'discount_id' },
  };

  @action async void() {
    await this.destroyPermanently();
  }

  /**
   * for reporting purposes: on close record the final discount amount.
   * If this isn't done its quite a lot of work to recalcuate discounts
   * when working large amounts of bills in reports
   */
  @action async finalize(amt: number) {
    await this.update(billDiscount => {
      billDiscount.closingAmount = amt;
    });
  }
}
