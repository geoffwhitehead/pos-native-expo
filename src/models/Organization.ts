import { Model, Relation, tableSchema } from '@nozbe/watermelondb';
import { action, field, relation, writer } from '@nozbe/watermelondb/decorators';
import { ASSOCIATION_TYPES } from './constants';
import type { BillPeriod } from './BillPeriod';
import { tableNames } from './tableNames';
import type { Printer } from './Printer';
import type { PriceGroup } from './PriceGroup';

export type OrganizationProps = {
  name: string;
  email: string;
  phone: string;
  vat: string;
  addressLine1: string;
  addressLine2: string;
  addressCity: string;
  addressCounty: string;
  addressPostcode: string;
  defaultPriceGroupId: string;
  receiptPrinterId: string;
  currency: string;
  maxBills: number;
  lastPulledAt: number;
  currentBillPeriodId: string;
  categoryGridSize: number;
  gracePeriodMinutes: number;
  maxDiscounts: number;
  shortNameLength: number;
  billViewPlanGridSize: number;
  billViewType: string;
  accessPin: string;
  accessPinEnabled: boolean;
  printItemGrouping: string;
  itemListViewType: string;
};

export enum PrintItemGroupingEnum {
  printCategory = 'printCategory',
  category = 'category',
}

export enum CategoryViewTypeEnum {
  list = 'list',
  grid = 'grid',
}

export enum CurrencyEnum {
  gbp = 'gbp',
  usd = 'usd',
  eur = 'eur',
}

export enum BillViewTypeEnum {
  list = 'list',
  plan = 'plan',
}

export enum TransactionOrderEnum {
  descending = 'descending',
  ascending = 'ascending',
}

export enum TransactionGroupingEnum {
  grouped = 'grouped',
  ungrouped = 'ungrouped',
}

export enum ItemListViewType {
  listWithHeader = 'listWithHeader',
  list = 'list',
  // grid = 'grid', // TODO: WIP
}

export class Organization extends Model {
  static table = 'organizations';

  static associations = {
    price_groups: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'default_price_group_id' },
    printers: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'receipt_printer_id' },
    bill_periods: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'current_bill_period_id' },
  };

  @field('name') name!: string;
  @field('email') email!: string;
  @field('phone') phone!: string;
  @field('vat') vat!: string;
  @field('address_line1') addressLine1!: string;
  @field('address_line2') addressLine2!: string;
  @field('address_city') addressCity!: string;
  @field('address_county') addressCounty!: string;
  @field('address_postcode') addressPostcode!: string;
  @field('default_price_group_id') defaultPriceGroupId!: string;
  @field('receipt_printer_id') receiptPrinterId!: string;
  @field('currency') currency!: CurrencyEnum;
  @field('max_bills') maxBills!: number;
  @field('last_pulled_at') lastPulledAt!: string;
  @field('current_bill_period_id') currentBillPeriodId!: string;
  @field('short_name_length') shortNameLength!: number;
  @field('max_discounts') maxDiscounts!: number;
  @field('grace_period_minutes') gracePeriodMinutes!: number;
  @field('category_grid_size') categoryGridSize!: number;
  @field('category_view_type') categoryViewType!: CategoryViewTypeEnum;
  @field('bill_view_type') billViewType!: BillViewTypeEnum;
  @field('bill_view_plan_grid_size') billViewPlanGridSize!: number;
  @field('transaction_order') transactionOrder!: TransactionOrderEnum;
  @field('transaction_grouping') transactionGrouping!: TransactionGroupingEnum;
  @field('access_pin') accessPin!: string;
  @field('access_pin_enabled') accessPinEnabled!: boolean;
  @field('print_item_grouping') printItemGrouping!: PrintItemGroupingEnum;
  @field('item_list_view_type') itemListViewType!: ItemListViewType;

  @relation('price_groups', 'default_price_group_id') defaultPriceGroup!: Relation<PriceGroup>;
  @relation('printers', 'receipt_printer_id') receiptPrinter!: Relation<Printer>;
  @relation('bill_periods', 'current_bill_period_id') currentBillPeriod!: Relation<BillPeriod>;

  @writer async createNewBillPeriod() {
    const billPeriodsCollection = this.collections.get<BillPeriod>(tableNames.billPeriods);
    const billPeriod = await billPeriodsCollection.create(() => {});
    await this.update(organization => {
      organization.currentBillPeriod.set(billPeriod);
    });
    return billPeriod;
  }

  @writer async updateOrganization(values: Partial<Organization>) {
    await this.update(organization => {
      Object.assign(organization, values);
    });
  }
}

export const organizationSchema = tableSchema({
  name: 'organizations',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string' },
    { name: 'phone', type: 'string' },
    { name: 'vat', type: 'string' },
    { name: 'address_line1', type: 'string' },
    { name: 'address_line2', type: 'string' },
    { name: 'address_city', type: 'string' },
    { name: 'address_county', type: 'string' },
    { name: 'address_postcode', type: 'string' },
    { name: 'default_price_group_id', type: 'string' },
    { name: 'receipt_printer_id', type: 'string' },
    { name: 'currency', type: 'string' },
    { name: 'max_bills', type: 'number' },
    { name: 'last_pulled_at', type: 'string' },
    { name: 'current_bill_period_id', type: 'string' },
    { name: 'short_name_length', type: 'number' },
    { name: 'max_discounts', type: 'number' },
    { name: 'grace_period_minutes', type: 'number' },
    { name: 'category_grid_size', type: 'number' },
    { name: 'category_view_type', type: 'string' },
    { name: 'bill_view_plan_grid_size', type: 'number' },
    { name: 'bill_view_type', type: 'string' },
    { name: 'transaction_order', type: 'string' },
    { name: 'transaction_grouping', type: 'string' },
    { name: 'access_pin', type: 'string' },
    { name: 'access_pin_enabled', type: 'boolean' },
    { name: 'print_item_grouping', type: 'string' },
    { name: 'item_list_view_type', type: 'string' },
  ],
});
