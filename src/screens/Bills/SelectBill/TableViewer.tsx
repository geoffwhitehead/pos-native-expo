import type { Dictionary} from 'lodash';
import { groupBy, keyBy, times } from 'lodash';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import FurnArmchair from '../../../assets/armchair.svg';
import FurnChair from '../../../assets/chair.svg';
import FurnCoffeeTable from '../../../assets/coffee-table.svg';
import FurnCupboard from '../../../assets/cupboard.svg';
import FurnDoor from '../../../assets/door.svg';
import FurnDrawers from '../../../assets/drawers.svg';
import FurnExtractor from '../../../assets/extractor-hood.svg';
import FurnPlant2 from '../../../assets/plant-1.svg';
import FurnPlant3 from '../../../assets/plant-2.svg';
import FurnPlant4 from '../../../assets/plant-3.svg';
import FurnPlant1 from '../../../assets/plant.svg';
import FurnSink from '../../../assets/sink.svg';
import FurnSofaCorner from '../../../assets/sofa-corner.svg';
import FurnSofa from '../../../assets/sofa.svg';
import Table2Round from '../../../assets/table2-col.svg';
import Table4 from '../../../assets/table4-col.svg';
import Table4Square from '../../../assets/table4-sq-col.svg';
import BlockWallCenter from '../../../assets/wall-center.svg';
import BlockWallCorner from '../../../assets/wall-corner.svg';
import BlockWallSquare from '../../../assets/wall-square.svg';
import BlockWall from '../../../assets/wall.svg';
import BlockWindow from '../../../assets/window.svg';
import { NewButton, HStack, Text, VStack } from '../../../core';
import type { Bill, TablePlanElement } from '../../../models';
import type { TablePlanElementTypes } from '../../../models/TablePlanElement';
import { fontSizes } from '../../../theme';

type TableViewerProps = {
  selectedElement: TableElement;
  tableElements: TablePlanElement[];
  onSelectElement: (el: TableElement) => void;
  gridSize: number;
  openBills: Bill[];
  isEditing: boolean;
};

export type TableElement = {
  x: number;
  y: number;
  tablePlanElement?: TablePlanElement;
};

const elementMap: Record<TablePlanElementTypes, React.FC> = {
  'block:wall': BlockWall,
  'block:window': BlockWindow,
  'block:wall:center': BlockWallCenter,
  'block:wall:corner': BlockWallCorner,
  'block:wall:square': BlockWallSquare,
  'table:4:square': Table4Square,
  'table:2:round': Table2Round,
  'table:4': Table4,
  'furniture:armchair': FurnArmchair,
  'furniture:coffeetable': FurnCoffeeTable,
  'furniture:cupboard': FurnCupboard,
  'furniture:door': FurnDoor,
  'furniture:extractor': FurnExtractor,
  'furniture:plant1': FurnPlant1,
  'furniture:plant2': FurnPlant2,
  'furniture:plant3': FurnPlant3,
  'furniture:plant4': FurnPlant4,
  'furniture:chair': FurnChair,
  'furniture:drawers': FurnDrawers,
  'furniture:sink': FurnSink,
  'furniture:sofa': FurnSofa,
  'furniture:sofacorner': FurnSofaCorner,
};


const GRID_SPACING = 4;

export const TableViewerInner: React.FC<TableViewerProps> = ({
  gridSize,
  selectedElement,
  tableElements,
  onSelectElement,
  openBills,
  isEditing,
}) => {
  const groupedByXY = useMemo(() => {
    const groupedByX = groupBy(tableElements, el => el.posX);
    const groupedByPosition = Object.entries(groupedByX).reduce((out, [key, groupX]) => {
      return {
        ...out,
        [key]: keyBy(groupX, el => el.posY),
      };
    }, {} as Dictionary<Dictionary<TablePlanElement>>);
    return groupedByPosition;
  }, [tableElements]);

  const keyedOpenBills = useMemo(() => {
    return keyBy(openBills, bill => bill.reference);
  }, [openBills]);

  return (
    <VStack style={styles.grid}>
      {times(gridSize, row => {
        return (
          <HStack key={row} style={styles.row}>
            {times(gridSize, column => {
              // TODO: refactor these
              const el = groupedByXY?.[row]?.[column];
              const SVGComponent = el ? elementMap[el.type as TablePlanElementTypes] : null;
              const isSelected = selectedElement && selectedElement.y === column && selectedElement.x === row;
              const selectedStyles = isSelected ? styles.selected : {};
              const rotation = `${el?.rotation || 0}deg`;
              const bill = el?.billReference ? keyedOpenBills[el.billReference] : null;
              const color = el?.billReference ? (bill ? 'seagreen' : 'white') : 'white';
              const shouldRenderButton = isEditing && (!el || !SVGComponent);
              const shouldRenderSVG = el && SVGComponent;
              return (
                <VStack key={`${row}-${column}`} style={{ ...styles.col, ...selectedStyles }}>
                  <TouchableOpacity
                    onPress={() => {
                      onSelectElement({ x: row, y: column, tablePlanElement: el || null });
                    }}
                  >
                    {shouldRenderSVG && (
                      <Animated.View
                        style={{
                          transform: [{ rotate: rotation }],
                          backgroundColor: color,
                          ...styles.svgView,
                        }}
                      >
                        <SVGComponent width="100%" height="100%" />
                        {el.billReference && <Text style={styles.referenceText}>{el.billReference}</Text>}
                      </Animated.View>
                    )}
                    {shouldRenderButton && <NewButton colorScheme="light" style={{ ...styles.button, backgroundColor: 'white' }} />}
                  </TouchableOpacity>
                </VStack>
              );
            })}
          </HStack>
        );
      }}
    </VStack>
  );
};

export const TableViewer = React.memo(TableViewerInner);

const styles = StyleSheet.create({
  grid: {
    padding: GRID_SPACING,
    height: '100%',
    width: '100%',
  },
  row: {
    // paddingTop: GRID_SPACING,
    // paddingBottom: GRID_SPACING,
  },
  col: {
    // paddingLeft: GRID_SPACING,
    // paddingRight: GRID_SPACING,
    borderColor: 'whitesmoke',
    borderWidth: 1,
  },
  button: {
    height: '100%',
    width: '100%',
  },
  referenceText: {
    width: '100%',
    textAlign: 'center',
    position: 'absolute',
    zIndex: 10,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    alignSelf: 'center',
    fontSize: fontSizes[6],
  },
  selected: {
    borderColor: 'red',
  },
  svgView: {
    justifyContent: 'center',
    borderRadius: 5,
  },
});
