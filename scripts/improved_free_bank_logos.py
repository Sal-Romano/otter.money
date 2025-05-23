#!/usr/bin/env python3
"""
Improved Free Bank Logo Fetcher
Works with verified free sources for bank logos
"""

import os
import requests
import json
import time
from pathlib import Path
import logging
import re

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ImprovedFreeBankLogoFetcher:
    """Fetch bank logos from verified free sources."""
    
    def __init__(self, output_dir="standardized_bank_logos"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; BankLogoFetcher/1.0)',
            'Accept': 'image/*, application/json'
        })
        
        self.banks_data = []
        self.downloaded_count = 0
        self.failed_count = 0
        
        # Major bank domains with their info
        self.bank_domains = {
            # US Major Banks
            'chase.com': {'name': 'JPMorgan Chase Bank', 'country': 'US', 'type': 'Major Bank'},
            'bankofamerica.com': {'name': 'Bank of America', 'country': 'US', 'type': 'Major Bank'},
            'wellsfargo.com': {'name': 'Wells Fargo', 'country': 'US', 'type': 'Major Bank'},
            'citi.com': {'name': 'Citibank', 'country': 'US', 'type': 'Major Bank'},
            'usbank.com': {'name': 'U.S. Bank', 'country': 'US', 'type': 'Major Bank'},
            'pnc.com': {'name': 'PNC Bank', 'country': 'US', 'type': 'Regional Bank'},
            'capitalone.com': {'name': 'Capital One', 'country': 'US', 'type': 'Credit Card/Bank'},
            'regions.com': {'name': 'Regions Bank', 'country': 'US', 'type': 'Regional Bank'},
            'ally.com': {'name': 'Ally Bank', 'country': 'US', 'type': 'Online Bank'},
            'schwab.com': {'name': 'Charles Schwab Bank', 'country': 'US', 'type': 'Investment Bank'},
            'goldmansachs.com': {'name': 'Goldman Sachs', 'country': 'US', 'type': 'Investment Bank'},
            'morganstanley.com': {'name': 'Morgan Stanley', 'country': 'US', 'type': 'Investment Bank'},
            'santander.com': {'name': 'Santander Bank', 'country': 'US', 'type': 'International Bank'},
            'bbt.com': {'name': 'BB&T Bank', 'country': 'US', 'type': 'Regional Bank'},
            'suntrust.com': {'name': 'SunTrust Bank', 'country': 'US', 'type': 'Regional Bank'},
            'td.com': {'name': 'TD Bank', 'country': 'US', 'type': 'International Bank'},
            'americanexpress.com': {'name': 'American Express', 'country': 'US', 'type': 'Credit Card'},
            'discover.com': {'name': 'Discover Bank', 'country': 'US', 'type': 'Credit Card/Bank'},
            'synchrony.com': {'name': 'Synchrony Bank', 'country': 'US', 'type': 'Online Bank'},
            'marcus.com': {'name': 'Marcus by Goldman Sachs', 'country': 'US', 'type': 'Online Bank'},
            
            # Credit Unions
            'navyfederal.org': {'name': 'Navy Federal Credit Union', 'country': 'US', 'type': 'Credit Union'},
            'usaa.com': {'name': 'USAA', 'country': 'US', 'type': 'Military Banking'},
            
            # International Banks
            'hsbc.com': {'name': 'HSBC', 'country': 'UK', 'type': 'International Bank'},
            'barclays.com': {'name': 'Barclays', 'country': 'UK', 'type': 'International Bank'},
            'lloyds.com': {'name': 'Lloyds Bank', 'country': 'UK', 'type': 'UK Bank'},
            'rbs.com': {'name': 'Royal Bank of Scotland', 'country': 'UK', 'type': 'UK Bank'},
            'bnpparibas.com': {'name': 'BNP Paribas', 'country': 'FR', 'type': 'International Bank'},
            'credit-suisse.com': {'name': 'Credit Suisse', 'country': 'CH', 'type': 'Swiss Bank'},
            'ubs.com': {'name': 'UBS', 'country': 'CH', 'type': 'Swiss Bank'},
            'deutschebank.com': {'name': 'Deutsche Bank', 'country': 'DE', 'type': 'German Bank'},
            'commerzbank.com': {'name': 'Commerzbank', 'country': 'DE', 'type': 'German Bank'},
            
            # Canadian Banks
            'rbc.com': {'name': 'Royal Bank of Canada', 'country': 'CA', 'type': 'Canadian Bank'},
            'bmo.com': {'name': 'Bank of Montreal', 'country': 'CA', 'type': 'Canadian Bank'},
            'scotiabank.com': {'name': 'Scotiabank', 'country': 'CA', 'type': 'Canadian Bank'},
            'cibc.com': {'name': 'CIBC', 'country': 'CA', 'type': 'Canadian Bank'},
            
            # Australian Banks
            'commbank.com.au': {'name': 'Commonwealth Bank', 'country': 'AU', 'type': 'Australian Bank'},
            'anz.com': {'name': 'ANZ Bank', 'country': 'AU', 'type': 'Australian Bank'},
            'nab.com.au': {'name': 'National Australia Bank', 'country': 'AU', 'type': 'Australian Bank'},
            'westpac.com.au': {'name': 'Westpac', 'country': 'AU', 'type': 'Australian Bank'},
        }
    
    def fetch_from_clearbit(self):
        """Fetch logos from Clearbit Logo API."""
        logger.info("Fetching logos from Clearbit...")
        
        for domain, info in self.bank_domains.items():
            try:
                logo_url = f"https://logo.clearbit.com/{domain}"
                
                # Test if logo exists
                response = self.session.head(logo_url, timeout=10)
                if response.status_code == 200:
                    bank_data = {
                        'source': 'clearbit',
                        'domain': domain,
                        'bank_name': info['name'],
                        'country': info['country'],
                        'type': info['type'],
                        'logo_url': logo_url,
                        'logo_format': 'png'
                    }
                    
                    self.banks_data.append(bank_data)
                    logger.info(f"✓ Found logo for {info['name']}")
                else:
                    logger.warning(f"✗ No logo found for {info['name']} ({response.status_code})")
                
                time.sleep(0.3)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error checking {domain}: {e}")
    
    def fetch_from_icon_horse(self):
        """Fetch favicons from Icon Horse (fallback method)."""
        logger.info("Fetching favicons from Icon Horse as fallback...")
        
        for domain, info in self.bank_domains.items():
            # Skip if we already have this from Clearbit
            if any(bank['domain'] == domain and bank['source'] == 'clearbit' for bank in self.banks_data):
                continue
            
            try:
                favicon_url = f"https://icon.horse/icon/{domain}"
                
                response = self.session.head(favicon_url, timeout=10)
                if response.status_code == 200:
                    bank_data = {
                        'source': 'icon_horse',
                        'domain': domain,
                        'bank_name': info['name'],
                        'country': info['country'],
                        'type': info['type'],
                        'logo_url': favicon_url,
                        'logo_format': 'ico/png'
                    }
                    
                    self.banks_data.append(bank_data)
                    logger.info(f"✓ Found favicon for {info['name']}")
                
                time.sleep(0.2)
                
            except Exception as e:
                logger.error(f"Error checking favicon for {domain}: {e}")
    
    def fetch_from_freebiesupply(self):
        """Get info about FreebieSupply logos (manual list since no API)."""
        logger.info("Adding FreebieSupply bank logos info...")
        
        # Known logos available on FreebieSupply
        freebiesupply_banks = [
            {'name': 'Chase Bank', 'country': 'US'},
            {'name': 'Wells Fargo', 'country': 'US'},
            {'name': 'Bank of America', 'country': 'US'},
            {'name': 'Visa', 'country': 'US'},
            {'name': 'Fifth Third Bank', 'country': 'US'},
            {'name': 'BB&T Bank', 'country': 'US'},
            {'name': 'SunTrust Bank', 'country': 'US'},
        ]
        
        for bank in freebiesupply_banks:
            # Create a note about manual download needed
            bank_data = {
                'source': 'freebiesupply',
                'bank_name': bank['name'],
                'country': bank['country'],
                'manual_download_url': 'https://freebiesupply.com/s/bank-logos/',
                'note': 'Manual download required from FreebieSupply'
            }
            
            self.banks_data.append(bank_data)
    
    def download_logo(self, bank_data):
        """Download a logo file."""
        if 'logo_url' not in bank_data:
            return False
        
        try:
            response = self.session.get(bank_data['logo_url'], timeout=30)
            response.raise_for_status()
            
            # Determine file extension from content type or URL
            content_type = response.headers.get('content-type', '').lower()
            if 'svg' in content_type:
                ext = '.svg'
            elif 'png' in content_type:
                ext = '.png'
            elif 'jpeg' in content_type or 'jpg' in content_type:
                ext = '.jpg'
            elif 'gif' in content_type:
                ext = '.gif'
            elif 'ico' in content_type:
                ext = '.ico'
            else:
                ext = '.png'  # Default
            
            # Create standardized filename
            safe_name = re.sub(r'[^\w\-]', '_', bank_data['bank_name'])
            filename = f"{bank_data['source']}_{safe_name}_{bank_data['country']}{ext}"
            
            file_path = self.output_dir / filename
            
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            bank_data['local_file'] = str(file_path)
            bank_data['file_size'] = len(response.content)
            
            self.downloaded_count += 1
            logger.info(f"📥 Downloaded: {filename} ({len(response.content)} bytes)")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to download {bank_data['bank_name']}: {e}")
            self.failed_count += 1
            return False
    
    def create_bank_index(self):
        """Create an index of all available banks."""
        index_file = self.output_dir / 'bank_index.json'
        
        # Create a structured index
        index = {
            'total_banks': len(self.banks_data),
            'downloaded_logos': self.downloaded_count,
            'sources': list(set(bank['source'] for bank in self.banks_data)),
            'countries': list(set(bank.get('country', 'Unknown') for bank in self.banks_data)),
            'banks': self.banks_data,
            'generated_at': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
        }
        
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📋 Bank index saved to: {index_file}")
    
    def create_usage_guide(self):
        """Create a usage guide for the downloaded logos."""
        guide_content = f"""# Bank Logos Collection

## Summary
- **Total Banks**: {len(self.banks_data)}
- **Downloaded Logos**: {self.downloaded_count}
- **Sources**: {', '.join(set(bank['source'] for bank in self.banks_data))}

## Sources Used

### 1. Clearbit Logo API
- **URL**: https://logo.clearbit.com/[domain]
- **Format**: PNG
- **Usage**: Free tier available
- **Quality**: High quality, standardized logos

### 2. Icon Horse
- **URL**: https://icon.horse/icon/[domain]
- **Format**: ICO/PNG
- **Usage**: Free
- **Quality**: Favicons, smaller but universal

### 3. FreebieSupply
- **URL**: https://freebiesupply.com/s/bank-logos/
- **Format**: PNG, SVG
- **Usage**: Free for personal/commercial use
- **Quality**: High quality, manually curated
- **Note**: Manual download required

## File Naming Convention
`[source]_[bank_name]_[country].[ext]`

Examples:
- `clearbit_JPMorgan_Chase_Bank_US.png`
- `icon_horse_Wells_Fargo_US.ico`

## Usage in Your Application

```python
import json
from pathlib import Path

# Load the bank index
with open('bank_index.json', 'r') as f:
    bank_data = json.load(f)

# Find a specific bank
chase_bank = next(
    (bank for bank in bank_data['banks'] 
     if 'chase' in bank['bank_name'].lower()), 
    None
)

if chase_bank and 'local_file' in chase_bank:
    logo_path = chase_bank['local_file']
    print(f"Chase logo: {{logo_path}}")
```

## Legal Notice
All bank logos are trademarks of their respective owners. Use of these logos 
should comply with each institution's trademark guidelines and terms of service.

Generated on: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}
"""
        
        guide_file = self.output_dir / 'README.md'
        with open(guide_file, 'w', encoding='utf-8') as f:
            f.write(guide_content)
        
        logger.info(f"📖 Usage guide saved to: {guide_file}")
    
    def run(self):
        """Run the complete fetching process."""
        start_time = time.time()
        
        logger.info("🚀 Starting Free Bank Logo Collection...")
        
        # Fetch from all sources
        self.fetch_from_clearbit()
        self.fetch_from_icon_horse()
        self.fetch_from_freebiesupply()
        
        logger.info(f"📊 Total banks found: {len(self.banks_data)}")
        
        # Download available logos
        downloadable_banks = [bank for bank in self.banks_data if 'logo_url' in bank]
        logger.info(f"📥 Downloading {len(downloadable_banks)} logos...")
        
        for i, bank_data in enumerate(downloadable_banks, 1):
            logger.info(f"[{i}/{len(downloadable_banks)}] {bank_data['bank_name']}")
            self.download_logo(bank_data)
            time.sleep(0.1)  # Be respectful
        
        # Create documentation
        self.create_bank_index()
        self.create_usage_guide()
        
        # Summary
        end_time = time.time()
        duration = end_time - start_time
        
        logger.info("\n" + "="*50)
        logger.info("🎉 COLLECTION COMPLETE!")
        logger.info("="*50)
        logger.info(f"📁 Total banks cataloged: {len(self.banks_data)}")
        logger.info(f"💾 Logos downloaded: {self.downloaded_count}")
        logger.info(f"❌ Failed downloads: {self.failed_count}")
        logger.info(f"📈 Success rate: {(self.downloaded_count/len(downloadable_banks)*100):.1f}%")
        logger.info(f"⏱️  Total time: {duration:.1f} seconds")
        logger.info(f"📂 Files saved to: {self.output_dir}")
        logger.info("="*50)

if __name__ == "__main__":
    fetcher = ImprovedFreeBankLogoFetcher()
    fetcher.run() 