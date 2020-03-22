import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { resolveAny, getServers } from "dns";
import { performance } from "perf_hooks";
import { promisify } from 'util';
import { v4 as uuid } from "uuid";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    const dnsLookupInput: string = process.env['DnsLookupSingleHostName']
    let currentDnsLookupInput = '';
    if (req.body?.dnsLookupInput) {
        context.log('Changing dnslookup to: ' + req.body.dnsLookupInput);
        currentDnsLookupInput = req.body.dnsLookupInput;
    } else {
        currentDnsLookupInput = dnsLookupInput;
    }
    const baseMultiplier: number = 10;
    let currentMultiplier = 0;
    if (req.body?.multiplier > 0) {
        context.log('Changing multiplier to: ' + req.body.multiplier);
        currentMultiplier = req.body.multiplier;
    } else {
        currentMultiplier = baseMultiplier;
    }

    const baseItem: QueueItem = { DnsHostName: currentDnsLookupInput };
    const baseQueueItem = JSON.stringify(baseItem);
    let queueList = [];

    for (let index = 0; index < currentMultiplier; index++) {
        queueList.push(baseQueueItem);
    }
    context.bindings.myQueueItem = queueList;
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: queueList.length + " Items added to queue"
    };
    context.done();
};

interface QueueItem {
    DnsHostName: string
}

export default httpTrigger;
