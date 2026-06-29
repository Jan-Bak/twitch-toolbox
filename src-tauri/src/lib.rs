use std::{env, sync::Mutex};
use tauri::{command, Emitter, Window};
use tauri_plugin_oauth::start_with_config;
use tokio::{sync::oneshot, task::JoinHandle};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct TwitchUserResponse {
    data: Vec<TwitchUser>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct TwitchUser {
    id: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct TwitchChatMessageResponse {
    data: Vec<TwitchChatMessageResult>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct TwitchChatMessageResult {
    message_id: String,
    is_sent: bool,
    drop_reason: Option<TwitchDropReason>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct TwitchDropReason {
    code: String,
    message: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct TwitchChatMessageRequest {
    broadcaster_id: String,
    sender_id: String,
    message: String,
}

fn twitch_client_id() -> Result<String, String> {
    env::var("TWITCH_CLIENT_ID")
        .or_else(|_| env::var("VITE_TWITCH_CLIENT_ID"))
        .map_err(|_| "TWITCH_CLIENT_ID is not set".to_string())
}

fn emit_rust_error(window: &Window, title: &str, description: Option<&str>) {
    let payload = serde_json::json!({
        "title": title,
        "description": description.unwrap_or(""),
    });

    let _ = window.emit("tauri-api-error", payload);
}

fn emit_error<T>(window: &Window, title: &str, result: Result<T, String>) -> Result<T, String> {
    result.map_err(|error| {
        emit_rust_error(window, title, Some(&error));
        error
    })
}

async fn resolve_twitch_user_id_with_access_token(
    access_token: &str,
    login: &str,
) -> Result<Option<String>, String> {
    let client = reqwest::Client::new();
    let normalized_login = login.trim().to_lowercase();
    let url = reqwest::Url::parse_with_params(
        "https://api.twitch.tv/helix/users",
        &[("login", normalized_login.as_str())],
    )
    .map_err(|e| e.to_string())?;

    let response = client
        .get(url)
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Client-Id", twitch_client_id()?)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Failed to resolve Twitch user id ({})", response.status()));
    }

    let payload = response.json::<TwitchUserResponse>().await.map_err(|e| e.to_string())?;
    Ok(payload.data.into_iter().find_map(|user| user.id))
}

async fn get_authenticated_twitch_user_id(access_token: &str) -> Result<Option<String>, String> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.twitch.tv/helix/users")
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Client-Id", twitch_client_id()?)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Failed to resolve authenticated Twitch user id ({})", response.status()));
    }

    let payload = response.json::<TwitchUserResponse>().await.map_err(|e| e.to_string())?;
    Ok(payload.data.into_iter().find_map(|user| user.id))
}

async fn send_twitch_chat_message_with_access_token(
    access_token: &str,
    broadcaster_id: &str,
    sender_id: &str,
    message: &str,
) -> Result<TwitchChatMessageResponse, String> {
    let client = reqwest::Client::new();
    let request_body = TwitchChatMessageRequest {
        broadcaster_id: broadcaster_id.to_string(),
        sender_id: sender_id.to_string(),
        message: message.to_string(),
    };

    let response = client
        .post("https://api.twitch.tv/helix/chat/messages")
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Client-Id", twitch_client_id()?)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.map_err(|e| e.to_string())?;
        return Err(format!("Failed to send Twitch chat message ({status}): {body}"));
    }

    response.json::<TwitchChatMessageResponse>().await.map_err(|e| e.to_string())
}

fn format_loop_message(template: &str, iteration: u64) -> (String, u64) {
    let mut result = template.to_string();
    let has_post_increment = result.contains("{{i++}}");
    let has_pre_increment = result.contains("{{++i}}");
    let mut current = iteration;

    if has_pre_increment {
        current = current.saturating_add(1);
        result = result.replace("{{++i}}", &current.to_string());
    }

    let rendered_current = current.to_string();
    result = result.replace("{{i++}}", &rendered_current);
    result = result.replace("{{i}}", &rendered_current);
    result = result.replace("{{count}}", &rendered_current);
    result = result.replace("{{index}}", &rendered_current);

    if has_post_increment {
        current = current.saturating_add(1);
    }

    (result, current)
}

struct AppState {
    access_token: Mutex<Option<String>>,
    refresh_token: Mutex<Option<String>>,
    loop_writer_task: Mutex<Option<JoinHandle<()>>>,
    loop_writer_cancel: Mutex<Option<oneshot::Sender<()>>>,
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
async fn exchange_twitch_code(window: Window, code: String, port: u16) -> Result<TwitchTokenResponse, String> {
    let client = reqwest::Client::new();
    let client_id = twitch_client_id()?;
    let client_secret = env::var("TWITCH_CLIENT_SECRET")
        .map_err(|_| "TWITCH_CLIENT_SECRET is not set".to_string())?;

    let params = [
        ("client_id", client_id.as_str()),
        ("client_secret", client_secret.as_str()),
        ("code", code.as_str()),
        ("grant_type", "authorization_code"),
        ("redirect_uri", &format!("http://localhost:{}", port)),
    ];

    let response = emit_error(
        &window,
        "Twitch code exchange failed",
        client
            .post("https://id.twitch.tv/oauth2/token")
            .form(&params)
            .send()
            .await
            .map_err(|e| e.to_string()),
    )?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.map_err(|e| {
            let error = e.to_string();
            emit_rust_error(&window, "Twitch code exchange failed", Some(&error));
            error
        })?;

        let error_message = format!("Twitch token exchange failed ({status}): {body}");
        emit_rust_error(&window, "Twitch code exchange failed", Some(&error_message));
        return Err(error_message);
    }

