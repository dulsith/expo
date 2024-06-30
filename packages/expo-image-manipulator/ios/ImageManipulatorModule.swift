// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import Photos
import UIKit
import ExpoModulesCore
import SDWebImageWebPCoder

public class ImageManipulatorModule: Module {
  typealias LoadImageCallback = (Result<UIImage, Error>) -> Void

  public func definition() -> ModuleDefinition {
    Name("ExpoImageManipulator")

    Function("loadImage") { (url: URL) in
      let context = ImageManipulatorContext { [weak appContext] in
        guard let appContext else {
          throw Exceptions.AppContextLost()
        }
        return try await loadImage(atUrl: url, appContext: appContext)
      }

      // Immediately try to fix the orientation once the image is loaded
      context.addTransformer(ImageFixOrientationTransformer())

      return context
    }

    Class("Context", ImageManipulatorContext.self) {
      Function("resize") { (manipulator, options: ResizeOptions) in
        return manipulator.addTransformer(ImageResizeTransformer(options: options))
      }

      Function("rotate") { (manipulator, rotate: Double) in
        return manipulator.addTransformer(ImageRotateTransformer(rotate: rotate))
      }

      Function("flip") { (manipulator, flipType: FlipType) in
        return manipulator.addTransformer(ImageFlipTransformer(flip: flipType))
      }

      Function("crop") { (manipulator, rect: CropRect) in
        return manipulator.addTransformer(ImageCropTransformer(options: rect))
      }

      AsyncFunction("renderAsync") { (context) -> ImageRef in
        let image = try await context.render()
        return ImageRef(image)
      }
    }

    Class("Image", ImageRef.self) {
      Property("width") { (image: ImageRef) -> Int in
        return image.pointer.cgImage?.width ?? 0
      }

      Property("height") { (image: ImageRef) -> Int in
        return image.pointer.cgImage?.height ?? 0
      }

      AsyncFunction("saveAsync") { (image: ImageRef, options: ManipulateOptions) in
        guard let appContext else {
          throw Exceptions.AppContextLost()
        }
        let result = try saveImage(image.pointer, options: options, appContext: appContext)

        // We're returning a dict instead of a path directly because in the future we'll replace it
        // with a shared ref to the file once this feature gets implemented in expo-file-system.
        // This should be fully backwards-compatible switch.
        return [
          "path": result.url.absoluteString,
          "uri": result.url.absoluteString,
          "width": image.pointer.cgImage?.width ?? 0,
          "height": image.pointer.cgImage?.height ?? 0,
          "base64": options.base64 ? result.data.base64EncodedString() : nil
        ]
      }
    }

    // Legacy API, first deprecated in SDK 52
    AsyncFunction("manipulateAsync") { (url: URL, actions: [ManipulateAction], options: ManipulateOptions) in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      let context = ImageManipulatorContext(appContext: appContext, url: url)

      context.applyOrientationFix()

      for action in actions {
        if let resize = action.resize {
          context.addTransformer(ImageResizeTransformer(options: resize))
        } else if let rotate = action.rotate {
          context.addTransformer(ImageRotateTransformer(rotate: rotate))
        } else if let flip = action.flip {
          context.addTransformer(ImageFlipTransformer(flip: flip))
        } else if let crop = action.crop {
          context.addTransformer(ImageCropTransformer(options: crop))
        }
      }

      let newImage = try await context.render()
      let saveResult = try saveImage(newImage, options: options, appContext: appContext)

      return [
        "uri": saveResult.url.absoluteString,
        "width": newImage.cgImage?.width ?? 0,
        "height": newImage.cgImage?.height ?? 0,
        "base64": options.base64 ? saveResult.data.base64EncodedString() : nil
      ]
    }
  }
}
