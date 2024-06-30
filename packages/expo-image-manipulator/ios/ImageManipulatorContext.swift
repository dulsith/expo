// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ImageManipulatorContext: SharedObject {
  /**
   The last task added to the rendering pipeline.
   */
  private var currentTask: Task<UIImage, Error>

  /**
   Initializes a rendering context.
   */
  init(loader: @escaping () async throws -> UIImage) {
    currentTask = Task(priority: .background) {
      return try await loader()
    }
    super.init()
  }

  /**
   Adds an image transformer to run on the rendering context in the background.
   */
  @discardableResult
  internal func addTransformer(_ transformer: ImageTransformer) -> Self {
    currentTask = Task(priority: .background) { [currentTask] in
      let image = try await currentTask.value
      return try await transformer.transform(image: image)
    }
    return self
  }

  /**
   Awaits for the last processing task to finish and returns its result.
   */
  internal func render() async throws -> UIImage {
    return try await currentTask.value
  }
}

