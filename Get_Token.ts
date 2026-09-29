import puppeteer from "puppeteer";
import { FoSecDataItem } from "./Fetch_Data_Model";
interface TokenEntry{
    token: string,
    symbol: string
}

export async function get_token(performer: FoSecDataItem[]): Promise<{symbol:string;token:string}[]>{
    const url = 'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';
    const results: {symbol:string;token:string}[]=[];

    const browser = await puppeteer.launch({
        headless:true,
        args:['--no-sandbox--','--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36')

    try{
        console.log("🔎 Fetching token data from browser...");
        await page.goto(url, { waitUntil: 'networkidle2' });

        const tokenData: TokenEntry[] = await page.evaluate(() => {
            return JSON.parse(document.querySelector('body')!.innerText);
          });

          for (const item of performer) {
            const searchKey = `${item.symbol}-${item.series}`; // example: SBIN-EQ
      
            const found = tokenData.find(entry => entry.symbol === searchKey);
      
            if (found) {
              results.push({
                symbol: found.symbol,
                token: found.token,
              });
            } else {
              console.log(`❌ No token found for ${searchKey}`);
            }
          }
      
        } catch (error) {
          console.error("Error fetching token data using Puppeteer:", error);
        } finally {
          await browser.close();
        }
      
        return results;
      }
      
    
      export default get_token;
      
