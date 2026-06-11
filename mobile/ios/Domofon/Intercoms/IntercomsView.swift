import SwiftUI

struct IntercomsView: View {
    @StateObject private var viewModel = IntercomsViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.loading && viewModel.items.isEmpty {
                    ProgressView()
                } else if viewModel.items.isEmpty {
                    ContentUnavailableView(
                        "Нет домофонов",
                        systemImage: "house",
                        description: Text("Привяжите квартиру по лицевому счёту")
                    )
                } else {
                    List(viewModel.items) { intercom in
                        IntercomRow(
                            intercom: intercom,
                            opening: viewModel.openingId == intercom.id,
                            justOpened: viewModel.openedId == intercom.id
                        ) {
                            viewModel.openDoor(intercom.id)
                        }
                    }
                    .refreshable { viewModel.refresh() }
                }
            }
            .navigationTitle("Домофоны")
            .onAppear { viewModel.refresh() }
            .overlay(alignment: .bottom) {
                if let error = viewModel.error {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .padding(.bottom, 8)
                }
            }
        }
    }
}

private struct IntercomRow: View {
    let intercom: IntercomDto
    let opening: Bool
    let justOpened: Bool
    let onOpen: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(intercom.name)
                .font(.headline)
            Text("\(intercom.building.city), \(intercom.building.address)")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            HStack {
                Text(justOpened ? "Дверь открыта" : intercom.status)
                    .font(.caption)
                    .foregroundStyle(justOpened ? .green : .secondary)
                Spacer()
                Button(opening ? "Открываем…" : "Открыть дверь", action: onOpen)
                    .buttonStyle(.borderedProminent)
                    .disabled(opening)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    IntercomsView()
}
