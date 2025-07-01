import XCTest
@testable import MasalMakinesi

final class MasalMakinesiTests: XCTestCase {
    
    // MARK: - Model Tests
    
    func testStoryThemeDisplayNames() {
        XCTAssertEqual(StoryTheme.adventure.displayName, "Macera")
        XCTAssertEqual(StoryTheme.friendship.displayName, "Dostluk")
        XCTAssertEqual(StoryTheme.learning.displayName, "Öğrenme")
        XCTAssertEqual(StoryTheme.fantasy.displayName, "Fantastik")
    }
    
    func testStoryLengthWordCounts() {
        XCTAssertEqual(StoryLength.short.wordCountRange, 100...200)
        XCTAssertEqual(StoryLength.medium.wordCountRange, 200...400)
        XCTAssertEqual(StoryLength.long.wordCountRange, 400...600)
    }
    
    func testStoryLengthDisplayNames() {
        XCTAssertEqual(StoryLength.short.displayName, "Kısa")
        XCTAssertEqual(StoryLength.medium.displayName, "Orta")
        XCTAssertEqual(StoryLength.long.displayName, "Uzun")
    }
    
    // MARK: - JSON Coding Tests
    
    func testStoryRequestJSONCoding() throws {
        let request = StoryRequest(
            childName: "Ahmet",
            age: 7,
            theme: .adventure,
            length: .medium,
            elements: ["köpek", "orman"],
            token: "test-token"
        )
        
        let encoder = JSONEncoder()
        let data = try encoder.encode(request)
        
        let decoder = JSONDecoder()
        let decodedRequest = try decoder.decode(StoryRequest.self, from: data)
        
        XCTAssertEqual(decodedRequest.childName, "Ahmet")
        XCTAssertEqual(decodedRequest.age, 7)
        XCTAssertEqual(decodedRequest.theme, .adventure)
        XCTAssertEqual(decodedRequest.length, .medium)
        XCTAssertEqual(decodedRequest.elements, ["köpek", "orman"])
        XCTAssertEqual(decodedRequest.token, "test-token")
    }
    
    func testStoryJSONCoding() throws {
        let story = Story(
            id: "story-123",
            title: "Ahmet'in Macerası",
            content: "Bir zamanlar...",
            childName: "Ahmet",
            theme: .adventure,
            length: .medium,
            wordCount: 250,
            createdAt: "2024-01-01T12:00:00Z"
        )
        
        let encoder = JSONEncoder()
        let data = try encoder.encode(story)
        
        let decoder = JSONDecoder()
        let decodedStory = try decoder.decode(Story.self, from: data)
        
        XCTAssertEqual(decodedStory.id, "story-123")
        XCTAssertEqual(decodedStory.title, "Ahmet'in Macerası")
        XCTAssertEqual(decodedStory.content, "Bir zamanlar...")
        XCTAssertEqual(decodedStory.childName, "Ahmet")
        XCTAssertEqual(decodedStory.theme, .adventure)
        XCTAssertEqual(decodedStory.length, .medium)
        XCTAssertEqual(decodedStory.wordCount, 250)
        XCTAssertEqual(decodedStory.createdAt, "2024-01-01T12:00:00Z")
    }
    
    // MARK: - Authentication Tests
    
    func testAuthenticationManagerSingleton() {
        let auth1 = AuthenticationManager.shared
        let auth2 = AuthenticationManager.shared
        
        XCTAssert(auth1 === auth2, "AuthenticationManager should be a singleton")
    }
    
    func testNetworkManagerSingleton() {
        let network1 = NetworkManager.shared
        let network2 = NetworkManager.shared
        
        XCTAssert(network1 === network2, "NetworkManager should be a singleton")
    }
    
    func testAPIClientSingleton() {
        let api1 = APIClient.shared
        let api2 = APIClient.shared
        
        XCTAssert(api1 === api2, "APIClient should be a singleton")
    }
    
    // MARK: - Network Error Tests
    
    func testNetworkErrorDescriptions() {
        XCTAssertEqual(NetworkError.invalidURL.errorDescription, "Invalid URL")
        XCTAssertEqual(NetworkError.invalidResponse.errorDescription, "Invalid response")
        XCTAssertEqual(NetworkError.httpError(404).errorDescription, "HTTP error: 404")
        XCTAssertEqual(NetworkError.testTokenNotAvailable.errorDescription, "Test token endpoint not available (production mode)")
    }
    
    func testNetworkErrorLocalizedDescriptions() {
        XCTAssertEqual(NetworkError.invalidURL.localizedErrorDescription, "Geçersiz URL")
        XCTAssertEqual(NetworkError.invalidResponse.localizedErrorDescription, "Geçersiz yanıt")
        XCTAssertEqual(NetworkError.noInternetConnection.localizedErrorDescription, "İnternet bağlantısı yok")
    }
    
    // MARK: - API Client Error Tests
    
    func testAPIClientErrorDescriptions() {
        XCTAssertEqual(APIClientError.notAuthenticated.errorDescription, "User not authenticated")
        XCTAssertEqual(APIClientError.quotaExceeded.errorDescription, "Daily quota exceeded")
        XCTAssertEqual(APIClientError.contentBlocked.errorDescription, "Content blocked by safety filters")
    }
    
    func testAPIClientErrorLocalizedDescriptions() {
        XCTAssertEqual(APIClientError.notAuthenticated.localizedErrorDescription, "Giriş yapmanız gerekiyor")
        XCTAssertEqual(APIClientError.quotaExceeded.localizedErrorDescription, "Günlük hikaye limiti aşıldı")
        XCTAssertEqual(APIClientError.contentBlocked.localizedErrorDescription, "İçerik güvenlik filtreleri tarafından engellendi")
    }
    
    // MARK: - Convenience API Tests
    
    func testConvenienceAPIExists() {
        // Test that the convenience API instance exists
        XCTAssertNotNil(MasalMakinesiAPI)
        XCTAssert(MasalMakinesiAPI === APIClient.shared)
    }
} 