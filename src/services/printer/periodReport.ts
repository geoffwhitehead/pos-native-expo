import type { Database } from '@nozbe/watermelondb';
import dayjs from 'dayjs';
import { capitalize, flatten, sumBy } from 'lodash';
import type {
  Bill,
  BillItem,
  BillItemModifierItem,
  BillPeriod,
  Category,
  Discount,
  Organization,
  PaymentType,
  PriceGroup,
  Printer,
} from '../../models';
import {
  categorySummary,
  finalizedDiscountSummary,
  formatNumber,
  getItemPrice,
  getModifierItemPrice,
  modifierSummary,
  paymentSummary,
  priceGroupSummmary,
} from '../../utils';
import { addHeader, alignCenter, alignLeftRight, alignSpaceBetween, divider, starDivider } from './helpers';
import { receiptTemplate } from './template';
import { tableNames } from '../../models/tableNames';
import { StarXpandCommand } from 'react-native-star-io10';

type PeriodReportProps = {
  builder: StarXpandCommand.PrinterBuilder;
  billPeriod: BillPeriod;
  database: Database;
  printer: Printer;
  organization: Organization;
};

type PeriodReportDataProps = {
  billPeriod: BillPeriod;
  database: Database;
};

export type PeriodReportData = {
  bills: Bill[];
  billItems: BillItem[];
  categories: Category[];
  categoryTotals: ReturnType<typeof categorySummary>;
  modifierTotals: ReturnType<typeof modifierSummary>;
  discountTotals: ReturnType<typeof finalizedDiscountSummary>;
  paymentTotals: ReturnType<typeof paymentSummary>;
  voidTotal: number;
  voidCount: number;
  priceGroupTotals: ReturnType<typeof priceGroupSummmary>;
  salesTotal: number;
  compBillItems: BillItem[];
  compBillItemModifierItems: BillItemModifierItem[];
};

export const periodReportData = async ({ billPeriod, database }: PeriodReportDataProps): Promise<PeriodReportData> => {
  const [
    billItems,
    periodItemVoidsAndCancels,
    periodDiscounts,
    periodPayments,
    bills,
    categories,
    paymentTypes,
    discounts,
    priceGroups,
  ] = await Promise.all([
    billPeriod.periodItems.fetch(),
    billPeriod.periodItemVoidsAndCancels.fetch(),
    billPeriod.periodDiscounts.fetch(),
    billPeriod.periodPayments.fetch(),
    billPeriod.bills.fetch(),
    database.collections
      .get<Category>(tableNames.categories)
      .query()
      .fetch(),
    database.collections
      .get<PaymentType>(tableNames.paymentTypes)
      .query()
      .fetch(),
    database.collections
      .get<Discount>(tableNames.discounts)
      .query()
      .fetch(),
    database.collections
      .get<PriceGroup>(tableNames.priceGroups)
      .query()
      .fetch(),
  ]);

  /**
   * Note: Some of the queries here are combining comp and chargable items. This is needed as some of the
   * breakdowns will count the comp. The price will be set to 0 for comp items.
   */
  const [billModifierItems, billModifierItemVoids] = await Promise.all([
    flatten(await Promise.all(bills.map(async b => await b.billModifierItems.fetch()))),
    flatten(await Promise.all(bills.map(async b => await b.billModifierItemVoids.fetch()))),
  ]);

  const categoryTotals = categorySummary(billItems);
  const modifierTotals = modifierSummary(billModifierItems);
  const discountTotals = finalizedDiscountSummary(periodDiscounts, discounts);
  const paymentTotals = paymentSummary(periodPayments, paymentTypes);
  const voidTotal = sumBy(periodItemVoidsAndCancels, 'itemPrice') + sumBy(billModifierItemVoids, 'modifierItemPrice');
  // dont include modifier items in the count as these are cancelled as part od the item.
  const voidCount = periodItemVoidsAndCancels.length;
  const priceGroupTotals = priceGroupSummmary(billItems, billModifierItems, priceGroups);
  const billItemsTotal = sumBy(billItems, item => getItemPrice(item));
  const billModifierItemsTotal = sumBy(billModifierItems, mod => getModifierItemPrice(mod));
  const salesTotal = billItemsTotal + billModifierItemsTotal - discountTotals.total;
  const compBillItems = billItems.filter(item => item.isComp);
  const compBillItemModifierItems = billModifierItems.filter(mod => mod.isComp);

  return {
    bills,
    billItems,
    categories,
    categoryTotals,
    modifierTotals,
    discountTotals,
    paymentTotals,
    voidTotal,
    voidCount,
    priceGroupTotals,
    salesTotal,
    compBillItems,
    compBillItemModifierItems,
  };
};

