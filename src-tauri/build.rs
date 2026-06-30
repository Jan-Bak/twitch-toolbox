fn main() {
    if let Ok(iter) = dotenvy::from_filename_iter(".env.local") {
        for item in iter.flatten() {
            println!("cargo:rustc-env={}={}", item.0, item.1);
        }
    }

    tauri_build::build();
}