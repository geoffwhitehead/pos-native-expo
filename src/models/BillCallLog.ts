import { Model, Relation, tableSchema } from '@nozbe/watermelondb';
import { date, field, immutableRelation, nochange, readonly, writer } from '@nozbe/watermelondb/decorators';
import type { Bill } from './Bill';
import { ASSOCIATION_TYPES } from './constants';

export const billCallLogSchema = tableSchema({
  name: 'bill_call_logs',
  columns: [
    { name: 'bill_id', type: 'string', isIndexed: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'print_message', type: 'string', isOptional: true },
  ],
});

export class BillCallLog extends Model {
  static table = 'bill_call_logs';

  @nochange @field('bill_id') billId!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('print_message') printMessage?: string;

  @immutableRelation('bills', 'bill_id') bill!: Relation<Bill>;

  static associations = {
    bills: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'bill_id' },
    bill_call_print_logs: { type: ASSOCIATION_TYPES.HAS_MANY, foreignKey: 'bill_call_log_id' },
  };

 @writer async void() {
   await this.destroyPermanently();
 }
}
