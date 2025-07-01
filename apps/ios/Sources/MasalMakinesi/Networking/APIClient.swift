import Foundation

// MARK: - API Client

/// High-level API client that combines networking and authentication
@available(iOS 15.0, macOS 12.0, *)
@MainActor
public final class APIClient: ObservableObject {
    
    // MARK: - Properties
    
    /// Network manager for HTTP requests
    private let networkManager: NetworkManager
    
    /// Authentication manager for token handling
    private let authManager: AuthenticationManager
    
    /// Loading state for UI
    @Published public private(set) var isLoading: Bool = false
    
    /// Last error for UI display
    @Published public private(set) var lastError: (any Error)?
    
    // MARK: - Singleton
    
    public static let shared = APIClient()
    
    private init() {
        self.networkManager = NetworkManager.shared
        self.authManager = AuthenticationManager.shared
    }
    
    // MARK: - Public API Methods
    
    /// Generate a story with automatic authentication
    public func generateStory(
        childName: String,
        age: Int,
        theme: StoryTheme,
        length: StoryLength,
        elements: [String]? = nil
    ) async throws -> Story {
        setLoading(true)
        defer { setLoading(false) }
        
        // Get valid token
        guard let token = await authManager.getValidToken() else {
            throw APIClientError.notAuthenticated
        }
        
        // Create request
        let request = StoryRequest(
            childName: childName,
            age: age,
            theme: theme,
            length: length,
            elements: elements,
            token: token
        )
        
        do {
            // Make network request
            let response = try await networkManager.generateStory(request)
            clearError()
            return response.story
        } catch {
            setError(error)
            throw error
        }
    }
    
    /// Check API health
    public func checkAPIHealth() async throws -> Bool {
        do {
            let health = try await networkManager.checkHealth()
            clearError()
            return health.success && health.checks.gemini && health.checks.supabase
        } catch {
            setError(error)
            throw error
        }
    }
    
    /// Setup authentication for development/testing
    public func setupTestAuthentication() async throws {
        setLoading(true)
        defer { setLoading(false) }
        
        do {
            // Try to get test token from API
            let tokenResponse = try await networkManager.getTestToken()
            await authManager.setToken(tokenResponse.token)
            clearError()
        } catch NetworkError.testTokenNotAvailable {
            // Production mode - create local test token
            _ = await authManager.createTestToken()
            clearError()
        } catch {
            setError(error)
            throw error
        }
    }
    
    /// Sign out user
    public func signOut() async {
        await authManager.signOut()
        clearError()
    }
    
    /// Get current authentication state
    public var isAuthenticated: Bool {
        authManager.isAuthenticated
    }
    
    /// Get current user ID
    public var currentUserId: String? {
        authManager.currentUserId
    }
    
    // MARK: - Private Helpers
    
    /// Set loading state on main thread
    private func setLoading(_ loading: Bool) {
        if Thread.isMainThread {
            isLoading = loading
        } else {
            Task { @MainActor in
                isLoading = loading
            }
        }
    }
    
    /// Set error on main thread
    private func setError(_ error: any Error) {
        if Thread.isMainThread {
            lastError = error
        } else {
            Task { @MainActor in
                lastError = error
            }
        }
    }
    
    /// Clear error on main thread
    private func clearError() {
        if Thread.isMainThread {
            lastError = nil
        } else {
            Task { @MainActor in
                lastError = nil
            }
        }
    }
}

// MARK: - API Client Errors

/// High-level API client errors
public enum APIClientError: LocalizedError, Sendable {
    case notAuthenticated
    case invalidCredentials
    case networkUnavailable
    case serverMaintenance
    case quotaExceeded
    case contentBlocked
    
    public var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "User not authenticated"
        case .invalidCredentials:
            return "Invalid credentials"
        case .networkUnavailable:
            return "Network unavailable"
        case .serverMaintenance:
            return "Server under maintenance"
        case .quotaExceeded:
            return "Daily quota exceeded"
        case .contentBlocked:
            return "Content blocked by safety filters"
        }
    }
    
    public var localizedErrorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Giriş yapmanız gerekiyor"
        case .invalidCredentials:
            return "Geçersiz kimlik bilgileri"
        case .networkUnavailable:
            return "İnternet bağlantısı yok"
        case .serverMaintenance:
            return "Sunucu bakımda"
        case .quotaExceeded:
            return "Günlük hikaye limiti aşıldı"
        case .contentBlocked:
            return "İçerik güvenlik filtreleri tarafından engellendi"
        }
    }
}

// MARK: - Convenience Extensions

extension APIClient {
    
    /// Quick story generation with minimal parameters
    public func generateQuickStory(
        for childName: String,
        age: Int,
        theme: StoryTheme = .adventure
    ) async throws -> Story {
        return try await generateStory(
            childName: childName,
            age: age,
            theme: theme,
            length: .medium
        )
    }
    
    /// Check if API is ready for story generation
    public func isAPIReady() async -> Bool {
        do {
            return try await checkAPIHealth() && isAuthenticated
        } catch {
            return false
        }
    }
} 