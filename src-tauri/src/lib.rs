use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Manager};

#[derive(Serialize, Deserialize, Debug)]
pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub created_at: String,
    pub path: String,
}

#[command]
pub async fn save_to_file(
    app: AppHandle,
    filename: String,
    content: String,
) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;

    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("创建目录失败: {}", e))?;

    let file_path = app_dir.join(&filename);
    fs::write(&file_path, content)
        .map_err(|e| format!("写入文件失败: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

#[command]
pub async fn read_from_file(
    app: AppHandle,
    filename: String,
) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;

    let file_path = app_dir.join(&filename);
    if !file_path.exists() {
        return Err(format!("文件不存在: {}", filename));
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    Ok(content)
}

#[command]
pub async fn delete_file(
    app: AppHandle,
    filename: String,
) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;

    let file_path = app_dir.join(&filename);
    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("删除文件失败: {}", e))?;
    }

    Ok(())
}

#[command]
pub async fn list_files(
    app: AppHandle,
    extension: Option<String>,
) -> Result<Vec<FileInfo>, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;

    if !app_dir.exists() {
        return Ok(Vec::new());
    }

    let mut files = Vec::new();
    for entry in fs::read_dir(&app_dir)
        .map_err(|e| format!("读取目录失败: {}", e))?
    {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = &extension {
                if path.extension().and_then(|e| e.to_str()) != Some(ext) {
                    continue;
                }
            }

            let metadata = entry.metadata()
                .map_err(|e| format!("获取元数据失败: {}", e))?;

            let name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            let created_at = metadata
                .created()
                .ok()
                .and_then(|t| {
                    let datetime: chrono::DateTime<chrono::Local> = t.into();
                    Some(datetime.format("%Y-%m-%d %H:%M:%S").to_string())
                })
                .unwrap_or_else(|| "未知".to_string());

            files.push(FileInfo {
                name,
                size: metadata.len(),
                created_at,
                path: path.to_string_lossy().to_string(),
            });
        }
    }

    files.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(files)
}

#[command]
pub async fn get_storage_info(
    app: AppHandle,
) -> Result<(u64, u64, String), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;

    let mut total_size: u64 = 0;
    let mut file_count: u64 = 0;

    if app_dir.exists() {
        for entry in fs::read_dir(&app_dir)
            .map_err(|e| format!("读取目录失败: {}", e))?
        {
            let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = entry.metadata() {
                    total_size += metadata.len();
                    file_count += 1;
                }
            }
        }
    }

    let path_str = app_dir.to_string_lossy().to_string();
    Ok((total_size, file_count, path_str))
}

#[command]
pub async fn export_backup(
    app: AppHandle,
    content: String,
) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用目录失败: {}", e))?;

    let backup_dir = app_dir.join("backups");
    fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("创建备份目录失败: {}", e))?;

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let filename = format!("insurance_backup_{}.json", timestamp);
    let file_path = backup_dir.join(&filename);

    fs::write(&file_path, content)
        .map_err(|e| format!("写入备份失败: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

#[command]
pub async fn import_backup(
    file_path: String,
) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("备份文件不存在".to_string());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("读取备份失败: {}", e))?;

    Ok(content)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        save_to_file,
        read_from_file,
        delete_file,
        list_files,
        get_storage_info,
        export_backup,
        import_backup,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
