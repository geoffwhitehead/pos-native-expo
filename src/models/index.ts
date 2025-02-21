import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '@nozbe/watermelondb';

import { BillCallLog, billCallLogSchema } from './BillCallLog';
import { BillCallPrintLog, billCallPrintLogSchema } from './BillCallPrintLog';
import { BillDiscount, billDiscountSchema } from './BillDiscount';
import { BillItem, billItemSchema } from './BillItem';
import { BillItemModifier, billItemModifierSchema } from './BillItemModifier';
import { BillItemModifierItem, billItemModifierItemSchema } from './BillItemModifierItem';
import { BillItemPrintLog, billItemPrintLogSchema } from './BillItemPrintLog';
import { BillPayment, billPaymentSchema } from './BillPayment';
import { BillPeriod, billPeriodSchema } from './BillPeriod';
import { Bill, billSchema } from './Bill';
import { Category, categorySchema } from './Category';
import { Discount, discountSchema } from './Discount';
import { Item, itemSchema } from './Item';
import { ItemModifier, itemModifierSchema } from './ItemModifier';
import { ItemPrice, itemPriceSchema } from './ItemPrice';
import { Modifier, modifierSchema } from './Modifier';
import { ModifierItem, modifierItemSchema } from './ModifierItem';
import { ModifierItemPrice, modifierItemPriceSchema } from './ModifierItemPrice';
import { Organization, organizationSchema } from './Organization';
import { PaymentType, paymentTypeSchema } from './PaymentType';
import { PriceGroup, priceGroupSchema } from './PriceGroup';
import { PrintCategory, printCategorySchema } from './PrintCategory';
import { PrinterGroupPrinter, printerGroupPrinterSchema } from './PrinterGroupPrinter';
import { PrinterGroup, printerGroupSchema } from './PrinterGroup';
import { Printer, printerSchema } from './Printer';
import { TablePlanElement, tablePlanElementSchema } from './TablePlanElement';
import { tableNames } from './tableNames';

export { tableNames };

export {
  Bill,
  BillCallLog,
  BillCallPrintLog,
  BillDiscount,
  BillItem,
  BillItemModifier,
  BillItemModifierItem,
  BillItemPrintLog,
  BillPayment,
  BillPeriod,
  Category,
  Discount,
  Item,
  ItemModifier,
  ItemPrice,
  Modifier,
  ModifierItem,
  ModifierItemPrice,
  Organization,
  PaymentType,
  PriceGroup,
  PrintCategory,
  Printer,
  PrinterGroup,
  PrinterGroupPrinter,
  TablePlanElement,
};

const databaseSchemas = [
  billSchema,
  billCallLogSchema,
  billCallPrintLogSchema,
  billDiscountSchema,
  billItemSchema,
  billItemModifierSchema,
  billItemModifierItemSchema,
  billItemPrintLogSchema,
  billPaymentSchema,
  billPeriodSchema,
  categorySchema,
  discountSchema,
  itemSchema,
  itemModifierSchema,
  itemPriceSchema,
  modifierSchema,
  modifierItemSchema,
  modifierItemPriceSchema,
  organizationSchema,
  paymentTypeSchema,
  priceGroupSchema,
  printCategorySchema,
  printerSchema,
  printerGroupSchema,
  printerGroupPrinterSchema,
  tablePlanElementSchema,
];

const schemaVersion = 1;

const dbSchema = schema({
  version: schemaVersion,
  tables: databaseSchemas,
});

const adapter = new SQLiteAdapter({
  schema: dbSchema,
  jsi: true,
});

export const database = new Database({
  adapter,
  modelClasses: [
    Bill,
    BillCallLog,
    BillCallPrintLog,
    BillDiscount,
    BillItem,
    BillItemModifier,
    BillItemModifierItem,
    BillItemPrintLog,
    BillPayment,
    BillPeriod,
    Category,
    Discount,
    Item,
    ItemModifier,
    ItemPrice,
    Modifier,
    ModifierItem,
    ModifierItemPrice,
    Organization,
    PaymentType,
    PriceGroup,
    PrintCategory,
    Printer,
    PrinterGroup,
    PrinterGroupPrinter,
    TablePlanElement,
  ],
});
