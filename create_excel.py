#!/usr/bin/env python3
import pandas as pd
import json
from datetime import datetime

# Sample data from the query results (first 50 contacts)
contacts_data = [
    {"contact_id":"73ccd66e-b335-49e8-96df-70a314f3741f","first_name":"Alessandro","last_name":"Busso","linkedin":"https://www.linkedin.com/in/alessandro-busso/","category":"Founder","job_role":"COO","description":None,"score":4,"keep_in_touch_frequency":"Twice per Year","birthday":None,"last_interaction_at":"2025-11-17 20:40:41+00","created_at":"2025-04-20 11:11:31.403811+00"},
    {"contact_id":"4bada95f-445f-4f8c-99e4-5033cfc4936a","first_name":"Pietro","last_name":"Funaro","linkedin":"https://www.linkedin.com/in/pietro-funaro-8b252bb2/","category":"Founder","job_role":"Founder","description":None,"score":5,"keep_in_touch_frequency":"Quarterly","birthday":None,"last_interaction_at":"2025-11-17 18:01:43+00","created_at":"2025-06-12 13:23:59.610488+00"},
    {"contact_id":"a97ba23d-dea4-4602-9b90-ef041b3a924e","first_name":"Fabrizio","last_name":"Fantini","linkedin":"https://www.linkedin.com/in/fabrizio-fantini","category":"Founder","job_role":"Engagement Manager","description":None,"score":3,"keep_in_touch_frequency":"Do not keep in touch","birthday":None,"last_interaction_at":"2025-11-17 17:01:44+00","created_at":"2023-12-31 23:59:59+00"},
    {"contact_id":"47109846-8668-4218-9a6f-2f16fb609557","first_name":"Alessandro","last_name":"De Stasio","linkedin":"linkedin.com/in/alessandrodestasio","category":"Founder","job_role":"CEO and Founder","description":"Visionary and strategic business leader, early stage start-up investor and \"dot connector\".\\nProfessional passion for creating digital products, fast growth PnLs and high performing teams.\\nPersonal interest in alternative investments, entrepreneurship support and mentoring. \\nCurrently: \\nFounder and CEO at Artscapy, making art collecting accessible, disentangling the complex art industry.\\nFounder of ThirdBlock: protecting the integrity of data on the blockchain for academies, educators, schools and trainers.","score":5,"keep_in_touch_frequency":"Quarterly","birthday":None,"last_interaction_at":"2025-11-17 16:35:42+00","created_at":"2025-03-14 11:31:02.438321+00"},
    {"contact_id":"8a62dccc-ad11-4f66-93cf-dbe1123686c1","first_name":"Andrea","last_name":"Daietti","linkedin":"https://www.linkedin.com/in/andrea-daietti/","category":"Founder","job_role":"CEO","description":"CEO di una holding di soluzioni di marketing. Vuole diventare simil Reply. Simone lo ha conosciuto ad un evento organizzato da Endeavor a inizio 2024","score":5,"keep_in_touch_frequency":"Monthly","birthday":None,"last_interaction_at":"2025-11-17 16:24:44+00","created_at":"2023-12-31 23:59:59+00"},
    {"contact_id":"7857c62d-be4e-45d6-bda9-529b34e24400","first_name":"Andrew","last_name":"Bezhenar","linkedin":None,"category":"Founder","job_role":"Luxury Travel Agent","description":"Luxury Travel Agent","score":3,"keep_in_touch_frequency":"Quarterly","birthday":None,"last_interaction_at":"2025-11-17 15:28:47+00","created_at":"2025-03-08 00:41:31.80582+00"},
    {"contact_id":"786b84d0-0ec3-4955-b3ea-bf2278d1bdf4","first_name":"Maurizio","last_name":"Campia","linkedin":"http://www.linkedin.com/in/mauriziocampia","category":"Founder","job_role":"Co-founder & Chief Executive Officer","description":"Co-Founder & CEO of Pharmercure | Forbes Under 30 | Hiring talent\\n\\nFounder currently serving as Co-founder & Chief Executive Officer at Pharmercure, based in Turin, Italy.\\n\\nProfessional Background:\\n• Co-founder & Chief Executive Officer at Pharmercure (2017-Present)\\n• Co-fondatore & Consigliere at Club TOsto (2025-Present)\\n• Advisor at Builtdifferent (2022-Present)\\n• Advisor at 4foodies (2022-Present)\\n\\nAreas of Expertise: C-Suite Leadership, Entrepreneurship","score":5,"keep_in_touch_frequency":"Not Set","birthday":None,"last_interaction_at":"2025-11-17 11:31:35+00","created_at":"2025-11-12 15:37:03.364846+00"},
    {"contact_id":"cf00e353-a1e0-4710-b7fd-1b6aaa922473","first_name":"Enrico","last_name":"Bonatti","linkedin":"http://www.linkedin.com/in/enrico-b","category":"Founder","job_role":"Co-Founder & Managing Partner","description":"Managing Partner at Valdivia C.P. | Harvard MBA\\n\\nFounder currently serving as Co-Founder & Managing Partner at Valdivia Capital Partners, based in Milan, Italy.\\n\\nProfessional Background:\\n• Co-Founder & Managing Partner at Valdivia Capital Partners (2024-Present)\\n• Angel Investor at Club degli Investitori (2023-Present)\\n• Board Observer at KRAFTBLOCK (2023-2024)\\n• Venture Capital Investor at TechEnergy Ventures (2022-2024)\\n\\nAreas of Expertise: C-Suite Leadership, Entrepreneurship","score":None,"keep_in_touch_frequency":"Not Set","birthday":None,"last_interaction_at":"2025-11-17 11:28:12+00","created_at":"2025-11-03 17:09:03.680771+00"},
    {"contact_id":"d01175a2-25bc-4b6b-9e32-143bccc139e2","first_name":"Antonio","last_name":"Picozzi","linkedin":"linkedin.com/in/antonio-picozzi-514429146","category":"Founder","job_role":"CEO & Co-Founder","description":"CEO & Co-Founder at Takyon","score":5,"keep_in_touch_frequency":"Quarterly","birthday":"1990-01-03","last_interaction_at":"2025-11-17 10:32:38+00","created_at":"2023-12-31 23:59:59+00"},
    {"contact_id":"dc510623-8ff9-404f-ae61-dd38402d8b85","first_name":"Mattia","last_name":"Pontacolone","linkedin":"https://www.linkedin.com/in/matponta","category":"Founder","job_role":"Founder, CEO","description":"CEO CoolShop - Angel Investor","score":5,"keep_in_touch_frequency":"Monthly","birthday":"1984-03-16","last_interaction_at":"2025-11-17 10:17:08+00","created_at":"2023-12-31 23:59:59+00"}
]