    let token_response = emit_error(
        &window,
        "Failed to parse Twitch token response",
        response.json::<TwitchTokenResponse>().await.map_err(|e| e.to_string()),
    )?;

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
#[command]
async fn resolve_twitch_user_id(
    state: tauri::State<'_, AppState>,
    login: String,
) -> Result<Option<String>, String> {
    let access_token = {
        let guard = state.access_token.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };

    let Some(access_token) = access_token else {
        return Ok(None);
    };

    resolve_twitch_user_id_with_access_token(&access_token, &login).await
}

#[command]
async fn send_twitch_chat_message(
    state: tauri::State<'_, AppState>,
    broadcaster_id: String,
    sender_id: String,
    message: String,
) -> Result<TwitchChatMessageResponse, String> {
    let access_token = {
        let guard = state.access_token.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };

    let Some(access_token) = access_token else {
        return Err("No Twitch access token available".to_string());
    };

    send_twitch_chat_message_with_access_token(&access_token, &broadcaster_id, &sender_id, &message).await
}

#[command]
async fn start_loop_writer_job(
    window: Window,
    state: tauri::State<'_, AppState>,
    channel: String,
    message: String,
    hours: u64,
    minutes: u64,
    seconds: u64,
) -> Result<serde_json::Value, String> {
    let access_token = {
        let guard = state.access_token.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };

    let Some(access_token) = access_token else {
        return Err("No Twitch access token available".to_string());
    };

    let broadcaster_id = resolve_twitch_user_id_with_access_token(&access_token, &channel).await?;
    let Some(broadcaster_id) = broadcaster_id else {
        return Err(format!("Could not resolve broadcaster id for channel {}", channel));
    };

    let sender_id = get_authenticated_twitch_user_id(&access_token).await?;
    let Some(sender_id) = sender_id else {
        return Err("Could not resolve the authenticated Twitch user id".to_string());
    };

    let interval_secs = hours * 3600 + minutes * 60 + seconds;
    if interval_secs == 0 {
        return Err("The selected interval must be greater than zero".to_string());
    }

    let interval_label = format!("{}h {}m {}s", hours, minutes, seconds);
    let task_access_token = access_token.clone();
    let task_broadcaster_id = broadcaster_id.clone();
    let task_sender_id = sender_id.clone();
    let task_message = message.clone();
    let task_window = window.clone();

    let mut existing_sender = state.loop_writer_cancel.lock().map_err(|e| e.to_string())?;
    if existing_sender.is_some() {
        return Err("A loop writer is already running".to_string());
    }

    let (cancel_sender, cancel_receiver) = oneshot::channel::<()>();
    let handle = tokio::spawn(async move {
        let mut cancel_receiver = cancel_receiver;
        let mut iteration: u64 = 1;

        loop {
            let (rendered_message, next_iteration) = format_loop_message(&task_message, iteration);
            iteration = next_iteration;

            let send_result = send_twitch_chat_message_with_access_token(
                &task_access_token,
                &task_broadcaster_id,
                &task_sender_id,
                &rendered_message,
            )
            .await;

            if let Err(error) = send_result {
                let _ = task_window.emit("twitch-loop-writer-error", error);
            }

            tokio::select! {
                _ = tokio::time::sleep(std::time::Duration::from_secs(interval_secs)) => {}
                _ = &mut cancel_receiver => break,
            }
        }
    });

    *existing_sender = Some(cancel_sender);
    let mut task_handle_guard = state.loop_writer_task.lock().map_err(|e| e.to_string())?;
    *task_handle_guard = Some(handle);

    Ok(serde_json::json!({
        "cronExpression": interval_label,
        "broadcasterId": broadcaster_id,
        "senderId": sender_id,
        "message": message
    }))
}

#[command]
async fn stop_loop_writer_job(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let sender = {
        let mut guard = state.loop_writer_cancel.lock().map_err(|e| e.to_string())?;
        guard.take()
    };

    if let Some(sender) = sender {
        let _ = sender.send(());
        let mut handle_guard = state.loop_writer_task.lock().map_err(|e| e.to_string())?;
        *handle_guard = None;
        Ok(())
    } else {
        Err("No active loop writer is running".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::from_filename(".env.local");
    let _ = dotenvy::dotenv();

    tauri::Builder::default()
        .manage(AppState {
            access_token: Mutex::new(None),
            refresh_token: Mutex::new(None),
            loop_writer_task: Mutex::new(None),
            loop_writer_cancel: Mutex::new(None),
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
            resolve_twitch_user_id,
            send_twitch_chat_message,
            start_loop_writer_job,
            stop_loop_writer_job,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
