import { Model, Relation, tableSchema } from '@nozbe/watermelondb';
import { date, field, immutableRelation, nochange, readonly, writer } from '@nozbe/watermelondb/decorators';
import type { Bill } from './Bill';
import type { PaymentType } from './PaymentType';
import { ASSOCIATION_TYPES } from './constants';
import { tableNames } from './tableNames';

export const billPaymentSchema = tableSchema({
  name: 'bill_payments',
  columns: [
    { name: 'payment_type_id', type: 'string' },
    { name: 'bill_id', type: 'string', isIndexed: true },
    { name: 'amount', type: 'number' },
    { name: 'is_change', type: 'boolean' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'is_voided', type: 'boolean' },
  ],
});

export class BillPayment extends Model {
  static table = 'bill_payments';

  @nochange @field('payment_type_id') paymentTypeId!: string;
  @nochange @field('amount') amount!: number;
  @nochange @field('is_change') isChange!: boolean; // TODO: rethink this - update to credit / debit?
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  static associations = {
    bills: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'bill_id' },
    payment_types: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'payment_type_id' },
  };

  @immutableRelation(tableNames.paymentTypes, 'payment_type_id') paymentType!: Relation<PaymentType>;
  @immutableRelation(tableNames.bills, 'bill_id') bill!: Relation<Bill>;

  @writer async void() {
    await this.destroyPermanently();
  }
}
