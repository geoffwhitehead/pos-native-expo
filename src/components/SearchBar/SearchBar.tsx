import React from 'react';
import { StyleSheet } from 'react-native';
import { NewButton, HStack, Icon, Input, Text } from '../../core';
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
        <NewButton leftIcon={<Icon color="white" name={secondaryIconName} size={24}/>} size="small" colorScheme="info" onPress={onPressSecondary}>
          {secondaryText}
        </NewButton>
      )}
      <NewButton
        size='small'
        {...resolveButtonState(isCreateDisabled, 'success')}
        onPress={onPressCreate}
        isDisabled={isCreateDisabled}
        style={{ marginLeft: 5, alignSelf: 'center' }}
      >
        Create
      </NewButton>
    </HStack>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    paddingLeft: moderateScale(15),
    paddingRight: moderateScale(15),
  },
});
