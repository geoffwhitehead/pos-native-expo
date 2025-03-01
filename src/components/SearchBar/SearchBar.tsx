import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, HStack, Icon, Input, Text } from '../../core';
import { resolveButtonState } from '../../utils/helpers';
import { moderateScale } from '../../utils/scaling';

type SearchBarProps = {
  onSearch: (value: string) => void;
  value: string;
  onPressCreate?: () => void;
  isCreateDisabled?: boolean;
  onPressSecondary?: () => void;
  secondaryText?: string;
  secondaryIconName?: string;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  value,
  onPressSecondary,
  secondaryText,
  onPressCreate,
  isCreateDisabled,
  secondaryIconName,
  children,
  ...props
}) => {
  return (
    <HStack {...props} style={styles.searchBar}>
      <Icon name="search" size={24} color="white"/>
      <Input placeholder="Search" onChangeText={onSearch} value={value} />
      {children}
      {onPressSecondary && (
        <Button iconLeft small info onPress={onPressSecondary}>
          {secondaryIconName && <Icon color="white" name={secondaryIconName} size={24}/>}
          <Text>{secondaryText}</Text>
        </Button>
      )}
      <Button
        iconLeft
        small
        {...resolveButtonState(isCreateDisabled, 'success')}
        onPress={onPressCreate}
        disabled={isCreateDisabled}
        style={{ marginLeft: 5, alignSelf: 'center' }}
      >
        <Text>Create</Text>
      </Button>
    </HStack>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    paddingLeft: moderateScale(15),
    paddingRight: moderateScale(15),
  },
});
