use std::{env, sync::Mutex};
use tauri::{command, Emitter, Window};
use tauri_plugin_oauth::start_with_config;

struct AppState {
    access_token: Mutex<Option<String>>,
    refresh_token: Mutex<Option<String>>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct TwitchTokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    token_type: String,
    scope: Option<Vec<String>>,
}


#[command]
async fn start_oauth_server(window: Window) -> Result<u16, String> {
    let config = tauri_plugin_oauth::OauthConfig {
        ports: Some(vec![3333, 3334, 3335]),
        response: Some(
            "<html><body><h2>User authenticated successfully. You can close this tab.</h2><script>setTimeout(() => window.close(), 300);</script></body></html>".into(),
        ),
    };

    start_with_config(config, move |url| {
        let _ = window.emit("twitch-oauth-redirect", url);
    })
    .map_err(|e| e.to_string())
}


#[command]
async fn exchange_twitch_code(code: String, port: u16) -> Result<TwitchTokenResponse, String> {
    let client = reqwest::Client::new();
    let client_id = env::var("TWITCH_CLIENT_ID")
        .map_err(|_| "TWITCH_CLIENT_ID is not set".to_string())?;
    let client_secret = env::var("TWITCH_CLIENT_SECRET")
        .map_err(|_| "TWITCH_CLIENT_SECRET is not set".to_string())?;

    let params = [
        ("client_id", client_id.as_str()),
        ("client_secret", client_secret.as_str()),
        ("code", code.as_str()),
        ("grant_type", "authorization_code"),
        ("redirect_uri", &format!("http://localhost:{}", port)),
    ];

    let response = client
        .post("https://id.twitch.tv/oauth2/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.map_err(|e| e.to_string())?;

        return Err(format!("Twitch token exchange failed ({status}): {body}"));
    }

    let token_response = response
        .json::<TwitchTokenResponse>()
        .await
        .map_err(|e| e.to_string())?;

    Ok(token_response)
}

#[command]
fn save_access_token(state: tauri::State<'_, AppState>, token: String) -> Result<(), String> {
    let mut guard = state.access_token.lock().map_err(|e| e.to_string())?;
    *guard = Some(token);
    Ok(())
}

#[command]
fn get_access_token(state: tauri::State<'_, AppState>) -> Result<Option<String>, String> {
    let guard = state.access_token.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

#[command]
fn clear_access_token(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut guard = state.access_token.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}

#[command]
fn save_refresh_token(state: tauri::State<'_, AppState>, token: String) -> Result<(), String> {
    let mut guard = state.refresh_token.lock().map_err(|e| e.to_string())?;
    *guard = Some(token);
    Ok(())
}

#[command]
fn get_refresh_token(state: tauri::State<'_, AppState>) -> Result<Option<String>, String> {
    let guard = state.refresh_token.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

#[command]
fn clear_refresh_token(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut guard = state.refresh_token.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::from_filename(".env.local");
    let _ = dotenvy::dotenv();

    tauri::Builder::default()
        .manage(AppState {
            access_token: Mutex::new(None),
            refresh_token: Mutex::new(None),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            start_oauth_server,
            exchange_twitch_code,
            save_access_token,
            get_access_token,
            clear_access_token,
            save_refresh_token,
            get_refresh_token,
            clear_refresh_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
