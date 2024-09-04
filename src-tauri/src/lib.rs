use base64::{prelude::BASE64_STANDARD, Engine};
use passwords::{analyzer, scorer, PasswordGenerator};
use sha2::{Digest, Sha256, Sha512};
use zxcvbn::zxcvbn;
use tauri::menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri_plugin_shell::ShellExt;

mod syllables;
mod words;

#[tauri::command]
fn gen_password(
    length: usize,
    numbers: bool,
    symbols: bool,
    uppercase: bool,
    exclude_similar_characters: bool,
) -> String {
    let pg = PasswordGenerator {
        length,
        numbers,
        lowercase_letters: true,
        uppercase_letters: uppercase,
        symbols,
        spaces: false,
        exclude_similar_characters,
        strict: true,
    };
    pg.generate_one().unwrap()
}

#[tauri::command]
fn gen_pin(length: usize) -> String {
    let pg = PasswordGenerator {
        length,
        numbers: true,
        lowercase_letters: false,
        uppercase_letters: false,
        symbols: false,
        spaces: false,
        exclude_similar_characters: false,
        strict: true,
    };
    pg.generate_one().unwrap()
}

#[tauri::command]
fn gen_words(length: usize, full_words: bool) -> Vec<&'static str> {
    let max = if length > 256 { 256 } else { length };
    let mut words: Vec<&str> = vec![];
    let mut i = 0;

    while i < max {
        let word = if full_words {
            words::rand()
        } else {
            syllables::rand()
        };

        let found = words.iter().find(|&&x| *x == *word);
        if found.is_some() {
            continue;
        }

        words.push(word);
        i += 1;
    }

    words
}

#[tauri::command]
fn score(password: &str) -> f64 {
    scorer::score(&analyzer::analyze(password))
}

#[tauri::command]
fn is_common_password(password: &str) -> bool {
    analyzer::is_common_password(password)
}

#[tauri::command]
fn md5(password: &str) -> String {
    let digest = md5::compute(password.as_bytes());
    format!("{:x}", digest)
}

#[tauri::command]
fn bcrypt(password: &str) -> String {
    bcrypt::hash(&password, 10).unwrap()
}

#[tauri::command]
fn base64(password: &str) -> String {
    BASE64_STANDARD.encode(password.as_bytes())
}

#[tauri::command]
fn sha256(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

#[tauri::command]
fn sha512(password: &str) -> String {
    let mut hasher = Sha512::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

#[tauri::command]
fn crack_times(password: &str) -> String {
    let entropy = zxcvbn(password, &[]);
    entropy.crack_times().offline_slow_hashing_1e4_per_second().to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let github = MenuItemBuilder::new("Github").id("github").build(app)?;
            let app_submenu = SubmenuBuilder::new(app, "App")
                .about(Some(AboutMetadata {
                    ..Default::default()
                }))
                .separator()
                .item(&github)
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .quit()
                .build()?;
            let menu = MenuBuilder::new(app).items(&[&app_submenu]).build()?;

            app.set_menu(menu)?;
            app.on_menu_event(move |app, event| {
                if event.id() == github.id() {
                    let _ = app
                        .shell()
                        .open("https://github.com/hiql/passwords-app", None);
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            gen_password,
            gen_pin,
            gen_words,
            score,
            is_common_password,
            md5,
            base64,
            bcrypt,
            sha256,
            sha512,
            crack_times
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_gen_words() {
        let words = gen_words(15, true);
        println!("{:?}", words);
        let words = gen_words(8, false);
        println!("{:?}", words);
    }
}
