package ru.domofon.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint
import ru.domofon.app.auth.LoginScreen
import ru.domofon.app.auth.LoginViewModel
import ru.domofon.app.intercoms.IntercomsScreen
import ru.domofon.app.ui.theme.DomofonTheme

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DomofonTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    DomofonNavHost()
                }
            }
        }
    }
}

object Routes {
    const val LOGIN = "login"
    const val INTERCOMS = "intercoms"
}

@Composable
fun DomofonNavHost() {
    val navController = rememberNavController()
    val loginViewModel: LoginViewModel = hiltViewModel()
    val start = if (loginViewModel.state.value.loggedIn) Routes.INTERCOMS else Routes.LOGIN

    NavHost(navController = navController, startDestination = start) {
        composable(Routes.LOGIN) {
            LoginScreen(onLoggedIn = {
                navController.navigate(Routes.INTERCOMS) {
                    popUpTo(Routes.LOGIN) { inclusive = true }
                }
            })
        }
        composable(Routes.INTERCOMS) {
            IntercomsScreen()
        }
    }
}
