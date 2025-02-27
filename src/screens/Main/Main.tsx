import type { Database} from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Dictionary} from 'lodash';
import { groupBy, keyBy, sortBy } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Loading } from '../../components/Loading/Loading';
import { BillPeriodContext } from '../../contexts/BillPeriodContext';
import { CurrentBillContext } from '../../contexts/CurrentBillContext';
import type { GroupedPrices} from '../../contexts/ItemPricesContext';
import { ItemPricesContext } from '../../contexts/ItemPricesContext';
import type { CategoryItems, GroupedSortedItems} from '../../contexts/ItemsContext';
import { ItemsContext } from '../../contexts/ItemsContext';
import { LastSyncedAtContext } from '../../contexts/LastSyncedAtContext';
import { OrganizationContext } from '../../contexts/OrganizationContext';
import { PriceGroupContext } from '../../contexts/PriceGroupContext';
import { ReceiptPrinterContext } from '../../contexts/ReceiptPrinterContext';
import type { RecentColorsType } from '../../contexts/RecentColorsContext';
import { RecentColorsContext } from '../../contexts/RecentColorsContext';
import { database } from '../../database';
import { useSync } from '../../hooks/useSync';
import type {
  Bill,
  BillPeriod,
  Category,
  Item,
  ItemPrice,
  Organization,
  PriceGroup,
  Printer,
} from '../../models';
import { SidebarNavigator } from '../../navigators/SidebarNavigator';
import { tableNames } from '../../models/tableNames';

interface MainInnerProps {
  priceGroups: PriceGroup[];
  organization: Organization;
  itemPrices: ItemPrice[];
  items: Item[];
  categories: Category[];
  children?: React.ReactNode;
}

interface MainOuterProps {
  database: Database;
  organizationId: string;
  userId: string;
  children?: React.ReactNode;
}

