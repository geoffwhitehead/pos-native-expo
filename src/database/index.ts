import { appSchema, Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Bill, BillCallLog, billCallLogSchema, BillCallPrintLog, billCallPrintLogSchema, BillDiscount, billDiscountSchema, BillItem, BillItemModifier, BillItemModifierItem, billItemModifierItemSchema, billItemModifierSchema, BillItemPrintLog, billItemPrintLogSchema, billItemSchema, BillPayment, billPaymentSchema, BillPeriod, billPeriodSchema, billSchema, Category, categorySchema, Discount, discountSchema, Item, ItemModifier, itemModifierSchema, ItemPrice, itemPriceSchema, itemSchema, models, Modifier, ModifierItem, ModifierItemPrice, modifierItemPriceSchema, modifierItemSchema, modifierSchema, Organization, organizationSchema, PaymentType, paymentTypeSchema, PriceGroup, priceGroupSchema, PrintCategory, printCategorySchema, Printer, PrinterGroup, PrinterGroupPrinter, printerGroupPrinterSchema, printerGroupSchema, printerSchema, schemas, TablePlanElement, tablePlanElementSchema } from '../models';


const adapter = new SQLiteAdapter({
  schema: appSchema({
    version: 77,
    tables: [
      billSchema,
      billDiscountSchema,
      billItemSchema,
      billItemModifierSchema,
      billItemModifierItemSchema,
      billPaymentSchema,
      billPeriodSchema,
      categorySchema,
      discountSchema,
      itemSchema,
      itemModifierSchema,
      itemPriceSchema,
      // itemPrinterSchema,
      modifierSchema,
      modifierItemSchema,
      modifierItemPriceSchema,
      organizationSchema,
      paymentTypeSchema,
      priceGroupSchema,
      printerSchema,
      billItemPrintLogSchema,
      printerGroupSchema,
      printerGroupPrinterSchema,
      billCallLogSchema,
      billCallPrintLogSchema,
      tablePlanElementSchema,
      printCategorySchema,
    ],
  }),
});

export const database = new Database({
  adapter,
  modelClasses: [
    Item,
    ItemModifier,
    ModifierItem,
    // ItemPrinter,
    Category,
    Printer,
    Modifier,
    PriceGroup,
    ItemPrice,
    ModifierItemPrice,
    PaymentType,
    Discount,
    Organization,
    Bill,
    BillDiscount,
    BillItem,
    BillPayment,
    BillPeriod,
    BillItemModifierItem ,
    BillItemModifier,
    BillItemPrintLog,
    PrinterGroup,
    PrinterGroupPrinter,
    BillCallLog,
    BillCallPrintLog,
    TablePlanElement,
    PrintCategory
  ],
});

export const resetDatabase = async () => {
  try {
    await database.action(async () => {
      await database.unsafeResetDatabase();
      return { success: true };
    });
  } catch (e) {
    return {
      success: false,
      error: e,
    };
  }
};
