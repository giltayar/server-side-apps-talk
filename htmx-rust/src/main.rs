use axum::{
    extract::{Path, Query, State, Form},
    response::{Html, Redirect, IntoResponse},
    routing::{get, post},
    Router,
};
use askama::Template;
use serde::{Deserialize, Serialize};
use tokio::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Default)]
struct Todo {
    id: i64,
    title: String,
    notes: String,
    completed: bool,
}

#[derive(Clone)]
struct AppState {
    data_dir: PathBuf,
}

impl AppState {
    async fn read_all(&self) -> Vec<Todo> {
        let path = self.data_dir.join("todos.json");
        tokio::time::sleep(std::time::Duration::from_millis(40)).await;
        match fs::read_to_string(&path).await {
            Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| vec![]),
            Err(_) => vec![],
        }
    }

    async fn write_all(&self, todos: &[Todo]) {
        let _ = fs::create_dir_all(&self.data_dir).await;
        let path = self.data_dir.join("todos.json");
        let content = serde_json::to_string_pretty(todos).unwrap();
        let _ = fs::write(path, content).await;
    }
}

#[derive(Template)]
#[template(path = "todomvc.html")]
struct TodoMvcTemplate {
    visible_todos: Vec<Todo>,
    total_count: usize,
    completed_count: usize,
    remaining: usize,
    filter: String,
}

#[derive(Template)]
#[template(path = "item.html")]
struct ItemTemplate {
    todo: Todo,
    error: String,
}

#[derive(Deserialize)]
struct FilterQuery {
    filter: Option<String>,
}

#[derive(Deserialize)]
struct CreateForm {
    title: Option<String>,
    filter: Option<String>,
}

#[derive(Deserialize)]
struct ToggleForm {
    filter: Option<String>,
}

#[derive(Deserialize)]
struct UpdateForm {
    title: Option<String>,
    notes: Option<String>,
    completed: Option<String>,
}

async fn list_todos(
    State(state): State<AppState>,
    Query(query): Query<FilterQuery>,
) -> impl IntoResponse {
    let todos = state.read_all().await;
    let total_count = todos.len();
    let completed_count = todos.iter().filter(|t| t.completed).count();
    let filter = query.filter.unwrap_or_default();
    
    let visible_todos = match filter.as_str() {
        "active" => todos.into_iter().filter(|t| !t.completed).collect(),
        "completed" => todos.into_iter().filter(|t| t.completed).collect(),
        _ => todos,
    };
    
    let template = TodoMvcTemplate {
        visible_todos,
        total_count,
        completed_count,
        remaining: total_count - completed_count,
        filter,
    };
    
    Html(template.render().unwrap())
}

async fn create_todo(
    State(state): State<AppState>,
    Form(form): Form<CreateForm>,
) -> impl IntoResponse {
    let title = form.title.unwrap_or_default().trim().to_string();
    if !title.is_empty() {
        let mut todos = state.read_all().await;
        let next_id = todos.iter().map(|t| t.id).max().unwrap_or(0) + 1;
        todos.push(Todo {
            id: next_id,
            title,
            notes: String::new(),
            completed: false,
        });
        state.write_all(&todos).await;
    }
    
    let filter = form.filter.unwrap_or_default();
    let query = if filter.is_empty() { String::new() } else { format!("?filter={}", filter) };
    Redirect::to(&format!("/{}", query)).into_response()
}

async fn delete_todo(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Form(form): Form<ToggleForm>,
) -> impl IntoResponse {
    let mut todos = state.read_all().await;
    todos.retain(|t| t.id != id);
    state.write_all(&todos).await;

    let filter = form.filter.unwrap_or_default();
    let query = if filter.is_empty() { String::new() } else { format!("?filter={}", filter) };
    Redirect::to(&format!("/{}", query)).into_response()
}

async fn toggle_todo(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Form(form): Form<ToggleForm>,
) -> impl IntoResponse {
    let mut todos = state.read_all().await;
    if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
        todo.completed = !todo.completed;
        state.write_all(&todos).await;
    }

    let filter = form.filter.unwrap_or_default();
    let query = if filter.is_empty() { String::new() } else { format!("?filter={}", filter) };
    Redirect::to(&format!("/{}", query)).into_response()
}

async fn clear_completed(
    State(state): State<AppState>,
    Form(form): Form<ToggleForm>,
) -> impl IntoResponse {
    let mut todos = state.read_all().await;
    todos.retain(|t| !t.completed);
    state.write_all(&todos).await;

    let filter = form.filter.unwrap_or_default();
    let query = if filter.is_empty() { String::new() } else { format!("?filter={}", filter) };
    Redirect::to(&format!("/{}", query)).into_response()
}

async fn delete_all(
    State(state): State<AppState>,
) -> impl IntoResponse {
    state.write_all(&[]).await;
    Redirect::to("/")
}

async fn get_item(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    let todos = state.read_all().await;
    if let Some(todo) = todos.into_iter().find(|t| t.id == id) {
        Html(ItemTemplate { todo, error: String::new() }.render().unwrap()).into_response()
    } else {
        (axum::http::StatusCode::NOT_FOUND, "Not Found").into_response()
    }
}

async fn update_item(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Form(form): Form<UpdateForm>,
) -> impl IntoResponse {
    let title = form.title.unwrap_or_default().trim().to_string();
    let notes = form.notes.unwrap_or_default().trim().to_string();
    let completed = form.completed.as_deref() == Some("true");

    if title.is_empty() {
        return Redirect::to("/").into_response();
    }

    if !notes.is_empty() && notes.len() < 4 {
        let template = ItemTemplate {
            todo: Todo {
                id,
                title,
                notes,
                completed,
            },
            error: "Notes must be at least 4 characters long".to_string(),
        };
        let mut response = Html(template.render().unwrap()).into_response();
        response.headers_mut().insert("HX-Retarget", axum::http::HeaderValue::from_static(".edit-form"));
        response.headers_mut().insert("HX-Reselect", axum::http::HeaderValue::from_static(".edit-form"));
        return response;
    }

    let mut todos = state.read_all().await;
    if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
        todo.title = title;
        todo.notes = notes;
        todo.completed = completed;
        state.write_all(&todos).await;
    }

    Redirect::to("/").into_response()
}

async fn health() -> impl IntoResponse {
    axum::Json(serde_json::json!({}))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let data_dir = std::env::var("DATA_DIR")
        .unwrap_or_else(|_| ".data".to_string())
        .into();
        
    let state = AppState { data_dir };

    let static_files = tower_http::services::ServeDir::new("public");
    let dist_files = tower_http::services::ServeDir::new("dist");

    let app = Router::new()
        .route("/", get(list_todos))
        .route("/new", post(create_todo))
        .route("/delete/:id", post(delete_todo))
        .route("/toggle/:id", post(toggle_todo))
        .route("/clear-completed", post(clear_completed))
        .route("/delete-all", get(delete_all))
        .route("/item/:id", get(get_item).post(update_item))
        .route("/health", get(health))
        .fallback_service(static_files)
        .nest_service("/dist", dist_files)
        .with_state(state);

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse()
        .unwrap_or(3000);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port)).await.unwrap();
    println!("Listening on port {}", port);
    axum::serve(listener, app).await.unwrap();
}
