import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            PlaceholderView(title: "Домофоны")
                .tabItem { Label("Дом", systemImage: "house.fill") }
            PlaceholderView(title: "Камеры")
                .tabItem { Label("Камеры", systemImage: "video.fill") }
            PlaceholderView(title: "События")
                .tabItem { Label("События", systemImage: "clock.fill") }
            PlaceholderView(title: "ЖКХ")
                .tabItem { Label("ЖКХ", systemImage: "creditcard.fill") }
            PlaceholderView(title: "Чат")
                .tabItem { Label("Чат", systemImage: "bubble.left.fill") }
        }
    }
}

private struct PlaceholderView: View {
    let title: String
    var body: some View {
        NavigationStack {
            Text("В разработке")
                .navigationTitle(title)
        }
    }
}

#Preview {
    RootView()
}
