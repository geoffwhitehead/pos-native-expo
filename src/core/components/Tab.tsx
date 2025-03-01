import React from 'react';
import { Box } from 'native-base';

export interface TabProps {
  heading: string;
  tabStyle?: any;
  textStyle?: any;
  activeTabStyle?: any;
  activeTextStyle?: any;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <Box flex={1}>{children}</Box>;
};
