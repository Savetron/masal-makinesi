import Foundation

// MARK: - Public Module Interface
// This file serves as the main entry point for the MasalMakinesi Swift Package

// MARK: - Convenience API

/// Global convenience instance for easy access
@available(iOS 15.0, macOS 12.0, *)
nonisolated public var MasalMakinesiAPI: APIClient { APIClient.shared }

/// Quick story generation function
@available(iOS 15.0, macOS 12.0, *)
public func generateStory(
    for childName: String,
    age: Int,
    theme: StoryTheme = .adventure,
    length: StoryLength = .medium,
    elements: [String]? = nil
) async throws -> Story {
    return try await MasalMakinesiAPI.generateStory(
        childName: childName,
        age: age,
        theme: theme,
        length: length,
        elements: elements
    )
}

/// Setup test authentication (development only)
@available(iOS 15.0, macOS 12.0, *)
public func setupTestMode() async throws {
    try await MasalMakinesiAPI.setupTestAuthentication()
}

/// Check if API is ready
@available(iOS 15.0, macOS 12.0, *)
public func isAPIReady() async -> Bool {
    return await MasalMakinesiAPI.isAPIReady()
} 