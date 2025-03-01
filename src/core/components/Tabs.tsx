import React, { useState } from 'react';
import { Box, useColorModeValue, Pressable } from 'native-base';
import { Dimensions, Animated } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import type { TabProps } from './Tab';

export interface TabsProps {
  children: React.ReactElement<TabProps>[];
  tabBarStyle?: any;
  tabStyle?: any;
  textStyle?: any;
  activeTabStyle?: any;
  activeTextStyle?: any;
}

export const Tabs: React.FC<TabsProps> = ({
  children,
  tabBarStyle,
  tabStyle,
  textStyle,
  activeTabStyle,
  activeTextStyle,
}) => {
  const [index, setIndex] = useState(0);

  // Create routes from children
  const routes = React.Children.map(children, (child, i) => ({
    key: `tab-${i}`,
    title: child.props.heading
  }));

  // Create scene map
  const scenes = {};
  React.Children.forEach(children, (child, i) => {
    scenes[`tab-${i}`] = () => child;
  });

  const renderScene = SceneMap(scenes);

  const renderTabBar = props => {
    const inputRange = props.navigationState.routes.map((x, i) => i);
    return (
      <Box flexDirection="row" {...tabBarStyle}>
        {props.navigationState.routes.map((route, i) => {
          const opacity = props.position.interpolate({
            inputRange,
            outputRange: inputRange.map(inputIndex => inputIndex === i ? 1 : 0.5)
          });
          const color = index === i 
            ? useColorModeValue('#000', '#e5e5e5') 
            : useColorModeValue('#1f2937', '#a1a1aa');
          const borderColor = index === i 
            ? 'cyan.500' 
            : useColorModeValue('coolGray.200', 'gray.400');
          
          return (
            <Box 
              key={route.key}
              borderBottomWidth="3" 
              borderColor={borderColor} 
              flex={1} 
              alignItems="center" 
              p="3"
              {...tabStyle}
              {...(i === index && activeTabStyle)}
            >
              <Pressable onPress={() => setIndex(i)}>
                <Animated.Text 
                  style={{
                    color,
                    opacity,
                    ...(textStyle || {}),
                    ...(i === index ? activeTextStyle || {} : {})
                  }}
                >
                  {route.title}
                </Animated.Text>
              </Pressable>
            </Box>
          );
        })}
      </Box>
    );
  };

  const initialLayout = {
    width: Dimensions.get('window').width
  };

  return (
    <TabView
      navigationState={{
        index,
        routes
      }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
    />
  );
};
