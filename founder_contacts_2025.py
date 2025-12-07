#!/usr/bin/env python3
import pandas as pd
from supabase import create_client, Client
import os
from datetime import datetime

# Supabase configuration
url = "https://efazuvegwxouysfcgwja.supabase.co"
# Note: In production, use environment variables for the key
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYXp1dmVnd3hvdXlzZmNnd2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzY2ODksImV4cCI6MjA1MTUxMjY4OX0.VjVBnPYKuNHKqC9U5Bw-xqGZzFo-vDo0LQK_Ss_xKEA"

def fetch_founder_contacts_2025():
    """Fetch all founder contacts with 2025 interactions"""
    supabase: Client = create_client(url, key)

    # Query for founder contacts with 2025 interactions
    response = supabase.table("contacts").select(
        "contact_id, first_name, last_name, linkedin, category, job_role, "
        "description, score, keep_in_touch_frequency, birthday, "
        "last_interaction_at, created_at"
    ).eq("category", "Founder").gte(
        "last_interaction_at", "2025-01-01"
    ).lt(
        "last_interaction_at", "2026-01-01"
    ).order("last_interaction_at", desc=True).execute()

    return response.data

def create_excel_file(contacts_data):
    """Create Excel file from contacts data"""
    if not contacts_data:
        print("No contacts found")
        return

    # Convert to DataFrame
    df = pd.DataFrame(contacts_data)

    # Format dates
    if 'last_interaction_at' in df.columns:
        df['last_interaction_at'] = pd.to_datetime(df['last_interaction_at']).dt.strftime('%Y-%m-%d %H:%M:%S')
    if 'created_at' in df.columns:
        df['created_at'] = pd.to_datetime(df['created_at']).dt.strftime('%Y-%m-%d %H:%M:%S')
    if 'birthday' in df.columns:
        df['birthday'] = pd.to_datetime(df['birthday'], errors='coerce').dt.strftime('%Y-%m-%d')

    # Reorder columns for better readability
    column_order = [
        'contact_id', 'first_name', 'last_name', 'job_role', 'linkedin',
        'score', 'keep_in_touch_frequency', 'last_interaction_at', 'created_at',
        'birthday', 'description', 'category'
    ]

    # Only include columns that exist in the dataframe
    existing_columns = [col for col in column_order if col in df.columns]
    df = df[existing_columns]

    # Create filename with current timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"founder_contacts_2025_{timestamp}.xlsx"

    # Create Excel file with formatting
    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Founder Contacts 2025', index=False)

        # Get the workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['Founder Contacts 2025']

        # Auto-adjust column widths
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter

            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass

            # Set width with a reasonable maximum
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width

    print(f"Excel file created: {filename}")
    print(f"Total contacts: {len(df)}")
    return filename

if __name__ == "__main__":
    try:
        print("Fetching founder contacts with 2025 interactions...")
        contacts = fetch_founder_contacts_2025()

        if contacts:
            filename = create_excel_file(contacts)
            print(f"\n✅ Successfully created {filename}")
            print(f"📊 Contains {len(contacts)} founder contacts")
            print("🗓️  All contacts have last interactions in 2025")
        else:
            print("❌ No founder contacts found with 2025 interactions")

    except Exception as e:
        print(f"Error: {e}")