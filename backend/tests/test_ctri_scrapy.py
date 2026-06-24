import scrapy
from scrapy.crawler import CrawlerProcess

class CTRISpider(scrapy.Spider):
    name = "ctri_spider"
    
    # Custom settings for Scrapy to bypass simple blocks
    custom_settings = {
        'ROBOTSTXT_OBEY': False,
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'DOWNLOAD_DELAY': 2,
    }

    def start_requests(self):
        url = "https://ctri.nic.in/Clinicaltrials/advancesearchmain.php"
        # We need to simulate a form submission
        yield scrapy.FormRequest(
            url=url,
            formdata={
                "EncHid": "", "comp": "", "serasn": "", "SelectedPhase": "0",
                "searchtyp": "2", "nin": "", "ti": "Ashwagandha", "rec": "F"
            },
            callback=self.parse,
            # meta is used to disable ssl verification in scrapy 
            # (handled globally via DOWNLOADER_CLIENTCONTEXTFACTORY usually, but let's see if default works)
        )

    def parse(self, response):
        print("Status Code:", response.status)
        all_tables = response.xpath('//table')
        print("Total Tables:", len(all_tables))
        
        # Check if the text "SEARCH FOR TRIALS :" is in the response (which means we failed and got the form)
        if "SEARCH FOR TRIALS" in response.text:
            print("Failed: Received the search form instead of results table.")
        else:
            print("Success! Data table found.")

if __name__ == "__main__":
    process = CrawlerProcess()
    process.crawl(CTRISpider)
    process.start()
