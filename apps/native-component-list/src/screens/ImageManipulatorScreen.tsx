import Ionicons from '@expo/vector-icons/Ionicons';
import { Asset } from 'expo-asset';
import ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useReducer } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import Colors from '../constants/Colors';

interface State {
  ready: boolean;
  image?: Asset | ImageManipulator.ImageResult | ImagePicker.ImagePickerAsset;
  original?: Asset;
  imagePath?: string;
  context?: ImageManipulator.Context;
}

ImageManipulatorScreen.navigationOptions = {
  title: 'ImageManipulator',
};

export default function ImageManipulatorScreen() {
  const [state, setState] = useReducer((s: State, a: Partial<State>) => ({ ...s, ...a }), {
    ready: false,
  });

  useEffect(() => {
    const image = Asset.fromModule(require('../../assets/images/example2.jpg'));

    image.downloadAsync().then(() => {
      const context = ImageManipulator.loadImage(image.uri);

      setState({
        ready: true,
        image,
        original: image,
        context,
      });
    });
  }, []);

  const renderImage = () => {
    const height = state.image?.height && state.image?.height < 300 ? state.image?.height : 300;
    const width = state.image?.width && state.image?.width < 300 ? state.image?.width : 300;

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: (state.image! as Asset).localUri || state.image!.uri }}
          style={[styles.image, { height, width }]}
        />
      </View>
    );
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to MEDIA_LIBRARY not granted!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
    });
    if (result.canceled) {
      alert('No image selected!');
      return;
    }
    setState({ image: result.assets[0] });
  };

  const rotate = async (deg: number) => {
    // await manipulate([{ rotate: deg }], {
    //   format: ImageManipulator.SaveFormat.PNG,
    // });
    const image = await ImageManipulator.default
      .load(state.image!.uri!)
      .rotate(deg)
      .generateAsync();
    const saveResult = await image.saveAsync({});
    setState({ image: saveResult });
  };

  const resize = async (size: { width?: number; height?: number }) => {
    // await manipulate([{ resize: size }]);
    const image = await ImageManipulator.default
      .load(state.image!.uri!)
      .resize(size)
      .generateAsync();
    const saveResult = await image.saveAsync({});
    setState({ image: saveResult });
  };

  const flip = async (flip: ImageManipulator.FlipType) => {
    // await manipulate([{ flip }]);
    const image = await ImageManipulator.default.load(state.image!.uri).flip(flip).generateAsync();
    const saveResult = await image.saveAsync({});
    setState({ image: saveResult });
  };

  const compress = async (compress: number) => {
    // await manipulate([], { compress });
    const image = await ImageManipulator.default.load(state.image!.uri).generateAsync();
    const saveResult = await image.saveAsync({ compress });
    setState({ image: saveResult });
  };

  const crop = async () => {
    // await manipulate([
    //   {
    //     crop: {
    //       originX: 0,
    //       originY: 0,
    //       width: state.image!.width! / 2,
    //       height: state.image!.height!,
    //     },
    //   },
    // ]);
    const image = await ImageManipulator.default
      .load(state.image!.uri)
      .crop({
        originX: 0,
        originY: 0,
        width: state.image!.width! / 2,
        height: state.image!.height! / 2,
      })
      .generateAsync();
    const saveResult = await image.saveAsync({ format: ImageManipulator.SaveFormat.JPEG });
    setState({ image: saveResult });
  };

  const combo = async () =>
    await manipulate([
      { rotate: 180 },
      { flip: ImageManipulator.FlipType.Vertical },
      {
        crop: {
          originX: state.image!.width! / 4,
          originY: state.image!.height! / 4,
          width: state.image!.width! / 2,
          height: state.image!.width! / 2,
        },
      },
    ]);

  const reset = () => setState({ image: state.original });

  const manipulate = async (
    actions: ImageManipulator.Action[],
    saveOptions?: ImageManipulator.SaveOptions
  ) => {
    const { image } = state;
    const manipResult = await ImageManipulator.manipulateAsync(
      (image! as Asset).localUri || image!.uri,
      actions,
      saveOptions
    );
    setState({ image: manipResult });
  };

  async function test() {
    await testLegacyAPI(state.image!.uri);
    await testModernAPI(state.image!.uri);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ padding: 10 }}>
        <View style={styles.actionsButtons}>
          <Button style={styles.button} onPress={() => rotate(90)}>
            <Ionicons name="refresh" size={16} color="#ffffff" /> 90
          </Button>
          <Button style={styles.button} onPress={() => rotate(45)}>
            45
          </Button>
          <Button style={styles.button} onPress={() => rotate(-90)}>
            -90
          </Button>
          <Button style={styles.button} onPress={() => flip(ImageManipulator.FlipType.Horizontal)}>
            Flip horizontal
          </Button>
          <Button style={styles.button} onPress={() => flip(ImageManipulator.FlipType.Vertical)}>
            Flip vertical
          </Button>
          <Button style={styles.button} onPress={() => resize({ width: 250 })}>
            Resize width
          </Button>
          <Button style={styles.button} onPress={() => resize({ width: 300, height: 300 })}>
            Resize both to square
          </Button>
          <Button style={styles.button} onPress={() => compress(0.1)}>
            90% compression
          </Button>
          <Button style={styles.button} onPress={crop}>
            Crop - half image
          </Button>
          <Button style={styles.button} onPress={combo}>
            Cccombo
          </Button>
        </View>

        {state.ready && renderImage()}
        <View style={styles.footerButtons}>
          <Button style={styles.button} onPress={pickPhoto}>
            Pick a photo
          </Button>
          <Button style={styles.button} onPress={reset}>
            Reset photo
          </Button>
          <Button style={styles.button} onPress={test}>
            Run tests
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

async function testLegacyAPI(uri: string) {
  const timeStart = performance.now();
  await ImageManipulator.manipulateAsync(uri, [
    {
      resize: {
        width: 300,
        height: 300,
      },
    },
    {
      rotate: 90,
    },
    {
      resize: {
        width: 250,
      },
    },
    {
      flip: ImageManipulator.FlipType.Horizontal,
    },
    {
      flip: ImageManipulator.FlipType.Vertical,
    },
  ]);
  const timeEnd = performance.now();
  console.log(`testLegacyAPI: ${timeEnd - timeStart}`);
}

async function testModernAPI(uri: string) {
  const timeStart = performance.now();
  const image = await ImageManipulator.default
    .load(uri)
    .resize({ width: 300, height: 300 })
    .rotate(90)
    .resize({ width: 250 })
    .flip(ImageManipulator.FlipType.Horizontal)
    .flip(ImageManipulator.FlipType.Vertical)
    .generateAsync();
  await image.saveAsync({});
  const timeEnd = performance.now();
  console.log(`testModernAPI: ${timeEnd - timeStart}`);
}

const Button: React.FunctionComponent<TouchableOpacityProps> = ({ onPress, style, children }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
    <Text style={styles.buttonText}>{children}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'contain',
  },
  button: {
    padding: 8,
    borderRadius: 3,
    backgroundColor: Colors.tintColor,
    marginRight: 10,
    marginBottom: 10,
  },
  actionsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
  },
});
