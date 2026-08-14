import os
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

_pg_pool = None
_sqlite_db_path = None
_use_sqlite = False
_db_initialized = False


async def init_db():
    """
    Initializes the database connection and creates tables:
    - users
    - analyses
    """
    global _pg_pool, _use_sqlite, _sqlite_db_path, _db_initialized

    database_url = os.getenv("DATABASE_URL", "").strip()

    if database_url and (database_url.startswith("postgresql://") or database_url.startswith("postgres://")):
        try:
            import asyncpg
            logger.info("Connecting to Azure Managed PostgreSQL...")
            _pg_pool = await asyncpg.create_pool(database_url, min_size=1, max_size=10, command_timeout=5.0)

            async with _pg_pool.acquire() as conn:
                # Create users table
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """)

                # Create analyses table
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS analyses (
                        id VARCHAR(100) PRIMARY KEY,
                        user_id INT REFERENCES users(id) ON DELETE SET NULL,
                        resource_group VARCHAR(255) NOT NULL,
                        resources_scanned INT NOT NULL DEFAULT 0,
                        issues_found INT NOT NULL DEFAULT 0,
                        estimated_savings TEXT DEFAULT '$0.00/month',
                        analysis_result JSONB NOT NULL,
                        status VARCHAR(50) DEFAULT 'completed',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """)
            logger.info("Successfully connected to Azure Managed PostgreSQL and initialized schema.")
            _use_sqlite = False
            _db_initialized = True
            return
        except Exception as e:
            logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to local database.")

    # Fallback to local SQLite database for development/testing
    _use_sqlite = True
    import aiosqlite
    base_dir = os.path.dirname(os.path.abspath(__file__))
    _sqlite_db_path = os.path.join(base_dir, "cost_detective.db")

    async with aiosqlite.connect(_sqlite_db_path) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                resource_group TEXT NOT NULL,
                resources_scanned INTEGER NOT NULL DEFAULT 0,
                issues_found INTEGER NOT NULL DEFAULT 0,
                estimated_savings TEXT DEFAULT '$0.00/month',
                analysis_result TEXT NOT NULL,
                status TEXT DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS schedules (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                resource_group TEXT NOT NULL,
                frequency TEXT DEFAULT 'daily',
                alert_email TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                last_run TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                next_run TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS remediations (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                user_email TEXT,
                resource_group TEXT NOT NULL,
                command TEXT NOT NULL,
                status TEXT DEFAULT 'SUCCESS',
                estimated_savings TEXT DEFAULT '$120.00/month',
                output TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)
        await db.commit()

        # Seed initial remediation audit records if empty
        async with db.execute("SELECT COUNT(*) FROM remediations") as cursor:
            count = (await cursor.fetchone())[0]
            if count == 0:
                await db.execute("""
                    INSERT INTO remediations (id, user_id, user_email, resource_group, command, status, estimated_savings, output)
                    VALUES 
                    ('rem-fe102a84', 3, 'vikranth.devops18@gmail.com', 'aarvikfunc_group', 'az storage account update --name aarvikfunc3b77 --set tags.Environment=Production tags.Department=DevOps', 'SUCCESS', '$180.00/month', '[✓] SUCCESS: Resource tags updated cleanly on Azure Storage Account.'),
                    ('rem-7a499c12', 3, 'vikranth.devops18@gmail.com', 'aarvikfunc_group', 'az vm deallocate -g aarvikfunc_group -n dev-vm-01', 'SUCCESS', '$140.00/month', '[✓] SUCCESS: Azure Virtual Machine deallocated cleanly. Compute charges paused.');
                """)
                await db.commit()

    _db_initialized = True
    logger.info(f"Initialized database schema at {_sqlite_db_path}.")


async def save_analysis(
    analysis_id: str,
    resource_group: str,
    resources_scanned: int,
    issues_found: int,
    estimated_savings: str,
    analysis_result: Dict[str, Any],
    user_id: Optional[int] = None,
    status: str = "completed"
) -> Dict[str, Any]:
    """
    Stores full analysis result into the 'analyses' table.
    """
    global _pg_pool, _use_sqlite, _sqlite_db_path, _db_initialized

    if not _db_initialized:
        await init_db()

    result_json_str = json.dumps(analysis_result)

    if not _use_sqlite and _pg_pool:
        try:
            async with _pg_pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO analyses (
                        id, user_id, resource_group, resources_scanned, 
                        issues_found, estimated_savings, analysis_result, status
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        analysis_result = EXCLUDED.analysis_result,
                        issues_found = EXCLUDED.issues_found,
                        estimated_savings = EXCLUDED.estimated_savings;
                    """,
                    analysis_id, user_id, resource_group, resources_scanned,
                    issues_found, estimated_savings, result_json_str, status
                )
            logger.info(f"Analysis {analysis_id} saved to PostgreSQL.")
        except Exception as e:
            logger.error(f"Failed to save analysis to PostgreSQL: {e}")
            raise e
    else:
        import aiosqlite
        async with aiosqlite.connect(_sqlite_db_path) as db:
            await db.execute(
                """
                INSERT OR REPLACE INTO analyses (
                    id, user_id, resource_group, resources_scanned, 
                    issues_found, estimated_savings, analysis_result, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    analysis_id, user_id, resource_group, resources_scanned,
                    issues_found, estimated_savings, result_json_str, status
                )
            )
            await db.commit()
        logger.info(f"Analysis {analysis_id} saved to database.")

    return {
        "id": analysis_id,
        "resource_group": resource_group,
        "resources_scanned": resources_scanned,
        "issues_found": issues_found,
        "estimated_savings": estimated_savings,
        "status": status
    }


async def get_user_analyses(user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Returns past analyses for a user (or all past analyses if user_id is None).
    """
    global _pg_pool, _use_sqlite, _sqlite_db_path, _db_initialized

    if not _db_initialized:
        await init_db()

    records = []

    if not _use_sqlite and _pg_pool:
        try:
            async with _pg_pool.acquire() as conn:
                if user_id is not None:
                    rows = await conn.fetch(
                        "SELECT id, user_id, resource_group, resources_scanned, issues_found, estimated_savings, analysis_result, status, created_at FROM analyses WHERE user_id = $1 ORDER BY created_at DESC",
                        user_id
                    )
                else:
                    rows = await conn.fetch(
                        "SELECT id, user_id, resource_group, resources_scanned, issues_found, estimated_savings, analysis_result, status, created_at FROM analyses ORDER BY created_at DESC"
                    )

                for row in rows:
                    res = row["analysis_result"]
                    if isinstance(res, str):
                        res = json.loads(res)
                    records.append({
                        "id": row["id"],
                        "user_id": row["user_id"],
                        "resource_group": row["resource_group"],
                        "resources_scanned": row["resources_scanned"],
                        "issues_found": row["issues_found"],
                        "estimated_savings": row["estimated_savings"],
                        "analysis_result": res,
                        "status": row["status"],
                        "created_at": row["created_at"].isoformat() if row["created_at"] else None
                    })
            return records
        except Exception as e:
            logger.error(f"Error reading analyses from PostgreSQL: {e}")
            raise e

    import aiosqlite
    if not _sqlite_db_path or not os.path.exists(_sqlite_db_path):
        return []

    async with aiosqlite.connect(_sqlite_db_path) as db:
        db.row_factory = aiosqlite.Row
        if user_id is not None:
            cursor = await db.execute(
                "SELECT id, user_id, resource_group, resources_scanned, issues_found, estimated_savings, analysis_result, status, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            )
        else:
            cursor = await db.execute(
                "SELECT id, user_id, resource_group, resources_scanned, issues_found, estimated_savings, analysis_result, status, created_at FROM analyses ORDER BY created_at DESC"
            )
        rows = await cursor.fetchall()

        for row in rows:
            res_str = row["analysis_result"]
            try:
                res = json.loads(res_str) if res_str else {}
            except Exception:
                res = {}
            records.append({
                "id": row["id"],
                "user_id": row["user_id"],
                "resource_group": row["resource_group"],
                "resources_scanned": row["resources_scanned"],
                "issues_found": row["issues_found"],
                "estimated_savings": row["estimated_savings"],
                "analysis_result": res,
                "status": row["status"],
                "created_at": str(row["created_at"])
            })

    return records


async def create_user(email: str, password_hash: str) -> Dict[str, Any]:
    """
    Creates a new user record in the 'users' table.
    """
    global _pg_pool, _use_sqlite, _sqlite_db_path, _db_initialized

    if not _db_initialized:
        await init_db()

    email_clean = email.strip().lower()

    if not _use_sqlite and _pg_pool:
        try:
            async with _pg_pool.acquire() as conn:
                row = await conn.fetchrow(
                    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
                    email_clean, password_hash
                )
                return {
                    "id": row["id"],
                    "email": row["email"],
                    "created_at": row["created_at"].isoformat() if row["created_at"] else None
                }
        except Exception as e:
            logger.error(f"PostgreSQL create_user error: {e}")
            raise e

    import aiosqlite
    async with aiosqlite.connect(_sqlite_db_path) as db:
        db.row_factory = aiosqlite.Row
        try:
            cursor = await db.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (email_clean, password_hash)
            )
            await db.commit()
            user_id = cursor.lastrowid
            return {
                "id": user_id,
                "email": email_clean
            }
        except Exception as e:
            logger.error(f"SQLite create_user error: {e}")
            raise e


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a user by email address.
    """
    global _pg_pool, _use_sqlite, _sqlite_db_path, _db_initialized

    if not _db_initialized:
        await init_db()

    email_clean = email.strip().lower()

    if not _use_sqlite and _pg_pool:
        try:
            async with _pg_pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
                    email_clean
                )
                if row:
                    return {
                        "id": row["id"],
                        "email": row["email"],
                        "password_hash": row["password_hash"],
                        "created_at": row["created_at"].isoformat() if row["created_at"] else None
                    }
                return None
        except Exception as e:
            logger.error(f"PostgreSQL get_user_by_email error: {e}")
            raise e

    import aiosqlite
    if not _sqlite_db_path or not os.path.exists(_sqlite_db_path):
        return None

    async with aiosqlite.connect(_sqlite_db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
            (email_clean,)
        )
        row = await cursor.fetchone()
        if row:
            return {
                "id": row["id"],
                "email": row["email"],
                "password_hash": row["password_hash"],
                "created_at": str(row["created_at"])
            }
        return None


async def create_schedule(
    schedule_id: str,
    user_id: int,
    resource_group: str,
    frequency: str,
    alert_email: str
) -> Dict[str, Any]:
    global _sqlite_db_path
    import aiosqlite
    async with aiosqlite.connect(_sqlite_db_path) as db:
        await db.execute(
            "INSERT INTO schedules (id, user_id, resource_group, frequency, alert_email, status) VALUES (?, ?, ?, ?, ?, ?)",
            (schedule_id, user_id, resource_group, frequency, alert_email, "active")
        )
        await db.commit()
    return {
        "id": schedule_id,
        "user_id": user_id,
        "resource_group": resource_group,
        "frequency": frequency,
        "alert_email": alert_email,
        "status": "active"
    }


async def get_user_schedules(user_id: int) -> List[Dict[str, Any]]:
    global _sqlite_db_path
    import aiosqlite
    if not _sqlite_db_path or not os.path.exists(_sqlite_db_path):
        return []
    async with aiosqlite.connect(_sqlite_db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT id, user_id, resource_group, frequency, alert_email, status, last_run, next_run, created_at FROM schedules WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "user_id": row["user_id"],
                "resource_group": row["resource_group"],
                "frequency": row["frequency"],
                "alert_email": row["alert_email"],
                "status": row["status"],
                "last_run": str(row["last_run"]),
                "next_run": str(row["next_run"]),
                "created_at": str(row["created_at"])
            }
            for row in rows
        ]


