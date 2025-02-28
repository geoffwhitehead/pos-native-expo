import type { Database } from '@nozbe/watermelondb';
import dayjs from 'dayjs';
import { capitalize, groupBy, sumBy } from 'lodash';
import type { Bill, BillItem, BillPeriod, Organization, Printer } from '../../models';
import { formatNumber } from '../../utils';
import { addHeader, alignCenter, alignSpaceBetween, appendNewLine, starDivider } from './helpers';
import { receiptTemplate } from './template';
import { PrinterBuilder } from 'react-native-star-io10/src/StarXpandCommand/PrinterBuilder';
import { StarXpandCommand } from 'react-native-star-io10';

type CorrectionReportProps = {
  builder: PrinterBuilder
  database: Database;
  billPeriod: BillPeriod;
  printer: Printer;
  organization: Organization;
};
const modPrefix = ' -';

export const correctionReport = async ({
  builder,
  billPeriod,
  database,
  printer,
  organization,
}: CorrectionReportProps) => {
  const { currency } = organization;

  const [periodItemVoids, bills] = await Promise.all([
    billPeriod.periodItemVoidsAndCancels.fetch(),
    billPeriod.bills.fetch(),
  ]);

  const voids = periodItemVoids.filter(item => dayjs(item.voidedAt).isAfter(item.storedAt));
  const cancels = periodItemVoids.filter(item => !item.storedAt || dayjs(item.voidedAt).isBefore(item.storedAt));

  receiptTemplate(builder, organization, printer.printWidth);
  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Center);
  builder.actionPrintText(starDivider(printer.printWidth));
  builder.actionPrintText('-- CORRECTION REPORT --');
  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Left);

  builder.actionPrintText(appendNewLine(`Opened: ` + 
      dayjs(billPeriod.createdAt).format('DD/MM/YYYY HH:mm:ss')
  ));

  builder.actionPrintText(appendNewLine(`Closed: ` +  billPeriod.closedAt ? dayjs(billPeriod.closedAt).format('DD/MM/YYYY HH:mm:ss') : ''));

  builder.actionPrintText(starDivider(printer.printWidth));

  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Center);

  addHeader(builder, 'Voids', printer.printWidth);

  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Left);

  await itemsReport({ builder, bills, corrections: voids, printer, currency });

  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Center);

  addHeader(builder, 'Cancels', printer.printWidth);
  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Left);

  await itemsReport({ builder, bills, corrections: cancels, printer, currency });

};

type ReportProps = {
  builder: PrinterBuilder;
  bills: Bill[];
  corrections: BillItem[];
  printer: Printer;
  currency: string;
};
const itemsReport = async ({ builder, bills, corrections, printer, currency }: ReportProps) => {

  console.log('c', corrections)
  // filter any bills that dont contain any voids
  const filteredBills = bills.filter(({ id }) => corrections.some(({ billId }) => billId === id));

  console.log('f', filteredBills)
  const sortedBillsCreatedAsc = filteredBills.sort((bill1: Bill, bill2: Bill) => dayjs(bill2.createdAt).isBefore(bill1.createdAt) ? -1 : 1);

  const groupedVoidsByBillId = groupBy(corrections, item => item.billId);

  const combinedBillsItemsMods = await Promise.all(
    sortedBillsCreatedAsc.map(async bill => {
      const voidedModifiers = await bill.billModifierItemVoids.fetch();
      const groupedVoidsByBillItem = groupBy(voidedModifiers, voidedModifier => voidedModifier.billItemId);

      const billItemVoidsWithModifiers = groupedVoidsByBillId[bill.id].map(billItem => {
        const modifiers = groupedVoidsByBillItem[billItem.id];
          return {
            billItem,
          modifiers: modifiers || [],
          };
      });

      return {
        bill,
        billItemVoids: billItemVoidsWithModifiers,
      };
    }),
  );

  const total = combinedBillsItemsMods.reduce((acc, { billItemVoids }) => {
    const itemTotal = billItemVoids.reduce((acc, { billItem, modifiers }) => {
      const modifierTotal = sumBy(modifiers, modifier => modifier.modifierItemPrice);
      const billItemTotal = billItem.itemPrice + modifierTotal;
      return acc + billItemTotal;
    }, 0);
    return acc + itemTotal;
  }, 0);

  combinedBillsItemsMods.forEach(({ billItemVoids, bill }) => {
    addHeader(builder, `Table: ${bill.reference}`, printer.printWidth);
    builder.actionPrintText(appendNewLine(`Date: ${dayjs(bill.createdAt).format('DD/MM/YYYY HH:mm:ss')}`));

    billItemVoids.forEach(({ billItem, modifiers }) => {


      // builder.actionPrintText(appendNewLine(`Voided at: ${dayjs(billItem.voidedAt).format('DD/MM/YYYY HH:mm:ss')}`));
      builder.actionPrintText(alignSpaceBetween(
        capitalize(billItem.itemName),
        formatNumber(billItem.itemPrice, currency),
        printer.printWidth,
      ));
      modifiers.map(mod => {
        builder.actionPrintText(alignSpaceBetween(
          `${modPrefix} ${capitalize(mod.modifierItemName)}`,
          formatNumber(mod.modifierItemPrice, currency),
          printer.printWidth,
        ));
      });

      if (billItem.reasonName || billItem.reasonDescription) {
        builder.actionPrintText(billItem.reasonName);
        builder.actionPrintText(billItem.reasonDescription);
      }
    });
  });

  builder.actionPrintText(starDivider(printer.printWidth));
  builder.actionPrintText(alignSpaceBetween(`Total: `, formatNumber(total, currency), printer.printWidth));
};
