import httpx
import asyncio
from bs4 import BeautifulSoup

async def fetch_ctri(herb: str, drug: str):
    try:
        url = "https://ctri.nic.in/Clinicaltrials/advancesearchmain.php"
        term = f"{herb} {drug}".strip()
        data = {
            "EncHid": "", "comp": "", "serasn": "", "SelectedPhase": "0",
            "searchtyp": "2", "nin": "", "ti": term, "rec": "F"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://ctri.nic.in/",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
            resp = await client.post(url, data=data, headers=headers)
            print("Status:", resp.status_code)
            
            soup = BeautifulSoup(resp.text, 'lxml')
            all_tables = soup.find_all('table')
            
            results_table = None
            max_rows = 0
            for tbl in all_tables:
                rows = tbl.find_all('tr')
                if len(rows) > max_rows:
                    max_rows = len(rows)
                    results_table = tbl

            print("Max rows in table:", max_rows)
            
            if results_table and max_rows > 1:
                rows = results_table.find_all('tr')
                print("Header row length:", len(rows[0].find_all('td')))
                if len(rows) > 1:
                    print("First data row TD count:", len(rows[1].find_all('td')))
                    for idx, td in enumerate(rows[1].find_all('td')):
                        print(f"Col {idx}: {td.text.strip()[:50]}")

    except Exception as e:
        print("Error:", e)

asyncio.run(fetch_ctri('Ashwagandha', ''))
