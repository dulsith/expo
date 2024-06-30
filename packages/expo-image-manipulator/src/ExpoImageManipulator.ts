import { NativeModule, requireNativeModule } from 'expo-modules-core';

import { Action, SaveOptions, Context, ImageRef } from './ImageManipulator.types';

export declare class ImageManipulatorModule extends NativeModule {
  Context: typeof Context;

  loadImage(url: string): Context;

  /**
   * @deprecated
   */
  manipulateAsync(uri: string, actions: Action[], saveOptions: SaveOptions);
}

export namespace ImageManipulatorModule {
  declare class Dupa {}
}

export default requireNativeModule<ImageManipulatorModule>('ExpoImageManipulator');
