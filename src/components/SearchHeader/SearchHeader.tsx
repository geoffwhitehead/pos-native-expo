import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { useNavigation } from '@react-navigation/native';
import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { PriceGroupContext } from '../../contexts/PriceGroupContext';
import { FormControl, HStack, Icon, Input, Select, Text } from '../../core';
import type { PriceGroup } from '../../models';
import { moderateScale } from '../../utils/scaling';
import { tableNames } from '../../models/tableNames';

interface SearchHeaderOuterProps {
  onChangeText: (value: string) => void;
  value: string;
  database: Database;
  showPriceGroup?: boolean;
}

interface SearchHeaderInnerProps {
  onChangeText: (value: string) => void;
  value: string;
  priceGroups: PriceGroup[];
}

export const WrappedSearchHeader: React.FC<SearchHeaderOuterProps & SearchHeaderInnerProps> = ({
  priceGroups,
  onChangeText,
  value = '',
  showPriceGroup,
  ...props
}) => {
  const { priceGroup, setPriceGroup } = useContext(PriceGroupContext);
  const navigation = useNavigation();

  // const onChangePriceGroup = () => {
  //   const options = [...priceGroups.map(({ name }) => name), 'Cancel'];
  //   const cancelIndex = options.length - 1;
  //   ActionSheet.show(
  //     {
  //       options,
  //       title: 'Please select a price group',
  //     },
  //     index => {
  //       /**
  //        * need to use set params to allow propgation through stack navigation. Everywhere else can use context hook.
  //        */
  //       if (index !== cancelIndex) {
  //         navigation.setParams({
  //           priceGroupId: priceGroups[index].id,
  //         });
  //         setPriceGroup(priceGroups[index]);
  //       }
  //     },
  //   );
  // };

  const handleChangePriceGroup = priceGroupId => {
    const priceGroup = priceGroups.find(priceGroup => priceGroup.id === priceGroupId);
    navigation.setParams({
      priceGroupId,
    });
    setPriceGroup(priceGroup);
  };

  return (
    <HStack {...props} style={styles.searchBar}>
      <Icon name="search" size={24}  color="white"/>
      <Input placeholder="Search" onChangeText={onChangeText} value={value} />
      {showPriceGroup && (
        <FormControl.Label>
          <Text style={{ color: 'grey' }}>Price Group: </Text>
        </FormControl.Label>
      )}
      {showPriceGroup && (
        <Select
          placeholder="Select a price group"
          dropdownIcon={<Icon name="chevron-down-outline"  color="white"/>}
          selectedValue={priceGroup.id}
          onValueChange={handleChangePriceGroup}
          style={{
            paddingLeft: 0,
            paddingRight: 0,
          }}
        >
          {priceGroups.map(({ id, name }) => {
            return <Select.Item key={id} label={name} value={id} />;
          })}
        </Select>
      )}
    </HStack>
  );
};

export const SearchHeader = withDatabase(
  withObservables<SearchHeaderOuterProps, SearchHeaderInnerProps>([], ({ database }) => ({
    priceGroups: database.collections.get(tableNames.priceGroups).query(),
  }))(WrappedSearchHeader),
);

const styles = StyleSheet.create({
  searchBar: {
    paddingLeft: moderateScale(15),
    paddingRight: moderateScale(15),
  },
});
