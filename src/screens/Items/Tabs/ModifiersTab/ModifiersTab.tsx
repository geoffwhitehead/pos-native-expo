import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Modal } from '../../../../components/Modal/Modal';
import { SearchBar } from '../../../../components/SearchBar/SearchBar';
import { Box, Container, HStack, Divider, Text, VStack } from '../../../../core';
import type { Modifier } from '../../../../models';
import { moderateScale } from '../../../../utils/scaling';
import { ModalModifierDetails, ModalModifierDetailsInner } from './ModalModifierDetails';
import { ModifierItems } from './ModifierItems';
import { ModifierRow } from './ModifierRow';

interface ModifiersTabOuterProps {
  database?: Database;
}

interface ModifiersTabInnerProps {
  modifiers: Modifier[];
}

const ModifierTabInner: React.FC<ModifiersTabOuterProps & ModifiersTabInnerProps> = ({ database, modifiers }) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedModifier, setSelectedModifier] = useState<Modifier>();

  const searchFilter = (modifier: Modifier, searchValue: string) =>
    modifier.name.toLowerCase().includes(searchValue.toLowerCase());

  const onCloseHandler = () => {
    setModalOpen(false);
  };

  const onViewModifier = async (modifier: Modifier) => {
    setSelectedModifier(modifier);
    setModalOpen(true);
  };

  const onSelectModifier = async (modifier: Modifier) => {
    setSelectedModifier(modifier);
  };

  const handleCreate = () => {
    setSelectedModifier(null);
    setModalOpen(true);
  };

  return (
    <Container>
      <VStack>
        <HStack>
          <Box>
            <Text>Modifiers</Text>
            <Divider style={styles.separator}  />
            <SearchBar value={searchValue} onPressCreate={handleCreate} onSearch={value => setSearchValue(value)} />
            <ScrollView>
              <VStack>
                {modifiers
                  .filter(modifier => searchFilter(modifier, searchValue))
                  .map((modifier, index) => {
                    const isSelected = modifier === selectedModifier;
                    return (
                      <ModifierRow
                        key={modifier.id}
                        index={index}
                        modifier={modifier}
                        onSelect={onSelectModifier}
                        onView={onViewModifier}
                        selected={isSelected}
                      />
                    );
                  })}
              </VStack>
            </ScrollView>
          </Box>
          <Box>
            <Text>Modifier Items</Text>
            <Divider style={styles.separator}/>
            {!selectedModifier && (
              <Text sub style={{ padding: 15 }}>
                Select a modifier to view the assigned items...{' '}
              </Text>
            )}

            {selectedModifier && (
              <ScrollView>
                <ModifierItems key={selectedModifier.id} modifier={selectedModifier} />
              </ScrollView>
            )}
          </Box>
        </HStack>
      </VStack>
      <Modal isOpen={modalOpen} onClose={onCloseHandler}>
        {selectedModifier ? (
          <ModalModifierDetails modifier={selectedModifier} onClose={onCloseHandler} />
        ) : (
          <ModalModifierDetailsInner modifier={selectedModifier} onClose={onCloseHandler} />
        )}
      </Modal>
    </Container>
  );
};

export const ModifiersTab = withDatabase(
  withObservables<ModifiersTabOuterProps, ModifiersTabInnerProps>([], ({ database }) => ({
    modifiers: database.collections.get<Modifier>('modifiers').query(),
  }))(ModifierTabInner),
);

const styles = StyleSheet.create({
  separator: {
    maxHeight: moderateScale(45),
  },
});
