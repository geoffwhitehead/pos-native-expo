import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export const useScreenDimensions = () => {
  const [screenData, setScreenData] = useState(Dimensions.get('screen'));

  useEffect(() => {
    const onChange = ({ screen }: { screen: ScaledSize }) => {
      setScreenData(screen);
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    return () => subscription.remove();
  }, []);

  return {
    ...screenData,
    isLandscape: screenData.width > screenData.height,
  };
};
