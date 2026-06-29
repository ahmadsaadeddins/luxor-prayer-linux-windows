use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    LogicalSize, Manager, PhysicalPosition, Size,
};
use tauri_plugin_autostart::ManagerExt;

const COMPACT_WIDTH: f64 = 172.0;
const COMPACT_HEIGHT: f64 = 50.0;
const EXPANDED_WIDTH: f64 = 340.0;
const EXPANDED_HEIGHT: f64 = 520.0;

#[cfg(target_os = "linux")]
fn linux_set_size_request(window: &tauri::WebviewWindow, width: i32, height: i32) {
    use gtk::prelude::WidgetExt;
    let _ = window.with_webview(move |webview| {
        webview.inner().set_size_request(width, height);
    });
}

fn apply_window_size(window: &tauri::WebviewWindow, width: f64, height: f64) {
    let size = Size::Logical(LogicalSize::new(width, height));
    let _ = window.set_min_size(Some(size));
    let _ = window.set_max_size(Some(size));
    let _ = window.set_size(size);
    #[cfg(target_os = "linux")]
    linux_set_size_request(window, width as i32, height as i32);
}

fn set_compact_size(window: &tauri::WebviewWindow) {
    apply_window_size(window, COMPACT_WIDTH, COMPACT_HEIGHT);
}

fn set_expanded_size(window: &tauri::WebviewWindow) {
    apply_window_size(window, EXPANDED_WIDTH, EXPANDED_HEIGHT);
}

#[tauri::command]
fn set_window_expanded(window: tauri::WebviewWindow, expanded: bool) {
    if expanded {
        set_expanded_size(&window);
    } else {
        set_compact_size(&window);
    }
}

fn ensure_on_screen(window: &tauri::WebviewWindow) {
    let Ok(monitors) = window.available_monitors() else {
        return;
    };
    if monitors.is_empty() {
        return;
    }

    let Ok(pos) = window.outer_position() else {
        return;
    };
    let Ok(size) = window.outer_size() else {
        return;
    };

    let on_screen = monitors.iter().any(|m| {
        let mp = m.position();
        let ms = m.size();
        pos.x < mp.x + ms.width as i32
            && pos.x + size.width as i32 > mp.x
            && pos.y < mp.y + ms.height as i32
            && pos.y + size.height as i32 > mp.y
    });

    if on_screen {
        return;
    }

    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| monitors.into_iter().next());

    if let Some(monitor) = monitor {
        let mp = monitor.position();
        let ms = monitor.size();
        let x = mp.x + (ms.width as i32 - size.width as i32) / 2;
        let y = mp.y + (ms.height as i32 - size.height as i32) / 4;
        let _ = window.set_position(PhysicalPosition::new(x.max(mp.x), y.max(mp.y)));
    }
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        set_compact_size(&window);
        ensure_on_screen(&window);
        let _ = window.set_always_on_top(true);
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn toggle_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            show_main_window(app);
        }
    }
}

fn toggle_autostart(app: &tauri::AppHandle) {
    let autolaunch = app.autolaunch();
    match autolaunch.is_enabled() {
        Ok(true) => {
            let _ = autolaunch.disable();
        }
        _ => {
            let _ = autolaunch.enable();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }))
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![set_window_expanded])
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "إظهار الويدجت", true, None::<&str>)?;
            let autostart_i =
                MenuItem::with_id(app, "autostart", "التشغيل التلقائي", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "خروج", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &autostart_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Prayer Luxor")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "autostart" => toggle_autostart(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            if let Some(window) = app.get_webview_window("main") {
                set_compact_size(&window);
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().ok();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