export const periodReport = async ({ builder, billPeriod, database, printer, organization }: PeriodReportProps) => {
  const {
    bills,
    billItems,
    categories,
    categoryTotals,
    modifierTotals,
    discountTotals,
    paymentTotals,
    voidTotal,
    voidCount,
    priceGroupTotals,
    salesTotal,
    compBillItems,
    compBillItemModifierItems,
  } = await periodReportData({ billPeriod, database });

  const { currency } = organization;

  builder.actionPrintText(starDivider(printer.printWidth));

  receiptTemplate(builder, organization, printer.printWidth)
  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Center);

  builder.actionPrintText(billPeriod.closedAt ? '-- END PERIOD REPORT --' : '-- STATUS REPORT --');

  builder.actionPrintText(alignSpaceBetween(
      `Opened: `,
      dayjs(billPeriod.createdAt).format('DD/MM/YYYY HH:mm:ss'),
      Math.round(printer.printWidth / 2),
    ),
  );

  builder.actionPrintText(alignSpaceBetween(
    `Closed: `,
    billPeriod.closedAt ? dayjs(billPeriod.closedAt).format('DD/MM/YYYY HH:mm:ss') : '',
    Math.round(printer.printWidth / 2),
  ));

  builder.actionPrintText(starDivider(printer.printWidth));

  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Left);

  addHeader(builder, 'Category Totals', printer.printWidth);
  categoryTotals.breakdown.forEach(categoryTotal => {
      builder.actionPrintText(alignSpaceBetween(
          capitalize(categories.find(c => c.id === categoryTotal.categoryId).name),
          `${categoryTotal.count} / ${formatNumber(categoryTotal.total, currency)}`,
          printer.printWidth,
        ),
      );
    }),

  builder.actionPrintText(alignSpaceBetween(
      'Total: ',
      `${categoryTotals.count} / ${formatNumber(categoryTotals.total, currency)}`,
      printer.printWidth,
    ),
  );

  addHeader(builder, 'Modifier Totals', printer.printWidth);
  modifierTotals.breakdown.forEach(modifierGroup => {
    builder.styleAlignment(StarXpandCommand.Printer.Alignment.Center);

    builder.actionPrintText(alignCenter(modifierGroup.modifierName, printer.printWidth));
    builder.styleAlignment(StarXpandCommand.Printer.Alignment.Left);

    modifierGroup.breakdown.forEach(modifierItemGroup => {
        builder.actionPrintText(alignSpaceBetween(
            capitalize(modifierItemGroup.modifierItemName),
            `${modifierItemGroup.count} / ${formatNumber(modifierItemGroup.total, currency)}`,
            printer.printWidth,
        ),
      );
    })
  })

  builder.actionPrintText(alignSpaceBetween(
    'Total: ',
    `${modifierTotals.count} / ${formatNumber(modifierTotals.total, currency)}`,
    printer.printWidth,
  ));

  addHeader(builder, 'Price Group Totals (excl discounts)', printer.printWidth);
  priceGroupTotals.forEach(priceGroupTotal => {
      builder.actionPrintText(alignSpaceBetween(
          priceGroupTotal.name,
          `${priceGroupTotal.count} / ${formatNumber(priceGroupTotal.total, currency)}`,
          printer.printWidth,
        ),
      );
    })

  builder.actionPrintText(alignSpaceBetween(
    'Total: ',
    `${sumBy(priceGroupTotals, ({ count }) => count)} / ${formatNumber(
      sumBy(priceGroupTotals, ({ total }) => total),
      currency,
    )}`,
      printer.printWidth,
    ),
  );

  addHeader(builder, 'Discount Totals', printer.printWidth);
  discountTotals.breakdown.forEach(discountTotal => {
    builder.actionPrintText(alignSpaceBetween(
        capitalize(discountTotal.name),
        `${discountTotal.count} / ${formatNumber(discountTotal.total, currency)}`,
        printer.printWidth,
      ),
    );
  })
  
  builder.actionPrintText(alignSpaceBetween(
      'Total: ',
      `${discountTotals.count} / ${formatNumber(discountTotals.total, currency)}`,
      printer.printWidth,
    ),
  );
  builder.actionPrintText(divider(printer.printWidth));

  addHeader(builder, 'Payment Totals', printer.printWidth);
  paymentTotals.breakdown.forEach(paymentTotal => builder.actionPrintText(alignLeftRight(
        capitalize(paymentTotal.name),
        `${paymentTotal.count} / ${formatNumber(paymentTotal.total, currency)}`,
        printer.printWidth,
      ),
    ));
  builder.actionPrintText(alignLeftRight(
      'Total: ',
      `${paymentTotals.count} / ${formatNumber(paymentTotals.total, currency)}`,
      printer.printWidth,
    ),
  );
  builder.actionPrintText(divider(printer.printWidth));

  addHeader(builder, 'Complimentary Totals', printer.printWidth);

  builder.actionPrintText(alignLeftRight(
      'Items',
      `${compBillItems.length} / ${formatNumber(sumBy(compBillItems, 'itemPrice'), currency)}`,
      printer.printWidth,
    ),
  );
  builder.actionPrintText(alignLeftRight(
      'Modifiers',
      `${compBillItemModifierItems.length} / ${formatNumber(
        sumBy(compBillItemModifierItems, 'modifierItemPrice'),
        currency,
      )}`,
      printer.printWidth,
    ));

  addHeader(builder, 'Totals', printer.printWidth);
  builder.actionPrintText(alignLeftRight('Number of bills: ', bills.length.toString(), printer.printWidth));
  builder.actionPrintText(alignLeftRight(
      'Voids: ',
      `${voidCount} / ${formatNumber(voidTotal, currency)}`,
      printer.printWidth,
    ),
  );
  builder.actionPrintText(alignLeftRight(
      'Discounts: ',
      `${discountTotals.count} / ${formatNumber(discountTotals.total, currency)}`,
      printer.printWidth,
    ),
  );
  builder.actionPrintText(alignLeftRight(
      'Sales Total: ',
      formatNumber(salesTotal, currency),
      printer.printWidth,
    ),
  );
}
