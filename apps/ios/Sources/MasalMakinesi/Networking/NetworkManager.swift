import Foundation

// MARK: - Network Manager

/// Modern async/await network manager for Masal Makinesi API
@available(iOS 15.0, macOS 12.0, *)
public final class NetworkManager: Sendable {
    
    // MARK: - Properties
    
    /// API base URL
    private let baseURL: URL
    
    /// URLSession for network requests
    private let session: URLSession
    
    /// JSON decoder with custom date formatting
    private let decoder: JSONDecoder
    
    /// JSON encoder with custom date formatting
    private let encoder: JSONEncoder
    
    // MARK: - Singleton
    
    public static let shared = NetworkManager()
    
    private init() {
        // Production API URL
        self.baseURL = URL(string: "https://masal-makinesi-api-production.up.railway.app/api")!
        
        // Configure URLSession
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: configuration)
        
        // Configure JSON decoder
        self.decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        // Configure JSON encoder
        self.encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - Public API Methods
    
    /// Generate a new story
    public func generateStory(_ request: StoryRequest) async throws -> StoryResponse {
        let endpoint = "/story"
        let url = baseURL.appendingPathComponent(endpoint)
        
        // Create HTTP request
        var httpRequest = URLRequest(url: url)
        httpRequest.httpMethod = "POST"
        httpRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        httpRequest.setValue("Bearer \(request.token)", forHTTPHeaderField: "Authorization")
        
        // Encode request body
        httpRequest.httpBody = try encoder.encode(request)
        
        // Perform request
        let (data, response) = try await session.data(for: httpRequest)
        
        // Validate response
        try validateHTTPResponse(response)
        
        // Decode response
        let storyResponse = try decoder.decode(StoryResponse.self, from: data)
        
        if !storyResponse.success {
            throw NetworkError.apiError(storyResponse.error ?? "Unknown error")
        }
        
        return storyResponse
    }
    
    /// Check API health status
    public func checkHealth() async throws -> HealthResponse {
        let endpoint = "/health"
        let url = baseURL.appendingPathComponent(endpoint)
        
        var httpRequest = URLRequest(url: url)
        httpRequest.httpMethod = "GET"
        
        let (data, response) = try await session.data(for: httpRequest)
        
        // Health check might return 503 for degraded status
        if let httpResponse = response as? HTTPURLResponse {
            guard httpResponse.statusCode == 200 || httpResponse.statusCode == 503 else {
                throw NetworkError.httpError(httpResponse.statusCode)
            }
        }
        
        return try decoder.decode(HealthResponse.self, from: data)
    }
    
    /// Get test JWT token (development only)
    public func getTestToken(userId: String = "ios-test-user", email: String = "ios@test.com") async throws -> TestTokenResponse {
        let endpoint = "/test-token"
        let url = baseURL.appendingPathComponent(endpoint)
        
        var httpRequest = URLRequest(url: url)
        httpRequest.httpMethod = "POST"
        httpRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody = TestTokenRequest(userId: userId, email: email)
        httpRequest.httpBody = try encoder.encode(requestBody)
        
        let (data, response) = try await session.data(for: httpRequest)
        
        // This endpoint returns 404 in production (expected)
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 404 {
            throw NetworkError.testTokenNotAvailable
        }
        
        try validateHTTPResponse(response)
        
        return try decoder.decode(TestTokenResponse.self, from: data)
    }
    
    // MARK: - Private Helpers
    
    /// Validate HTTP response status code
    private func validateHTTPResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw NetworkError.httpError(httpResponse.statusCode)
        }
    }
}

// MARK: - Response Models

/// Health check response
public struct HealthResponse: Codable, Sendable {
    public let success: Bool
    public let checks: HealthChecks
    public let status: String
    
    public struct HealthChecks: Codable, Sendable {
        public let gemini: Bool
        public let supabase: Bool
        public let timestamp: String
    }
}

/// Test token request
public struct TestTokenRequest: Codable, Sendable {
    public let userId: String
    public let email: String
    
    public init(userId: String, email: String) {
        self.userId = userId
        self.email = email
    }
}

/// Test token response
public struct TestTokenResponse: Codable, Sendable {
    public let success: Bool
    public let token: String
    public let userId: String
    public let email: String
    public let expiresIn: String
    public let note: String?
}

// MARK: - Network Errors

/// Network layer errors
public enum NetworkError: LocalizedError, Sendable {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case decodingError(any Error)
    case encodingError(any Error)
    case apiError(String)
    case testTokenNotAvailable
    case noInternetConnection
    
    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        case .encodingError(let error):
            return "Encoding error: \(error.localizedDescription)"
        case .apiError(let message):
            return "API error: \(message)"
        case .testTokenNotAvailable:
            return "Test token endpoint not available (production mode)"
        case .noInternetConnection:
            return "No internet connection"
        }
    }
    
    public var localizedErrorDescription: String? {
        switch self {
        case .invalidURL:
            return "Geçersiz URL"
        case .invalidResponse:
            return "Geçersiz yanıt"
        case .httpError(let code):
            return "Bağlantı hatası: \(code)"
        case .decodingError:
            return "Veri işleme hatası"
        case .encodingError:
            return "Veri gönderme hatası"
        case .apiError(let message):
            return "API hatası: \(message)"
        case .testTokenNotAvailable:
            return "Test modu kullanılamıyor"
        case .noInternetConnection:
            return "İnternet bağlantısı yok"
        }
    }
} 