use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::sync::Mutex;

pub mod schema;
pub mod models;
pub mod dao;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: PathBuf) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(path)?;
        schema::init_tables(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