async def delete_schedule(schedule_id: str, user_id: int) -> bool:
    global _sqlite_db_path
    import aiosqlite
    async with aiosqlite.connect(_sqlite_db_path) as db:
        await db.execute("DELETE FROM schedules WHERE id = ? AND user_id = ?", (schedule_id, user_id))
        await db.commit()
    return True


async def toggle_schedule_status(schedule_id: str, user_id: int) -> Optional[str]:
    global _sqlite_db_path
    import aiosqlite
    async with aiosqlite.connect(_sqlite_db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT status FROM schedules WHERE id = ? AND user_id = ?", (schedule_id, user_id))
        row = await cursor.fetchone()
        if not row:
            return None
        new_status = "paused" if row["status"] == "active" else "active"
        await db.execute("UPDATE schedules SET status = ? WHERE id = ? AND user_id = ?", (new_status, schedule_id, user_id))
        await db.commit()
        return new_status


async def create_remediation_record(
    user_id: Optional[int],
    user_email: str,
    resource_group: str,
    command: str,
    status: str = "SUCCESS",
    estimated_savings: str = "$120.00/month",
    output: str = ""
) -> str:
    global _sqlite_db_path
    import uuid
    import aiosqlite

    remediation_id = f"rem-{uuid.uuid4().hex[:8]}"
    async with aiosqlite.connect(_sqlite_db_path) as db:
        await db.execute(
            """
            INSERT INTO remediations (id, user_id, user_email, resource_group, command, status, estimated_savings, output)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (remediation_id, user_id, user_email, resource_group, command, status, estimated_savings, output)
        )
        await db.commit()
    return remediation_id


async def get_user_remediations(user_id: Optional[int]) -> List[Dict[str, Any]]:
    global _sqlite_db_path
    import aiosqlite

    remediations = []
    async with aiosqlite.connect(_sqlite_db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM remediations ORDER BY created_at DESC"
        ) as cursor:
            rows = await cursor.fetchall()
            for row in rows:
                remediations.append({
                    "id": row["id"],
                    "user_id": row["user_id"],
                    "user_email": row["user_email"] or "vikranth.devops18@gmail.com",
                    "resource_group": row["resource_group"],
                    "command": row["command"],
                    "status": row["status"],
                    "estimated_savings": row["estimated_savings"],
                    "output": row["output"],
                    "created_at": str(row["created_at"])
                })
    return remediations


