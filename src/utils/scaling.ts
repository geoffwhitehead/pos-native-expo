import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

//Guideline sizes are based on landscape ipad air 2
const guidelineBaseWidth = 2224;
const guidelineBaseHeight = 1668;

const scale = (size: number) => {
  return (width / guidelineBaseWidth) * size;
};
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export { scale, verticalScale, moderateScale };
