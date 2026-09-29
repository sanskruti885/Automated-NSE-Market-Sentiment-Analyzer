import puppeteer from "puppeteer";
import axios from "axios";
import cron from "node-cron";
import { FoSecDataItem } from "./Fetch_Data_Model";
import './logger';
require('dotenv').config();
import {get_token} from "./Get_Token"


cron.schedule('*/3 * * * *', () => {
    console.log("Running cron job at: ", new Date().toLocaleTimeString());
    analysis_strategy();
})


interface NseApiResponse {
    FOSec: {
        data: FoSecDataItem[];
    }
}

function calculate_sum_percChange(data: FoSecDataItem[]): number {
    let total = 0;
    for (const item of data) {
        total += Math.abs(item.perChange);
    }
    return total;
}

export async function fetch_nse_data(link: string): Promise<FoSecDataItem[] | undefined> {
    const browser = await puppeteer.launch({
        headless: true, // set false to see browser
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    // Navigate to NSE to set cookies
    await page.goto('https://www.nseindia.com', { waitUntil: 'networkidle2' });

    // Get cookies from page
    const cookies = await page.cookies();

    // Format cookies as header string
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    // console.log(link)
    // Now make the API request using axios with these cookies
    let data;
    try {
        const response = await axios.get<NseApiResponse>(link, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.nseindia.com/',
                'Cookie': cookieHeader,
            }
        });

        data = response.data.FOSec.data;
        console.log("Fetched NSE data:");
    } catch (error) {
        console.error("Error fetching NSE data:", error);
    }
    return data;
    await browser.close();
}

function sortDescending(data: FoSecDataItem[], filter_parameter: keyof FoSecDataItem): FoSecDataItem[] {
    return data.slice().sort((a, b) => {
        const aValue = a[filter_parameter];
        const bValue = b[filter_parameter];

        if (typeof aValue !== 'number' || typeof bValue !== 'number') {
            throw new Error(`Field ${filter_parameter} is not numeric and cannot be sorted`);
        }
        return bValue - aValue;
    });
}

function sortAscending(data: FoSecDataItem[], filter_parameter: keyof FoSecDataItem): FoSecDataItem[] {
    return data.slice().sort((a, b) => {
        const aValue = a[filter_parameter];
        const bValue = b[filter_parameter];

        if (typeof aValue !== 'number' || typeof bValue !== 'number') {
            throw new Error(`Field ${filter_parameter} is not numeric and cannot be sorted`);
        }
        return aValue - bValue;
    });
}

export async function analysis_strategy() {
    const url = ["https://www.nseindia.com/api/live-analysis-variations?index=gainers", "https://www.nseindia.com/api/live-analysis-variations?index=loosers"]
    let sum_per: number[] = [] //sum[0]=gainers, sum[1]=losers
    let gainerData: FoSecDataItem[] | undefined;
    let loserData: FoSecDataItem[] | undefined;
    // strategy add whose is greater do that
    for (const item in url) {
        const page_data = await fetch_nse_data(url[item]);

        if (page_data) {
            const total = calculate_sum_percChange(page_data);
            sum_per.push(total);
        } else {
            sum_per.push(0);
        }

        if (item === '0') {
            gainerData = page_data;
        } else if (item === '1') {
            loserData = page_data;
        }
    }
    let performer;
    const filter_parameter = process.env.filter_parameter as keyof FoSecDataItem;

    // check whether to buy or sale
    if (sum_per[0] > sum_per[1]) {
        console.log("🔼 Market is gaining overall. | Buy");
        // console.log(page_data)
        if (gainerData) {
            performer = sortDescending(gainerData, filter_parameter);
            const token = await get_token(performer)
            printTable(performer,token)
        } else {
            console.log("No data available to sort.");
        }
    } else if (sum_per[1] > sum_per[0]) {
        console.log("🔻 Market is losing overall. | Sell");
        if (loserData) {
            performer = sortAscending(loserData, filter_parameter);
            const token = await get_token(performer)
            printTable(performer,token)
        } else {
            console.log("No data available to sort.");
        }
    } else {
        console.log("⚖️ Market is balanced.");
    }
}

function printTable(rows: FoSecDataItem[],tokenData: { symbol: string; token: string }[]) {
    const header = `| ${'Symbol'.padEnd(25)} | ${'Per Change'.padEnd(15)} | ${'Token Symbol'.padEnd(25

        
    )} | ${'Token'.padEnd(12)} | `;
    const separator = '-'.repeat(header.length);
    console.log(header);
    console.log(separator);

    rows.forEach(row => {
        const searchKey = `${row.symbol}-${row.series}`;
        const foundToken = tokenData.find(t => t.symbol === searchKey)

        console.log(
            `| ${row.symbol.padEnd(25)} | ${(`${row.perChange}%`).padEnd(15)} | ${(foundToken ? foundToken.symbol : 'N/A').padEnd(25)}|${foundToken ? foundToken.token.padEnd(12) : 'N/A'.padEnd(12)} |`
        );
    });
}

