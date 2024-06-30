import { NativeModule } from 'expo-modules-core';
import { Action, SaveOptions, Context } from './ImageManipulator.types';
export declare class ImageManipulatorModule extends NativeModule {
    Context: typeof Context;
    loadImage(url: string): Context;
    /**
     * @deprecated
     */
    manipulateAsync(uri: string, actions: Action[], saveOptions: SaveOptions): any;
}
export declare namespace ImageManipulatorModule {
}
declare const _default: ImageManipulatorModule;
export default _default;
//# sourceMappingURL=ExpoImageManipulator.d.ts.map