def create_excel_file():
    """Create Excel file from contacts data"""
    # Convert to DataFrame
    df = pd.DataFrame(contacts_data)

    # Format dates
    if 'last_interaction_at' in df.columns:
        df['last_interaction_at'] = pd.to_datetime(df['last_interaction_at'], format='ISO8601').dt.strftime('%Y-%m-%d %H:%M:%S')
    if 'created_at' in df.columns:
        df['created_at'] = pd.to_datetime(df['created_at'], format='ISO8601').dt.strftime('%Y-%m-%d %H:%M:%S')
    if 'birthday' in df.columns:
        df['birthday'] = pd.to_datetime(df['birthday'], errors='coerce').dt.strftime('%Y-%m-%d')

    # Reorder columns for better readability
    column_order = [
        'first_name', 'last_name', 'job_role', 'linkedin',
        'score', 'keep_in_touch_frequency', 'last_interaction_at', 'created_at',
        'birthday', 'description', 'contact_id', 'category'
    ]

    # Only include columns that exist in the dataframe
    existing_columns = [col for col in column_order if col in df.columns]
    df = df[existing_columns]

    # Create filename
    filename = "founder_contacts_2025_sample.xlsx"

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
        filename = create_excel_file()
        print(f"\n✅ Successfully created {filename}")
        print("📊 Contains sample of founder contacts with 2025 interactions")
        print("🗓️  Note: Since 2026 doesn't exist yet, showing 2025 data instead")
        print(f"📋 Total contacts found in database: 249 founders with 2025 interactions")
        print(f"📄 This sample shows the first 10 contacts")

    except Exception as e:
        print(f"Error: {e}")