export const MainWrapped: React.FC<MainOuterProps & MainInnerProps> = ({
  items,
  priceGroups,
  itemPrices,
  organization,
  categories,
  children
}) => {
  const [billPeriod, setBillPeriod] = useState<BillPeriod>();
  const [priceGroup, setPriceGroup] = useState<PriceGroup>();
  const [currentBill, setCurrentBill] = useState<Bill>();
  const [receiptPrinter, setReceiptPrinter] = useState<Printer>();
  const [recentColors, setRecentColors] = useState<RecentColorsType>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Dayjs>();
  const [_, setOrganization] = useState<Organization>();
  const [minutes, setMinutes] = useState(0);
  const [__, doSync] = useSync();
  const [groupedItemPrices, setGroupedItemPrices] = useState<GroupedPrices>({});
  const [categoryItems, setCategoryItems] = useState<CategoryItems>({});
  const [groupedSortedItems, setGroupedSortedItems] = useState<GroupedSortedItems>({});

  useEffect(() => {
    const groupedByPriceGroup = groupBy(itemPrices, itemPrice => itemPrice.priceGroupId);

    const groupedAndKeyed = Object.entries(groupedByPriceGroup).reduce((acc, [priceGroupId, itemPrices]) => {
      const keyedPricesByItem = keyBy(itemPrices, itemPrice => itemPrice.itemId);
      return {
        ...acc,
        [priceGroupId]: keyedPricesByItem,
      };
    }, {} as GroupedPrices);

    setGroupedItemPrices(groupedAndKeyed);
  }, [itemPrices, setGroupedItemPrices]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutes(minutes => minutes + 1);
    }, 1000 * 60 * 60 * 4); // every 4 hours
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const groupedByCat = groupBy(items, item => item.categoryId);

    const emptySet = categories.reduce((acc, cat) => {
      return {
        ...acc,
        [cat.id]: {},
      };
    }, {} as Dictionary<{}>);

    const sortedGroupedByCat = Object.entries(groupedByCat).reduce((acc, [key, items]) => {
      return {
        ...acc,
        [key]: sortBy(items, item => item.name),
      };
    }, emptySet as Dictionary<Item[]>);

    const sortedGroupedByCatAndChar = Object.entries(sortedGroupedByCat).reduce((acc, [key, items]) => {
      if (items.length === 0) {
        return acc;
      }
      return {
        ...acc,
        [key]: groupBy(items, item => item.name[0]),
      };
    }, {} as Dictionary<Dictionary<Item[]>>);

    setGroupedSortedItems(sortedGroupedByCatAndChar);
  }, [items, setGroupedSortedItems]);

  useEffect(() => {
    doSync();

    /**
     * TODO: setLastSyncedAt is called inside doSync above yet its
     * neccessary to call it below for it to work. Understand why its necessary
     * to call this manually. Is it because doSync is called from outside of the
     * nested context provider?
     */
    setLastSyncedAt(dayjs());
  }, [minutes]);

  useEffect(() => {
    const fetchAndSetBillPeriod = async (organization: Organization) => {
      const currentBillPeriod = await organization.currentBillPeriod.fetch();
      setBillPeriod(currentBillPeriod);
    };
    const createAndSetNewBillPeriod = async (organization: Organization) => {
      await organization.createNewBillPeriod();
    };

    if (organization) {
      if (!organization.currentBillPeriodId) {
        createAndSetNewBillPeriod(organization);
      } else if (!billPeriod || billPeriod.id !== organization.currentBillPeriodId) {
        fetchAndSetBillPeriod(organization);
      }
    }
  }, [organization.currentBillPeriodId, billPeriod, setBillPeriod]);

  useEffect(() => {
    setOrganization(organization);
  }, [organization]);

  useEffect(() => {
    const setPrinter = async (receiptPrinterId: string) => {
      const printer = await database.collections.get<Printer>(tableNames.printers).find(receiptPrinterId);
      setReceiptPrinter(printer);
    };
    if (organization && organization.receiptPrinterId) {
      const { receiptPrinterId } = organization;

      const isDifferentPrinter = receiptPrinterId !== receiptPrinter?.id;
      if (isDifferentPrinter) {
        setPrinter(receiptPrinterId);
      }
    }
  }, [organization, receiptPrinter, setReceiptPrinter]);

  useEffect(() => {
    if (priceGroups && organization) {
      const defaultPriceGroup = priceGroups.find(({ id }) => id === organization.defaultPriceGroupId);
      const [firstPriceGroup] = priceGroups;

      // TODO: This shouldnt be needed as a default price group is created on org create.
      const createDefaultPriceGroup = async () =>
        await database.write(() =>
          database.collections
            .get<PriceGroup>(tableNames.priceGroups)
            .create(record =>
              Object.assign(record, { name: 'Default', shortName: 'Default', isPrepTimeRequired: false }),
            ),
        );

      if (!firstPriceGroup) {
        createDefaultPriceGroup();
      }

      setPriceGroup(defaultPriceGroup || firstPriceGroup || null);
    }
  }, [priceGroups, organization, setPriceGroup]);

  if (!billPeriod || !priceGroup || !organization) {
    return <Loading />;
  }
  return (
    <OrganizationContext.Provider value={{ organization, setOrganization }}>
      <BillPeriodContext.Provider value={{ billPeriod, setBillPeriod }}>
        <PriceGroupContext.Provider value={{ priceGroup, setPriceGroup }}>
          <CurrentBillContext.Provider value={{ currentBill, setCurrentBill } as any}>
            <ReceiptPrinterContext.Provider value={{ receiptPrinter, setReceiptPrinter } as any}>
              <RecentColorsContext.Provider value={{ recentColors, setRecentColors } as any}>
                <LastSyncedAtContext.Provider value={{ lastSyncedAt, setLastSyncedAt } as any}>
                  {/* TODO: Items and their prices are infrequently changed. Its more performant to perform any sorting and
                  processing is done at the top level. Investigate more thoroughly and perhaps move to local state further down.*/}
                  <ItemPricesContext.Provider value={{ groupedItemPrices, setGroupedItemPrices }}>
                    <ItemsContext.Provider
                      value={{ categoryItems, setCategoryItems, groupedSortedItems, setGroupedSortedItems }}
                    >
                      {children}
                    </ItemsContext.Provider>
                  </ItemPricesContext.Provider>
                </LastSyncedAtContext.Provider>
              </RecentColorsContext.Provider>
            </ReceiptPrinterContext.Provider>
          </CurrentBillContext.Provider>
        </PriceGroupContext.Provider>
      </BillPeriodContext.Provider>
    </OrganizationContext.Provider>
  );
};
export const Main = withDatabase(
  withObservables<MainOuterProps, MainInnerProps>([], ({ database, organizationId }) => ({
    priceGroups: database.collections.get<PriceGroup>(tableNames.priceGroups).query() as unknown as PriceGroup[],
    items: database.collections
      .get<Item>(tableNames.items)
      .query()
      .observeWithColumns(['name']) as unknown as Item[],
    itemPrices: database.collections
      .get<ItemPrice>(tableNames.itemPrices)
      .query(Q.where('price', Q.notEq(null)))
      .observeWithColumns(['price_group_id']) as unknown as ItemPrice[],
    categories: database.collections.get<Category>(tableNames.categories).query() as unknown as Category[],
    organization: database.collections.get<Organization>(tableNames.organizations).findAndObserve(organizationId) as unknown as Organization,
  }))(MainWrapped),
);
