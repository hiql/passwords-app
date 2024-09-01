use passwords::{analyzer, scorer, PasswordGenerator};

mod syllables;
mod words;

#[tauri::command]
fn gen_password(length: usize, numbers: bool, symbols: bool, uppercase: bool) -> String {
    let pg = PasswordGenerator {
        length,
        numbers,
        lowercase_letters: true,
        uppercase_letters: uppercase,
        symbols,
        spaces: false,
        exclude_similar_characters: false,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            gen_password,
            gen_pin,
            gen_words,
            score
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
