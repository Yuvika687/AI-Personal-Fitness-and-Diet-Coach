# backend/view_database.py
import sqlite3
import pandas as pd

def view_database():
    print("📊 DATABASE INSPECTION")
    print("=" * 50)
    
    # Connect to database
    conn = sqlite3.connect('ai_gym.db')
    
    # Get all tables
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("📋 TABLES FOUND:")
    for table in tables:
        table_name = table[0]
        print(f"\n🟢 {table_name}")
        
        # Get table info
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        print("   Columns:")
        for col in columns:
            print(f"   • {col[1]} ({col[2]})")
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"   📈 Rows: {count}")
        
        # Show first few rows
        if count > 0:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
            rows = cursor.fetchall()
            print(f"   📝 Sample data (first 3 rows):")
            for row in rows:
                print(f"     {row}")
    
    # Show all users
    print("\n" + "=" * 50)
    print("👥 ALL REGISTERED USERS:")
    
    query = """
    SELECT id, email, full_name, age, gender, 
           height_cm, weight_kg, activity_level 
    FROM users
    """
    
    users_df = pd.read_sql_query(query, conn)
    
    if len(users_df) > 0:
        print(users_df.to_string(index=False))
    else:
        print("No users found in database")
    
    # Show user count
    print(f"\n✅ Total Users: {len(users_df)}")
    
    conn.close()

if __name__ == "__main__":
    view_database()