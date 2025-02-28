import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Dictionary} from 'lodash';
import { capitalize, flatten, groupBy, keyBy, sortBy } from 'lodash';
import type {
  Bill,
  BillCallPrintLog,
  BillItem,
  BillItemModifierItem,
  BillItemPrintLog,
  Category,
  PriceGroup,
  PrintCategory,
  Printer,
} from '../../models';
import type { PrintItemGroupingEnum } from '../../models/Organization';
import { alignSpaceBetween, starDivider, subHeader } from './helpers';
import { PrintType } from '../../models/constants';
import { StarXpandCommand } from 'react-native-star-io10';
import { PrinterBuilder } from 'react-native-star-io10/src/StarXpandCommand/PrinterBuilder';

const MOD_PREFIX = '- ';
const REF_NAME = 'Table';

const timeFormat = 'h:mm a';

export const kitchenCall = async (p: {
  bill: Bill;
  billCallPrintLogs: BillCallPrintLog[];
  printers: Printer[];
}): Promise<{ billCallPrintLog: BillCallPrintLog; printer: Printer; printerBuilder: PrinterBuilder }[]> => {
  const { bill, printers, billCallPrintLogs } = p;

  const printersToPrintTo = printers.filter(printer => printer.receivesBillCalls);
  const keyedPrinters = keyBy(printersToPrintTo, printer => printer.id);

  return billCallPrintLogs.map(log => {

    const printerBuilder = new PrinterBuilder();
    const callCommands = generateBillCallCommands({
      builder: printerBuilder,
      reference: bill.reference,
    });

    return {
      billCallPrintLog: log,
      printer: keyedPrinters[log.printerId],
      printerBuilder
    };
  });
};

export const kitchenReceipt = async (p: {
  billItems: BillItem[];
  billItemPrintLogs: BillItemPrintLog[];
  printers: Printer[];
  priceGroups: PriceGroup[];
  reference: string;
  prepTime?: Dayjs;
  categories: Category[];
  printCategories: PrintCategory[];
  printItemGrouping: PrintItemGroupingEnum;
}): Promise<{ billItemPrintLogs: BillItemPrintLog[]; printer: Printer; printerBuilder: PrinterBuilder }[]> => {
  const {
    billItems,
    printers,
    priceGroups,
    reference,
    prepTime,
    billItemPrintLogs,
    categories,
    printCategories,
    printItemGrouping,
  } = p;

  const keyedCategories = keyBy(categories, category => category.id);
  const keyedPrintCategories = keyBy(printCategories, printCategory => printCategory.id);

  const populatedItems = await Promise.all(
    billItems.map(async billItem => {
      const mods = await billItem.billItemModifierItems.fetch();
      return {
        billItem,
        mods,
      };
    }),
  );

  const combinedFields = billItemPrintLogs.map(billItemPrintLog => {
    const fields = populatedItems.find(item => item.billItem.id === billItemPrintLog.billItemId);

    return {
      billItemPrintLog,
      ...fields,
    };
  });

  const groupedByPriceGroup = groupBy(combinedFields, fields => fields.billItem.priceGroupId);
  const keyedPrinters = keyBy(printers, printer => printer.id);

  const nestedGroupedByPrinterId = Object.values(groupedByPriceGroup).map(groups =>
    groupBy(groups, group => group.billItemPrintLog.printerId),
  );

  const keyedPriceGroups = keyBy(priceGroups, pG => pG.id);

  const printCommands = nestedGroupedByPrinterId.map(group => {
    return Object.entries(group).map(([printerId, itemsToPrint]) => {
      // these records are all grouped by price group so its fine to use the first
      const priceGroupId = itemsToPrint[0].billItem.priceGroupId;
      return {
        priceGroup: keyedPriceGroups[priceGroupId],
        itemsToPrint,
        prepTime,
        reference,
        printer: keyedPrinters[printerId],
        keyedCategories,
        keyedPrintCategories,
      };
    });
  });

  const flattenedPrintCommands = flatten(printCommands);

  const billPrintCommands = flattenedPrintCommands.map(printCommands => {

    const printerBuilder = new StarXpandCommand.PrinterBuilder();

    generateBillItemCommands({
      builder: printerBuilder,
      itemsToPrint: printCommands.itemsToPrint as any,
      priceGroup: printCommands.priceGroup,
      printer: printCommands.printer,
      prepTime: printCommands.prepTime,
      reference: printCommands.reference,
      keyedCategories: printCommands.keyedCategories,
      keyedPrintCategories: printCommands.keyedPrintCategories,
    });

    return {
      printerBuilder,
      billItemPrintLogs: printCommands.itemsToPrint.map(({ billItemPrintLog }) => billItemPrintLog),
      printer: printCommands.printer,
    };
  });

  return billPrintCommands;
};

