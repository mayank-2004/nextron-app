import sqlite3 from "sqlite3";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";
const dbPath = "TempDatabase.db";

const sqlite = sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const db = new sqlite.Database("TempDatabase.db", (err) => {
//     if (err) {
//         console.error("Error creating database", err.message);
//     } else {
//         console.log("Connected to database successfully.");
//         initializeDatabase();
//     }
// });
let db;
if (fs.existsSync(dbPath)) {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error("Error opening existing database:", err.message);
        } else {
            console.log("Connected to existing database successfully.");
            initializeDatabase();
            initializeDatabase1();
        }
    });
} else {
    console.error("Database file does not exist. Skipping connection.");
}

 export function initializeDatabase() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS PDR_Temperature (
                data REAL NOT NULL, 
                timestamp datetime NOT NULL
            )`, (err) => {
            if (err) {
                console.error("Error creating table", err.message);
            } else {
                console.log("Temperature table created.");
                db.get("SELECT COUNT(*) AS count FROM PDR_Temperature", [], (err, row) => {
                    if (err) {
                        console.error("Error checking data", err.message);
                    } else if (row.count === 0) {
                        console.log("Table is empty, adding some data...");
                        // importSensorDataFromCSV();
                    } else {
                        console.log(`table already has ${row.count} records, skipping import`);
                    }
                });
            }
        });
    })
}
 export function initializeDatabase1() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS TempData (
                id INTEGER PRIMARY KEY,
                element_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                d1 REAL,
                d2 REAL,
                temp REAL 
            )`, (err) => {
            if (err) {
                console.error("Error creating table", err.message);
            } else {
                console.log("Temperature table created.");
                db.get("SELECT COUNT(*) AS count FROM TempData", [], (err, row) => {
                    if (err) {
                        console.error("Error checking data", err.message);
                    } else if (row.count === 0) {
                        console.log("Table is empty, adding some data...");
                        // importSensorDataFromCSV();
                    } else {
                        console.log(`table already has ${row.count} records, skipping import`);
                    }
                });
            }
        });
    })
}

// function importSensorDataFromCSV() {
//     const csvFilePath = path.resolve(__dirname, '../renderer/data/sensor_data.csv');
//     console.log(`Attempting to read CSV from: ${csvFilePath}`);

//     if (!fs.existsSync(csvFilePath)) {
//         console.error(`CSV file not found at: ${csvFilePath}`);
//         return;
//     }
    
//     console.log('CSV file exists, attempting to read...');
    
//     const results = [];
    
//     fs.createReadStream(csvFilePath)
//         .on('error', (error) => {
//             console.error(`Error reading CSV file: ${error.message}`);
//         })
//         .pipe(csv())
//         .on('data', (data) => results.push(data))
//         .on('end', () => {
//             console.log(`Parsed ${results.length} rows from CSV`);
//             if (results.length > 0) {
//                 insertSensorData(results);
//             }
//         });
// }

// function insertSensorData(data) {
//     db.serialize(() => {
//         db.run('BEGIN TRANSACTION');
//         const stmt = db.prepare("INSERT INTO TempData (id, element_id, timestamp, d1, d2, temp) VALUES (?, ?, ?, ?, ?, ?)");

//         let count = 0;
//         for (const row of data) {
//             stmt.run(
//                 row.id, 
//                 row.element_id, 
//                 row.timestamp, 
//                 parseFloat(row.d1), 
//                 parseFloat(row.d2), 
//                 parseFloat(row.temp)
//             );
//             count++;
//         }
//         stmt.finalize();

//         db.run('COMMIT', (err) => {
//             if (err) {
//                 console.error("Error committing sensor data transaction:", err.message);
//             } else {
//                 console.log(`${count} sensor records imported successfully.`);
//             }
//         });
//     });
// }

export function getSensorData() {
    return new Promise((resolve, reject) => {
        db.all("SELECT data AS temperature, timestamp FROM PDR_Temperature", [], (err, rows) => {
            if (err) {
                console.error("Error getting sensor data:", err.message);
                reject(err);
            } else {
                console.log(`Fetched ${rows.length} sensor data records from database`);
                resolve(rows);
            }
        });
    });
}
export function getSensorData1() {
    return new Promise((resolve, reject) => {
        db.all("SELECT timestamp, temp AS temperature FROM TempData WHERE element_id = 30", [], (err, rows) => {
        // db.all("SELECT timestamp, temp AS temperature FROM TempData", [], (err, rows) => {
            if (err) {
                console.error("Error getting sensor data:", err.message);
                reject(err);
            } else {
                console.log(`Fetched ${rows.length} sensor data records from database`);
                resolve(rows);
            }
        });
    });
}

export function closeDatabase() {
    return new Promise((resolve, reject) => {
        db.close(err => {
            if (err) {
                console.error("Error closing database", err.message);
                reject(err);
            } else {
                console.log("database connection closed");
                resolve();
            }
        });
    });
}

export default db;