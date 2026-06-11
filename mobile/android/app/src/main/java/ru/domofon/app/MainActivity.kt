package ru.domofon.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint
import ru.domofon.app.auth.LoginScreen
import ru.domofon.app.auth.LoginViewModel
import ru.domofon.app.billing.BillingScreen
import ru.domofon.app.cameras.CamerasScreen
import ru.domofon.app.chat.ChatScreen
import ru.domofon.app.events.EventsScreen
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
    const val CAMERAS = "cameras"
    const val EVENTS = "events"
    const val BILLING = "billing"
    const val CHAT = "chat"
}

private data class Tab(val route: String, val title: String, val icon: ImageVector)

private val tabs = listOf(
    Tab(Routes.INTERCOMS, "Дом", Icons.Filled.Home),
    Tab(Routes.CAMERAS, "Камеры", Icons.Filled.Videocam),
    Tab(Routes.EVENTS, "События", Icons.Filled.Notifications),
    Tab(Routes.BILLING, "ЖКХ", Icons.Filled.CreditCard),
    Tab(Routes.CHAT, "Чат", Icons.Filled.Chat)
)

@Composable
fun DomofonNavHost() {
    val navController = rememberNavController()
    val loginViewModel: LoginViewModel = hiltViewModel()
    val start = if (loginViewModel.state.value.loggedIn) Routes.INTERCOMS else Routes.LOGIN

    val backStack by navController.currentBackStackEntryAsState()
    val currentDestination = backStack?.destination
    val showBottomBar = tabs.any { tab ->
        currentDestination?.hierarchy?.any { it.route == tab.route } == true
    }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = currentDestination?.hierarchy?.any { it.route == tab.route } == true,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(Routes.INTERCOMS)
                                    launchSingleTop = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.title) },
                            label = { Text(tab.title) }
                        )
                    }
                }
            }
        }
    ) { inner ->
        NavHost(
            navController = navController,
            startDestination = start,
            modifier = Modifier.padding(inner)
        ) {
            composable(Routes.LOGIN) {
                LoginScreen(onLoggedIn = {
                    navController.navigate(Routes.INTERCOMS) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                })
            }
            composable(Routes.INTERCOMS) { IntercomsScreen() }
            composable(Routes.CAMERAS) { CamerasScreen() }
            composable(Routes.EVENTS) { EventsScreen() }
            composable(Routes.BILLING) { BillingScreen() }
            composable(Routes.CHAT) { ChatScreen() }
        }
    }
}
