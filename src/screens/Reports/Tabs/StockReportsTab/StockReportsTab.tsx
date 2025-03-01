import type { Database} from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import withObservables from '@nozbe/with-observables';
import dayjs from 'dayjs';
import { groupBy, maxBy, truncate } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
// import { VictoryBar } from 'victory-native/lib/components/victory-bar';
// import { VictoryAxis } from 'victory-native/lib/components/victory-axis';
// import { VictoryChart } from 'victory-native/lib/components/victory-chart';
// import { VictoryTheme } from 'victory-native/lib/victory-theme';
import { SwitchSelector } from '../../../../components/SwitchSelector/SwitchSelector';
import { TimePicker } from '../../../../components/TimePicker/TimePicker';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { ReceiptPrinterContext } from '../../../../contexts/ReceiptPrinterContext';
import { NewButton, FormControl, HStack, Icon, Picker, Spinner, Text, VStack, Box } from '../../../../core';
import type { BillItem, Category, PriceGroup } from '../../../../models';
import { print } from '../../../../services/printer/printer';
import { stockReport } from '../../../../services/printer/stockReport';
import { colors } from '../../../../theme';
import { resolveButtonState } from '../../../../utils/helpers';
import { moderateScale } from '../../../../utils/scaling';
import { tableNames } from '../../../../models/tableNames';
import { StarXpandCommand } from 'react-native-star-io10';
import LottieView from 'lottie-react-native';

type StockReportsTabInnerProps = {
  categories: Category[];
  priceGroups: PriceGroup[];
};

type StockReportsTabOuterProps = {
  database: Database;
};

enum SortTypeEnum {
  'ascending' = 'ascending',
  'descending' = 'descending',
  'alphabetical' = 'alphabetical',
}

const LABEL_PADDING = 20;

