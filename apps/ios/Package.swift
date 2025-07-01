// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MasalMakinesi",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "MasalMakinesi",
            targets: ["MasalMakinesi"]
        ),
    ],
    dependencies: [
        // No external dependencies - using Foundation and SwiftUI only
    ],
    targets: [
        .target(
            name: "MasalMakinesi",
            dependencies: [],
            path: "Sources/MasalMakinesi",
            swiftSettings: [
                .enableUpcomingFeature("BareSlashRegexLiterals"),
                .enableUpcomingFeature("ConciseMagicFile"),
                .enableUpcomingFeature("ExistentialAny"),
                .enableUpcomingFeature("ForwardTrailingClosures"),
                .enableUpcomingFeature("ImplicitOpenExistentials"),
                .enableUpcomingFeature("StrictConcurrency"),
            ]
        ),
        .testTarget(
            name: "MasalMakinesiTests",
            dependencies: ["MasalMakinesi"],
            path: "Tests/MasalMakinesiTests"
        ),
    ]
) 