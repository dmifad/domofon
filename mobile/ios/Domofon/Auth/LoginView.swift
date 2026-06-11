import SwiftUI

struct LoginView: View {
    @ObservedObject var viewModel: AuthViewModel

    var body: some View {
        VStack(spacing: 16) {
            Text("Вход")
                .font(.largeTitle.bold())

            if !viewModel.codeSent {
                TextField("Номер телефона", text: $viewModel.phone)
                    .keyboardType(.phonePad)
                    .textFieldStyle(.roundedBorder)

                Button("Получить код") {
                    viewModel.requestCode()
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.loading || viewModel.phone.count < 11)
            } else {
                Text("Код отправлен на \(viewModel.phone)")
                    .font(.subheadline)

                TextField("Код из SMS", text: $viewModel.code)
                    .keyboardType(.numberPad)
                    .textFieldStyle(.roundedBorder)

                Button("Войти") {
                    viewModel.verifyCode()
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.loading || viewModel.code.count < 4)
            }

            if viewModel.loading {
                ProgressView()
            }

            if let error = viewModel.error {
                Text(error)
                    .foregroundStyle(.red)
                    .font(.footnote)
            }
        }
        .padding(24)
    }
}

#Preview {
    LoginView(viewModel: AuthViewModel())
}
