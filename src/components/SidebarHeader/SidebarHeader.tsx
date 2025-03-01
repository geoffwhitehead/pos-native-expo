import LottieView from 'lottie-react-native';
import React, { useContext, useEffect, useRef } from 'react';
import { LastSyncedAtContext } from '../../contexts/LastSyncedAtContext';
import { Button, HStack, Text, Title } from '../../core';
import { useSync } from '../../hooks/useSync';
import { Ionicons } from '@expo/vector-icons';

interface SidebarHeaderProps {
  title: string;
  onOpen: () => void;
  disableNav?: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title, onOpen, disableNav }) => {
  const animation = useRef();
  const { lastSyncedAt } = useContext(LastSyncedAtContext);
  const [isSyncing, doSync] = useSync();

  useEffect(() => {
    if (isSyncing) {
      animation.current.play();
    } else {
      animation.current.pause();
    }
  }, [isSyncing]);

  const lastSyncedAtText = lastSyncedAt ? lastSyncedAt.format('DD/MM/YYYY HH:mm') : '...';

  return (
      <HStack flex={1} alignItems="center" justifyContent="space-between">
        <HStack w="80px" justifyContent="flex-start">
          {!disableNav && (
            <Button transparent onPress={onOpen}>
              <Ionicons name="menu" size={24}/>
            </Button>
          )}
        </HStack>
        
        <HStack flex={1} justifyContent="center">
          <Title>{title}</Title>
        </HStack>
        
        <HStack w="200px" alignItems="center" justifyContent="flex-end">
          <Text style={{ lineHeight: 40 }} note>{`Last Sync: ${lastSyncedAtText}`}</Text>
          <Button transparent onPress={doSync}>
            <LottieView
              style={{ height: 40, width: 40 }}
              source={require('../../animations/1703-sync-icon.json')}
              autoPlay={false}
              loop={true}
              ref={animation}
            />
          </Button>
        </HStack>
      </HStack>
  );
};
