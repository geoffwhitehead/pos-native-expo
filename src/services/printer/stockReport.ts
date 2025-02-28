import type { Database} from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import dayjs from 'dayjs';
import type { Dictionary} from 'lodash';
import { groupBy } from 'lodash';
import type { BillItem, BillItemModifierItem, Category, Modifier, Organization, Printer } from '../../models';
import { addHeader, alignSpaceBetween, appendNewLine, starDivider } from './helpers';
import { receiptTemplate } from './template';
import { tableNames } from '../../models/tableNames';
import { PrinterBuilder } from 'react-native-star-io10/src/StarXpandCommand/PrinterBuilder';
import { StarXpandCommand } from 'react-native-star-io10';

type StockReportProps = {
  startDate: Date;
  endDate: Date;
  printer: Printer;
  organization: Organization;
  database: Database;
  builder: PrinterBuilder
};

export const stockReport = async ({ builder, startDate, endDate, printer, organization, database }: StockReportProps) => {
  const startDateUnix =
    dayjs(startDate)
      .startOf('day')
      .unix() * 1000;

  const endDateUnix =
    dayjs(endDate)
      .endOf('day')
      .unix() * 1000;

  const commonQuery = Q.and(
    Q.where('is_voided', Q.notEq(true)),
    Q.where('created_at', Q.gte(startDateUnix)),
    Q.where('created_at', Q.lte(endDateUnix)),
  );
  const [billItems, categories, billModifierItems, modifiers] = await Promise.all([
    database.collections
      .get<BillItem>(tableNames.billItems)
      .query(commonQuery)
      .fetch(),
    database.collections
      .get<Category>(tableNames.categories)
      .query()
      .fetch(),
    database.collections
      .get<BillItemModifierItem>(tableNames.billItemModifierItems)
      .query(
        Q.on('bill_items', [
          Q.where('is_voided', Q.notEq(true)),
          Q.where('created_at', Q.gte(startDateUnix)),
          Q.where('created_at', Q.lte(endDateUnix)),
        ] as any), // watermelon types incorrect
      )
      .fetch(),
    database.collections
      .get<Modifier>(tableNames.modifiers)
      .query()
      .fetch(),
  ]);

  const groupedByCategory = groupBy(billItems, billItem => `${billItem.categoryId}-${billItem.categoryName}`);
  const groupedByModifier = groupBy(
    billModifierItems,
    modifierItem => `${modifierItem.modifierName}-${modifierItem.modifierId}`,
  );

  const groupedByCategoryAndItem = Object.entries(groupedByCategory).reduce((acc, [categoryId, categoryBillItems]) => {
    return {
      ...acc,
      [categoryId]: groupBy(categoryBillItems, billItem => billItem.itemId),
    };
  }, {} as Dictionary<Dictionary<BillItem[]>>);

  const groupedByModifierAndModifierItem = Object.entries(groupedByModifier).reduce(
    (acc, [modifierId, modifierItems]) => {
      return {
        ...acc,
        [modifierId]: groupBy(modifierItems, modifierItem => modifierItem.modifierItemId),
      };
    },
    {} as Dictionary<Dictionary<BillItem[]>>,
  );

  receiptTemplate(builder, organization, printer.printWidth);
  builder.actionPrintText(starDivider(printer.printWidth));
  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Center);
  builder.actionPrintText('-- SALES STOCK REPORT --');
  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Left);

builder.actionPrintText(alignSpaceBetween(
      `Start Date: `,
      dayjs(startDate).format('DD/MM/YYYY'),
      Math.round(printer.printWidth / 2),
    ),
  );

  builder.actionPrintText(alignSpaceBetween(
      `End Date: `,
      dayjs(endDate).format('DD/MM/YYYY'),
      Math.round(printer.printWidth / 2),
    ),
  );

  builder.actionPrintText(starDivider(printer.printWidth));

  Object.values(groupedByCategoryAndItem).map(categoryBillItems => {
    Object.values(categoryBillItems).map((billItems, i) => {
      if (i === 0) {
        addHeader(builder, `Category: ${billItems[0].categoryName}`, printer.printWidth);
      }
      builder.actionPrintText(alignSpaceBetween(`${billItems[0].itemName}`, billItems.length.toString(), printer.printWidth));
    });
  });

  Object.values(groupedByModifierAndModifierItem).map(billModifierItems => {
    Object.values(billModifierItems).map((modifierItems, i) => {
      if (i === 0) {
        addHeader(builder, `Modifier: ${modifierItems[0].modifierName}`, printer.printWidth);
      }
      builder.actionPrintText(alignSpaceBetween(
          `${modifierItems[0].modifierItemName}`,
          modifierItems.length.toString(),
          printer.printWidth,
        ))
      });
    });


  builder.actionPrintText(appendNewLine(''));
  builder.actionPrintText(appendNewLine(''));

};
