import Foundation

// MARK: - Story Request & Response Models

/// Story generation request matching TypeScript StoryRequest
public struct StoryRequest: Codable, Sendable {
    /// Child's name to personalize the story
    public let childName: String
    /// Child's age (affects complexity and content)
    public let age: Int
    /// Preferred story theme
    public let theme: StoryTheme
    /// Preferred story length
    public let length: StoryLength
    /// Optional specific elements to include
    public let elements: [String]?
    /// User's JWT token for authentication
    public let token: String
    
    public init(
        childName: String,
        age: Int,
        theme: StoryTheme,
        length: StoryLength,
        elements: [String]? = nil,
        token: String
    ) {
        self.childName = childName
        self.age = age
        self.theme = theme
        self.length = length
        self.elements = elements
        self.token = token
    }
}

/// Story generation response matching TypeScript StoryResponse
public struct StoryResponse: Codable, Sendable {
    /// Generated story content
    public let story: Story
    /// Generation metadata
    public let metadata: StoryMetadata
    /// Success status
    public let success: Bool
    /// Error message if any
    public let error: String?
    
    public init(story: Story, metadata: StoryMetadata, success: Bool, error: String? = nil) {
        self.story = story
        self.metadata = metadata
        self.success = success
        self.error = error
    }
}

/// Story model matching TypeScript Story interface
public struct Story: Codable, Sendable, Identifiable {
    /// Unique story identifier
    public let id: String
    /// Story title
    public let title: String
    /// Main story content
    public let content: String
    /// Child's name (personalized)
    public let childName: String
    /// Story theme
    public let theme: StoryTheme
    /// Story length category
    public let length: StoryLength
    /// Word count
    public let wordCount: Int
    /// Creation timestamp
    public let createdAt: String
    /// TTS audio URL (if generated)
    public let audioUrl: String?
    
    public init(
        id: String,
        title: String,
        content: String,
        childName: String,
        theme: StoryTheme,
        length: StoryLength,
        wordCount: Int,
        createdAt: String,
        audioUrl: String? = nil
    ) {
        self.id = id
        self.title = title
        self.content = content
        self.childName = childName
        self.theme = theme
        self.length = length
        self.wordCount = wordCount
        self.createdAt = createdAt
        self.audioUrl = audioUrl
    }
}

/// Story generation metadata matching TypeScript StoryMetadata
public struct StoryMetadata: Codable, Sendable {
    /// Generation time in milliseconds
    public let generationTime: Int
    /// AI model used
    public let model: String
    /// Content safety score (0-1)
    public let safetyScore: Double
    /// Language detected/used
    public let language: StoryLanguage
    /// Version of prompt template used
    public let promptVersion: String
    
    public init(
        generationTime: Int,
        model: String,
        safetyScore: Double,
        language: StoryLanguage,
        promptVersion: String
    ) {
        self.generationTime = generationTime
        self.model = model
        self.safetyScore = safetyScore
        self.language = language
        self.promptVersion = promptVersion
    }
}

// MARK: - Enums

/// Story theme matching TypeScript StoryTheme enum
public enum StoryTheme: String, Codable, CaseIterable, Sendable {
    case adventure = "adventure"
    case friendship = "friendship"
    case learning = "learning"
    case fantasy = "fantasy"
    case animals = "animals"
    case family = "family"
    case nature = "nature"
    case music = "music"
    
    /// Localized display name for UI
    public var displayName: String {
        switch self {
        case .adventure: return "Macera"
        case .friendship: return "Dostluk"
        case .learning: return "Öğrenme"
        case .fantasy: return "Fantastik"
        case .animals: return "Hayvanlar"
        case .family: return "Aile"
        case .nature: return "Doğa"
        case .music: return "Müzik"
        }
    }
}

/// Story length matching TypeScript StoryLength enum
public enum StoryLength: String, Codable, CaseIterable, Sendable {
    case short = "short"      // ~100-200 words
    case medium = "medium"    // ~200-400 words
    case long = "long"        // ~400-600 words
    
    /// Localized display name for UI
    public var displayName: String {
        switch self {
        case .short: return "Kısa"
        case .medium: return "Orta"
        case .long: return "Uzun"
        }
    }
    
    /// Expected word count range
    public var wordCountRange: ClosedRange<Int> {
        switch self {
        case .short: return 100...200
        case .medium: return 200...400
        case .long: return 400...600
        }
    }
}

/// Language enum for story content
public enum StoryLanguage: String, Codable, Sendable {
    case turkish = "tr"
    case english = "en"
}

// MARK: - Error & Validation Models

/// Validation error matching TypeScript ValidationError
public struct ValidationError: Codable, Sendable {
    public let field: String
    public let message: String
    public let code: String
    
    public init(field: String, message: String, code: String) {
        self.field = field
        self.message = message
        self.code = code
    }
}

/// Safety check result matching TypeScript SafetyCheckResult
public struct SafetyCheckResult: Codable, Sendable {
    public let safe: Bool
    public let confidence: Double
    public let categories: [String]
    public let blockedTerms: [String]?
    
    public init(safe: Bool, confidence: Double, categories: [String], blockedTerms: [String]? = nil) {
        self.safe = safe
        self.confidence = confidence
        self.categories = categories
        self.blockedTerms = blockedTerms
    }
} 