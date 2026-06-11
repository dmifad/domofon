import Foundation

@MainActor
final class EventsViewModel: ObservableObject {
    @Published var items: [EventDto] = []
    @Published var nextCursor: String?
    @Published var loading = false
    @Published var error: String?

    func refresh() {
        Task {
            loading = true
            error = nil
            do {
                let page = try await APIClient.shared.events()
                items = page.items
                nextCursor = page.nextCursor
            } catch {
                self.error = "Не удалось загрузить события"
            }
            loading = false
        }
    }

    func loadMore() {
        guard let cursor = nextCursor else { return }
        Task {
            do {
                let page = try await APIClient.shared.events(cursor: cursor)
                items += page.items
                nextCursor = page.nextCursor
            } catch {
                // pagination errors are non-fatal
            }
        }
    }
}
