import { capitalize, groupBy } from 'lodash';
import type {
  Bill,
  BillDiscount,
  BillItem,
  BillPayment,
  Discount,
  Organization,
  PaymentType,
  PriceGroup,
  Printer,
} from '../../models';
import type { BillSummary} from '../../utils';
import { billSummary, formatNumber, getItemPrice, getModifierItemPrice } from '../../utils';
import { addHeader, alignCenter, alignSpaceBetween, appendNewLine, divider, formatSize } from './helpers';
import { receiptTemplate } from './template';
import { StarXpandCommand } from 'react-native-star-io10';

const modPrefix = ' -';

const printItemsGroup = (builder: StarXpandCommand.PrinterBuilder, group: BillSummary['itemsBreakdown'], printWidth: number, currency: string, renderZeroPricedItems: boolean = false) => {
  group.map(({ item, mods, total }) => {
    const itemPrice = getItemPrice(item)
    builder.actionPrintText(alignSpaceBetween(
        capitalize(item.itemName),
        itemPrice > 0 || renderZeroPricedItems ? formatNumber(itemPrice, currency) : '',
        printWidth,
      ),
    );
    mods.map(mod => {
      const price = getModifierItemPrice(mod)
      builder.actionPrintText(alignSpaceBetween(
      `${modPrefix} ${capitalize(mod.modifierItemName)}`,
      price > 0 || renderZeroPricedItems ? formatNumber(price, currency) : '',
      printWidth,
    ))
    });
  });
  builder.actionPrintText(appendNewLine());
};

export const receiptBill = async (
  builder: StarXpandCommand.PrinterBuilder,
  bill: Bill,
  billItems: BillItem[],
  billDiscounts: BillDiscount[],
  billPayments: BillPayment[],
  discounts: Discount[],
  priceGroups: PriceGroup[],
  paymentTypes: PaymentType[],
  printer: Printer,
  organization: Organization,
) => {
  const { currency, vat } = organization;
  const summary = await billSummary(billItems, billDiscounts, billPayments, discounts);
  
  const itemGroups: Record<string, BillSummary['itemsBreakdown']> = groupBy(
    summary.itemsBreakdown,
    record => record.item.priceGroupId,
  );
  
  receiptTemplate(builder, organization, printer.printWidth, bill.reference.toString())
  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Left);
  addHeader(builder, 'Items', printer.printWidth)
  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Left);

  Object.values(itemGroups).map((group, i) => {
    const pG = priceGroups.find(pG => pG.id === Object.keys(itemGroups)[i])

    formatSize(builder, pG?.name ?? '', 2);

    const stdGroup = group.filter(({ item }) => !item.isComp);

    printItemsGroup(builder, stdGroup, printer.printWidth, currency);
  });

  const compItems = summary.itemsBreakdown.filter(({ item }) => item.isComp);
  compItems.length && addHeader(builder, 'Complimentary Items', printer.printWidth);
  printItemsGroup(builder, compItems, printer.printWidth, currency, true);

  billDiscounts.length > 0 && addHeader(builder, 'Discounts', printer.printWidth);

  summary.discountBreakdown.map(discount => {
    builder.actionPrintText(alignSpaceBetween(
      capitalize(discount.name),
      `-${formatNumber(discount.calculatedDiscount, currency)}`,
      printer.printWidth,
    ));
  });

  builder.actionPrintText(appendNewLine());

  billPayments.length > 0 && addHeader(builder, 'Payments', printer.printWidth);
  billPayments
    .filter(p => !p.isChange)
    .map(payment => {
      const pT = paymentTypes.find(pT => pT.id === (payment.paymentTypeId));
      builder.actionPrintText(alignSpaceBetween(
          capitalize(pT?.name),  
          formatNumber(payment.amount, currency),
          printer.printWidth,
        ),
      );
    });


    builder.actionPrintText(appendNewLine());

    builder.actionPrintText(alignSpaceBetween('Subtotal: ', formatNumber(summary.total, currency), printer.printWidth))

  billDiscounts.length &&
    builder.actionPrintText(alignSpaceBetween(
      'Total Discount:',
      '-' + formatNumber(summary.totalDiscount, currency),
      printer.printWidth,
    ));

  builder.actionPrintText(alignSpaceBetween('Total (ex VAT): ', formatNumber(summary.totalPayable * 0.8, currency), printer.printWidth));
  builder.actionPrintText(alignSpaceBetween('VAT: ', formatNumber(summary.totalPayable * 0.2, currency), printer.printWidth));

  formatSize(builder, alignSpaceBetween('Total: ', formatNumber(summary.totalPayable, currency), printer.printWidth / 2, false), 2);
  builder.actionPrintText(alignSpaceBetween('Paid: ', formatNumber(summary.totalPayments, currency), printer.printWidth));
  
  formatSize(builder, alignSpaceBetween('Balance: ', formatNumber(Math.max(0, summary.balance), currency), printer.printWidth / 2, false), 2);
  
  const changePayment = billPayments.find(p => p.isChange);
  if (changePayment) {
    builder.actionPrintText(alignSpaceBetween(
        'Change: ',
        formatNumber(Math.abs(changePayment.amount), currency),
        printer.printWidth,
      ),
    );
  }

  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Center);
  builder.actionPrintText(appendNewLine("Thank you!"));

  builder.actionPrintText(divider(printer.printWidth));

  builder.actionPrintText(`VAT: ${vat}`);

  return builder
};
