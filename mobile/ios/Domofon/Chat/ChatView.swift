import SwiftUI

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var apartmentId: String?
    @Published var messages: [ChatMessageDto] = []
    @Published var announcements: [AnnouncementDto] = []
    @Published var input = ""
    @Published var error: String?

    private var pollTask: Task<Void, Never>?

    /// MVP: REST + поллинг каждые 5 с. TODO: Socket.IO (socket.io-client-swift).
    func start() {
        pollTask?.cancel()
        pollTask = Task {
            do {
                let links = try await APIClient.shared.apartments()
                apartmentId = links.first?.apartment.id
                announcements = try await APIClient.shared.announcements()
            } catch {
                self.error = "Не удалось загрузить чат"
                return
            }
            guard let apartmentId else { return }

            while !Task.isCancelled {
                if let page = try? await APIClient.shared.chatMessages(apartmentId: apartmentId) {
                    messages = page.items.reversed()
                }
                try? await Task.sleep(nanoseconds: 5_000_000_000)
            }
        }
    }

    func stop() {
        pollTask?.cancel()
    }

    func send() {
        guard let apartmentId, !input.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        let text = input
        input = ""
        Task {
            do {
                let message = try await APIClient.shared.sendMessage(apartmentId: apartmentId, text: text)
                messages.append(message)
            } catch {
                self.error = "Не удалось отправить"
            }
        }
    }
}

struct ChatView: View {
    @StateObject private var viewModel = ChatViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if let announcement = viewModel.announcements.first {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(announcement.title).font(.subheadline.weight(.semibold))
                        Text(announcement.body).font(.caption)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(.yellow.opacity(0.15))
                }

                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(viewModel.messages) { message in
                                MessageBubble(message: message)
                                    .id(message.id)
                            }
                        }
                        .padding(12)
                    }
                    .onChange(of: viewModel.messages.count) { _, _ in
                        if let last = viewModel.messages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }

                HStack(spacing: 8) {
                    TextField("Сообщение…", text: $viewModel.input)
                        .textFieldStyle(.roundedBorder)
                    Button("Отпр.") { viewModel.send() }
                        .buttonStyle(.borderedProminent)
                        .disabled(viewModel.input.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(12)
            }
            .navigationTitle("Чат с УК")
            .onAppear { viewModel.start() }
            .onDisappear { viewModel.stop() }
        }
    }
}

private struct MessageBubble: View {
    let message: ChatMessageDto

    private var fromUk: Bool { message.userId == nil }

    var body: some View {
        HStack {
            if !fromUk { Spacer(minLength: 48) }
            Text(message.text)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    fromUk ? Color(.systemGray5) : Color.accentColor.opacity(0.2),
                    in: RoundedRectangle(cornerRadius: 12)
                )
            if fromUk { Spacer(minLength: 48) }
        }
        .frame(maxWidth: .infinity, alignment: fromUk ? .leading : .trailing)
    }
}

#Preview {
    ChatView()
}