const generateBillCallCommands = (p: { builder: PrinterBuilder; reference: number}) => {
  const { builder, reference } = p;

  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Center);
  builder.actionPrintText('IN: ' + dayjs().format(timeFormat))
  builder.actionPrintText('CALL: ' + reference)

};

const generateBillItemCommands = (p: {
  builder: StarXpandCommand.PrinterBuilder;
  itemsToPrint: { billItem: BillItem; mods: BillItemModifierItem[]; billItemPrintLog: BillItemPrintLog }[];
  priceGroup: PriceGroup;
  printer: Printer;
  prepTime?: Dayjs;
  reference: string;
  keyedCategories: Dictionary<Category>;
  keyedPrintCategories: Dictionary<PrintCategory>;
}) => {
  const { builder, itemsToPrint, priceGroup, printer, prepTime, reference, keyedCategories, keyedPrintCategories } = p;

  const pGName = priceGroup.shortName || priceGroup.name;

  builder.styleAlignment(StarXpandCommand.Printer.Alignment.Center);
  builder.actionPrintText(pGName.toUpperCase());
  builder.actionPrintText('IN: ' + dayjs().format(timeFormat))
  prepTime && builder.actionPrintText('PREP: ' + prepTime.format(timeFormat))
  builder.actionPrintText(REF_NAME.toUpperCase() + ': ' + reference)
  builder.actionPrintText(starDivider(printer.printWidth));

  const groupedIntoQuantities = Object.values(
    groupBy(itemsToPrint, ({ billItem, mods, billItemPrintLog }) => {
      const isVoid = billItemPrintLog.type === PrintType.void;
      const itemId = billItem.itemId;
      const modifierIds = mods.map(m => m.modifierItemId).toString();
      const msg = billItem.printMessage;
      /**
       * the below string is used to uniquely distinguish items based on the item id, modifier ids, print message, and
       * whether its a void or not. This is done so items can be grouped by quanity correctly on the receipts. An item
       * with a print message will more often than not - not be able to be grouped
       */
      const uniqueString = `${itemId}-${modifierIds}-${msg}-${isVoid}`;

      return uniqueString;
    }),
  );

  const quantifiedItems = groupedIntoQuantities.map(group => ({
    quantity: group.length,
    isVoided: group[0].billItemPrintLog.type === PrintType.void,
    billItem: group[0].billItem,
    mods: group[0].mods,
    printMessage: group[0].billItem.printMessage,
  }));

  const groupedByCategory = groupBy(quantifiedItems, group => {
    const category = keyedCategories[group.billItem.categoryId];
    // Note: if the user has provided a print category to group by use this.
    return category.printCategoryId || category.id;
  });

  sortBy(Object.entries(groupedByCategory), ([categoryId, quantifiedItems]) => {
    const category = keyedCategories[categoryId];
    const printCategory = keyedPrintCategories[categoryId];

    return printCategory.displayOrder || category.shortName || 0;
  }).map(([categoryId, quantifiedItems]) => {
    const printCategory = keyedPrintCategories[categoryId]?.shortName;
    const category = keyedCategories[categoryId]?.shortName;

    // Note: use the print category if defined otherwise default to standard category id
    const categoryShortName = printCategory || category;

    builder.actionPrintText(subHeader(categoryShortName?.toUpperCase() || 'OTHER', printer.printWidth))

    builder.styleAlignment(StarXpandCommand.Printer.Alignment.Left);
    quantifiedItems.map(({ quantity, billItem, mods, isVoided, printMessage }) => {
      if (isVoided) {
        builder.actionPrintText(alignSpaceBetween(
            `${('VOID ' + capitalize(billItem.itemShortName)).slice(0, printer.printWidth)}`,
            quantity.toString(),
            printer.printWidth,
          ),
        );
      } else {
        builder.actionPrintText(alignSpaceBetween(`${billItem.itemShortName}`, quantity.toString(), printer.printWidth))
      }
      mods.map(mod => {
        builder.actionPrintText(MOD_PREFIX + capitalize(mod.modifierItemShortName))
      });
      printMessage &&
        builder.actionPrintText(alignSpaceBetween(printMessage, '', printer.printWidth));
    });
  });

  return {
    billItemPrintLogs: itemsToPrint.map(({ billItemPrintLog }) => billItemPrintLog),
    printer
  };
};