export const StockReportsTabInner: React.FC<StockReportsTabOuterProps & StockReportsTabInnerProps> = ({
  categories,
  priceGroups,
}) => {
  const [startDate, setStartDate] = useState(dayjs(dayjs().subtract(7, 'day')).toDate());
  const [endDate, setEndDate] = useState(dayjs().toDate());
  const [visibleDatePicker, setVisibleDatePicker] = useState<'start' | 'end'>();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(categories[0]);
  const database = useDatabase();
  const { receiptPrinter } = useContext(ReceiptPrinterContext);
  const { organization } = useContext(OrganizationContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [sortType, setSortType] = useState<SortTypeEnum>(SortTypeEnum.alphabetical);
  const [yPadding, setYPadding] = useState(100);
  const [selectedPriceGroup, setSelectedPriceGroup] = useState<PriceGroup>(null);

  const handleConfirm = date => {
    visibleDatePicker === 'start' ? setStartDate(date) : setEndDate(date);
    setVisibleDatePicker(null);
  };

  const handleCancel = () => setVisibleDatePicker(null);

  const onPrintStockReport = async () => {
    setIsLoading(true);

    const printerBuilder = new StarXpandCommand.PrinterBuilder();
    await stockReport({ builder: printerBuilder, startDate, endDate, database, printer: receiptPrinter, organization });
    await print({ printerBuilder, printer: receiptPrinter });
    setIsLoading(false);
  };

  type fetchGraphDataProps = {
    selectedCategory: Category;
    startDate: Date;
    endDate: Date;
    selectedPriceGroup: PriceGroup | null;
  };

  const fetchGraphData = async ({ selectedCategory, startDate, endDate, selectedPriceGroup }: fetchGraphDataProps) => {
    setIsGraphLoading(true);
    const startDateUnix =
      dayjs(startDate)
        .startOf('day')
        .unix() * 1000;

    const endDateUnix =
      dayjs(endDate)
        .endOf('day')
        .unix() * 1000;

    const billItems = await database.collections
      .get<BillItem>(tableNames.billItems)
      .query(
        Q.and(
          Q.where('category_id', selectedCategory ? Q.eq(selectedCategory.id) : Q.notEq(null)),
          Q.where('is_voided', Q.notEq(true)),
          Q.where('created_at', Q.gte(startDateUnix)),
          Q.where('created_at', Q.lte(endDateUnix)),
          Q.where('price_group_id', selectedPriceGroup ? Q.eq(selectedPriceGroup.id) : Q.notEq(null)),
        ),
      )
      .fetch();

    const grouped = groupBy(billItems, billItem => billItem.itemId);
    
    let data = Object.values(grouped).map((billItems, i) => {
      const itemName = truncate(billItems[0].itemName, { length: 50 });
      return {
        x: `${itemName} (${i})`,
        y: billItems.length,
        label: billItems.length.toString(),
        name: itemName,
      };
    });

    // Handle sorting
    if (sortType === SortTypeEnum.alphabetical) {
      data = data.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === SortTypeEnum.ascending) {
      data = data.sort((a, b) => a.y - b.y);
    } else {
      data = data.sort((a, b) => b.y - a.y);
    }

    if (data.length) {
      const pixelsPerChar = 7;
      const graphPadding = (maxBy(data, el => el.x.length).x.length + 5) * pixelsPerChar;
      setYPadding(graphPadding + LABEL_PADDING);
    } else {
      setYPadding(100);
    }
    setGraphData(data);
    setIsGraphLoading(false);
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchGraphData({ selectedCategory, startDate, endDate, selectedPriceGroup });
    }
  }, [selectedCategory, startDate, endDate, selectedPriceGroup]);

  const handlePressStartDate = () => setVisibleDatePicker('start');
  const handlePressEndDate = () => setVisibleDatePicker('end');
  const chartHeight = 200 + 20 * graphData.length;

  return (
    <Box style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ marginBottom: 20 }}>I disabled this section, need to spend more time updating it.</Text>
      <LottieView
        style={{ height: 250, width: 250 }}
        source={require('../../../../animations/maintenance.json')}
        autoPlay={true}
        loop={true}
      />
    </Box>
  )
  // return (
  //   <>
  //     <ListItem itemHeader first>
  //       <Text style={{ fontWeight: 'bold' }}>Item Sales over range</Text>
  //     </ListItem>
  //     <ListItem style={{ flexDirection: 'row', width: '100%' }}>
  //       <FormControl style={{ flexDirection: 'row' }}>
  //         <Item stackedLabel style={{ borderBottomWidth: 0, width: moderateScale(200) }} onPress={handlePressStartDate}>
  //           <Label>Start Date</Label>
  //           <Text style={styles.dateLabel}>{`${dayjs(startDate).format('DD/MM/YYYY')}`}</Text>
  //         </Item>
  //         <Item stackedLabel style={{ borderBottomWidth: 0, width: moderateScale(200) }} onPress={handlePressEndDate}>
  //           <Label>End Date</Label>
  //           <Text style={styles.dateLabel}>{`${dayjs(endDate).format('DD/MM/YYYY')}`}</Text>
  //         </Item>
  //       </FormControl>
  //       <Button
  //         small
  //         style={{ margin: 10, alignSelf: 'flex-end' }}
  //         onPress={onPrintStockReport}
  //         disabled={isLoading}
  //         {...resolveButtonState(isLoading, 'info')}
  //       >
  //         <Text>Print Report</Text>
  //       </Button>
  //     </ListItem>
  //     <ListItem itemDivider style={styles.categoryPickerItem}>
  //       <Label>
  //         <Text style={styles.categoryPickerText}>Price Group: </Text>
  //       </Label>
  //       <Picker
  //         mode="dropdown"
  //         iosHeader="Select a price group"
  //         iosIcon={<Icon name="chevron-down-outline" color="white" size={24} />}
  //         placeholder="Select a price group"
  //         selectedValue={selectedPriceGroup}
  //         onValueChange={pg => setSelectedPriceGroup(pg)}
  //         textStyle={{
  //           paddingLeft: 0,
  //           paddingRight: 0,
  //         }}
  //       >
  //         {[
  //           <Picker.Item key="all-pricegroups" label="All" value={null} />,
  //           ...priceGroups.map(priceGroup => {
  //             return <Picker.Item key={priceGroup.id} label={priceGroup.name} value={priceGroup} />;
  //           }),
  //         ]}
  //       </Picker>
  //       <Label>
  //         <Text style={styles.categoryPickerText}>Category: </Text>
  //       </Label>
  //       <Picker
  //         mode="dropdown"
  //         iosHeader="Select a category"
  //         iosIcon={<Icon name="chevron-down-outline" color="white" size={24} />}
  //         placeholder="Select a category"
  //         selectedValue={selectedCategory}
  //         onValueChange={c => setSelectedCategory(c)}
  //         textStyle={{
  //           paddingLeft: 0,
  //           paddingRight: 0,
  //         }}
  //       >
  //         {[
  //           <Picker.Item key="all-categories" label="All" value={null} />,
  //           ...categories.map(category => {
  //             return <Picker.Item key={category.id} label={category.name} value={category} />;
  //           }),
  //         ]}
  //       </Picker>
  //       <SwitchSelector
  //         options={[
  //           { label: 'Alpha', value: SortTypeEnum.alphabetical },
  //           { label: 'Ascending', value: SortTypeEnum.ascending },
  //           { label: 'Descending', value: SortTypeEnum.descending },
  //         ]}
  //         initial={sortType}
  //         onPress={value => setSortType(value as SortTypeEnum)}
  //         style={{ width: moderateScale(400), marginRight: 5 }}
  //       />
  //     </ListItem>
  //     {isGraphLoading && <Spinner />}

  //     <Icon name="print-outline" />
  //     {/* {!isGraphLoading && graphData.length === 0 && <Text style={{ padding: 10 }}>No results found... </Text>} */}
  //     {/* {!isGraphLoading && graphData.length > 0 && (
  //       <ScrollView>
  //         <VictoryChart
  //           height={chartHeight}
  //           padding={{ left: yPadding, top: 50, right: 50, bottom: 50 }}
  //           theme={VictoryTheme.material}
  //           horizontal
  //           domainPadding={{ x: 20 }}
  //           animate={{
  //             duration: 500,
  //             easing: "cubic",
  //             onLoad: { duration: 250 }
  //           }}
  //         >
  //           <VictoryBar
  //             barWidth={15}
  //             alignment="middle"
  //             style={{
  //               data: { fill: colors.highlightBlue },
  //               labels: { fill: "black", fontSize: 12 }
  //             }}
  //             data={graphData}
  //             labels={({ datum }) => datum.y}
  //           />
  //           <VictoryAxis
  //             dependentAxis
  //             label={`Items sold (${dayjs(startDate).format('DD/MM/YYYY')} - ${dayjs(endDate).format('DD/MM/YYYY')})`}
  //             style={{
  //               axisLabel: { padding: 30, fontWeight: "bold" },
  //               grid: { stroke: "none" },
  //               ticks: { stroke: "none" }
  //             }}
  //           />
  //           <VictoryAxis
  //             label="Item"
  //             style={{
  //               axisLabel: { padding: yPadding - LABEL_PADDING, fontWeight: "bold" },
  //               grid: { stroke: "none" },
  //               ticks: { stroke: "none" }
  //             }}
  //           />
  //         </VictoryChart>
  //       </ScrollView>
  //     )} */}
  //     <View>
  //       <TimePicker
  //         isVisible={visibleDatePicker === 'start'}
  //         onCancel={handleCancel}
  //         onConfirm={handleConfirm}
  //         value={startDate}
  //         title="Please select an start date"
  //         mode="date"
  //       />
  //       <TimePicker
  //         isVisible={visibleDatePicker === 'end'}
  //         onCancel={handleCancel}
  //         onConfirm={handleConfirm}
  //         value={endDate}
  //         title="Please select an end date"
  //         mode="date"
  //       />
  //     </View>
  //   </>
  // );
};

const styles = StyleSheet.create({
  categoryPickerItem: { paddingLeft: 15, backgroundColor: 'white', justifyContent: 'flex-end' },
  categoryPickerText: { color: 'grey' },
  dateLabel: { alignSelf: 'flex-start', paddingTop: 10 },
});

const enhance = c =>
  withDatabase(
    withObservables<StockReportsTabOuterProps, StockReportsTabInnerProps>([], ({ database }) => ({
      categories: database.collections.get<Category>(tableNames.categories).query(),
      priceGroups: database.collections.get<PriceGroup>(tableNames.priceGroups).query(),
    }))(c),
  );

export const StockReportsTab = enhance(StockReportsTabInner);
