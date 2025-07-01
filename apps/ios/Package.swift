// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MasalMakinesi",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "MasalMakinesi",
            targets: ["MasalMakinesi"]
        ),
    ],
    dependencies: [
        // Add future dependencies here
    ],
    targets: [
        .target(
            name: "MasalMakinesi",
            dependencies: []
        ),
        .testTarget(
            name: "MasalMakinesiTests",
            dependencies: ["MasalMakinesi"]
        ),
    ]
) 