import { AzureFunction, Context } from "@azure/functions"
import { promises as dnsPromise } from "dns";
import { performance } from "perf_hooks";
import { promisify } from 'util';
import { v4 as uuid } from "uuid";

const queueTrigger: AzureFunction = async function (context: Context, myQueueItem: { DnsHostName: string }): Promise<void> {
    // const dnsLookupInput = process.env['DnsLookupSingleHostName']
    const dnsServer: string = process.env['DnsServer']
    const promResolver = new dnsPromise.Resolver();
    const date = new Date();
    const partionKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`

    let perfMeasure = {
        PartitionKey: partionKey,
        RowKey: uuid(),
        DnsLookupInuput: myQueueItem.DnsHostName,
        TimeMill: 0,
        Servers: [],
        Result: []
    };
    if (dnsServer !== undefined) {
        context.log('Setting DnsServer: ' + dnsServer);
        perfMeasure.Servers = [dnsServer];
        promResolver.setServers([dnsServer]);
    }
    const servers: string[] = promResolver.getServers();
    context.log('Servers: ', servers);
    perfMeasure.Servers = servers;
    perfMeasure.PartitionKey += '.' + (servers.join('-'));

    if (perfMeasure.DnsLookupInuput === undefined) {
        // just end it without writing to output table.
        context.log('No DNSHostName found');
        context.done();
    } else {
        const t2 = performance.now();
        try {
            // const promDnsResolveAny = promisify(resolver.resolveAny);
            // const result2 = await promDnsResolveAny(perfMeasure.DnsLookupInuput);
            const result2 = await promResolver.resolve(perfMeasure.DnsLookupInuput);
            const t3 = performance.now();
            const measuredTime2 = t3 - t2;
            perfMeasure.TimeMill = measuredTime2;
            context.log("ResolveAny promisify took " + (measuredTime2) + " milliseconds.")
            context.res = {
                // status: 200, /* Defaults to 200 */
                body: result2
            };
            perfMeasure.Result = result2;
            context.log('MeasuredTime: ', perfMeasure);
            context.done(null, perfMeasure);

        } catch (error) {
            const t4 = performance.now();
            context.log(error);
            const measuredTime3 = t4 - t2;
            perfMeasure.TimeMill = measuredTime3;
            context.res = {
                status: 500,
                body: "Error During dns resolve."
            };
            context.log('MeasuredTime: ', perfMeasure);
            context.done(null, perfMeasure);

        }
    }
};

export default queueTrigger;
