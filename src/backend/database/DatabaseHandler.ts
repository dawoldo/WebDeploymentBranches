import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";

export class DatabaseHandler {
    private db: DB;

    constructor(dbPath: string = "src/backend/database/database.db") {
        this.db = new DB(dbPath);
        this.initDatabase();
    }

    private initDatabase() {
        this.db.query("DROP TABLE IF EXISTS Users");
        this.db.query("DROP TABLE IF EXISTS Permissions");
        this.db.query("DROP TABLE IF EXISTS Weapons");
        this.db.query("DROP TABLE IF EXISTS Inventories");
        

        this.db.query(`CREATE TABLE IF NOT EXISTS Permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL
            )`);

        
        this.db.query(`CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            permission_id INTEGER NOT NULL,
            FOREIGN KEY (permission_id) REFERENCES Permissions(id)
            )`);
                
        this.db.query(`INSERT INTO Permissions (description) VALUES ('administrator')`);
        this.db.query(`INSERT INTO Permissions (description) VALUES ('host')`);
        this.db.query(`INSERT INTO Permissions (description) VALUES ('guest')`);
    }

    public async addUser(newUsername: string, nakedPassword: string, permission_id: number = 3) {

        const checkUsername = this.db.query("SELECT username FROM Users WHERE username = ?", [newUsername]);

        if (checkUsername.length > 0) {
            throw new Error(`Username ${checkUsername[0][0]} already exists in the database.`);
        }

        const hashedPassword = await this.hashPassword(nakedPassword);
        this.db.query("INSERT INTO Users (username, password_hash, permission_id) VALUES (?,?,?)", [newUsername, hashedPassword, permission_id]);
        
        console.log("Stored hash for", newUsername);
        console.log("Hashing password:", nakedPassword);
            
    }

    public getAllUsers() {
        const jsonData = this.db.query(`
            SELECT 
                Users.username, 
                Permissions.description AS permission_description
            FROM Users
            JOIN Permissions ON Users.permission_id = Permissions.id
        `)
        .map(([username, description]) => ({
            username,
            description
        }));
        return jsonData
    }


    private async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        return await bcrypt.hash(password, salt);
    }

    public async verifyLogin(username: string, password: string): Promise<boolean> {
        const password_hash = this.db.query("SELECT password_hash FROM Users WHERE username = ?", [username]);
        if (password_hash.length === 0) {
            console.log("Wrong username or password.");
            throw Error("Wrong username or password.");
        } else {
            return await bcrypt.compare(password, password_hash[0][0] as string);
        }
    }

    public getUserPermissions(username: string) {
        const userPerms = this.db.query("SELECT permission_id FROM Users WHERE username = ?", [username]);
        if (userPerms.length === 0) {
            throw Error("User does no exist.");
        } else {
            return userPerms[0][0] as string; 
        }

    }


    public close() {
        this.db.close();
    }
}