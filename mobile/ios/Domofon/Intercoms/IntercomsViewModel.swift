import Foundation

@MainActor
final class IntercomsViewModel: ObservableObject {
    @Published var items: [IntercomDto] = []
    @Published var loading = false
    @Published var error: String?
    @Published var openingId: String?
    @Published var openedId: String?

    func refresh() {
        Task {
            loading = true
            error = nil
            do {
                items = try await APIClient.shared.intercoms()
            } catch {
                self.error = "Не удалось загрузить домофоны"
            }
            loading = false
        }
    }

    func openDoor(_ id: String) {
        Task {
            openingId = id
            openedId = nil
            do {
                _ = try await APIClient.shared.openDoor(intercomId: id)
                openedId = id
            } catch {
                self.error = "Не удалось открыть дверь"
            }
            openingId = nil
        }
    }
}
