import SwiftUI

struct IncomingCallView: View {
    let remoteName: String
    let onAnswer: () -> Void
    let onDecline: () -> Void

    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            Text("Звонок с домофона")
                .font(.title.bold())
            Text(remoteName)
                .font(.largeTitle)
            Spacer()

            HStack(spacing: 40) {
                Button(action: onDecline) {
                    Image(systemName: "phone.down.fill")
                        .font(.title)
                        .padding(24)
                        .background(Color.red, in: Circle())
                        .foregroundStyle(.white)
                }
                Button(action: onAnswer) {
                    Image(systemName: "phone.fill")
                        .font(.title)
                        .padding(24)
                        .background(Color.green, in: Circle())
                        .foregroundStyle(.white)
                }
            }
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.thinMaterial)
    }
}

struct InCallView: View {
    let onOpenDoor: () -> Void
    let onHangup: () -> Void
    @State private var opened = false
    @State private var opening = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Text("В разговоре").font(.title2.bold())

            Button(action: openDoor) {
                HStack {
                    if opening { ProgressView() }
                    Image(systemName: opened ? "checkmark.circle.fill" : "lock.open.fill")
                    Text(opened ? "Дверь открыта" : "Открыть дверь")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.green)
            .padding(.horizontal, 32)

            Button(action: onHangup) {
                Label("Завершить", systemImage: "phone.down.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.red)
            .padding(.horizontal, 32)

            Spacer()
        }
        .background(.thinMaterial)
    }

    private func openDoor() {
        opening = true
        onOpenDoor()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            opening = false
            opened = true
        }
    }
}
