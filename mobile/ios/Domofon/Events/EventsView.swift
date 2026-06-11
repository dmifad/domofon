import SwiftUI

struct EventsView: View {
    @StateObject private var viewModel = EventsViewModel()

    private static let typeTitles: [String: String] = [
        "call.answered": "Звонок: отвечен",
        "call.missed": "Пропущенный звонок",
        "door.opened.app": "Дверь открыта из приложения",
        "door.opened.key": "Дверь открыта ключом",
        "door.opened.code": "Дверь открыта кодом",
        "system": "Системное событие"
    ]

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.loading && viewModel.items.isEmpty {
                    ProgressView()
                } else if viewModel.items.isEmpty {
                    ContentUnavailableView(
                        "Событий пока нет",
                        systemImage: "clock",
                        description: Text("Здесь появятся звонки и открытия двери")
                    )
                } else {
                    List {
                        ForEach(viewModel.items) { event in
                            EventRow(
                                title: Self.typeTitles[event.type] ?? event.type,
                                event: event
                            )
                        }
                        if viewModel.nextCursor != nil {
                            Button("Показать ещё") {
                                viewModel.loadMore()
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .refreshable { viewModel.refresh() }
                }
            }
            .navigationTitle("События")
            .onAppear { viewModel.refresh() }
        }
    }
}

private struct EventRow: View {
    let title: String
    let event: EventDto

    var body: some View {
        HStack(spacing: 12) {
            if let snapshot = event.snapshotUrl, let url = URL(string: snapshot) {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Color.secondary.opacity(0.2)
                }
                .frame(width: 56, height: 56)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.weight(.medium))
                Text(event.createdAt.replacingOccurrences(of: "T", with: " ").prefix(19))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    EventsView()
}
