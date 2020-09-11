
import moment from 'moment';

const idxName = 'web-hook-log';

const esDomain = process.env.ESURL ;

let es = require('elasticsearch').Client({
  hosts: [esDomain],
  log: [{
    type: 'stdio',
    levels: ['info', 'debug']  // handy! Logs the ES activity to cloudwatch
  }],
  apiVersion: '7.4',
  connectionClass: require('http-aws-es')
});


exports.handler = async function (event, context) {

  let end = moment();
  let start = moment().add('month', -1);  

  console.log(event.pathParameters.env);
  console.log(event.pathParameters.org);
  console.log(event.pathParameters.service);

  console.log(start, end);
  start = start.toDate().getTime();
  end = end.toDate().getTime();
  console.log(start, end);

  // set the search index, not an index into an array
  var query = {
    bool: {
      must: []
    }
  };
  var range = {};
  range['buildTime'] = { gte: start, lt: end }
  query.bool.must.push({ range: range });
  query.bool.must.push({ match: { org: event.pathParameters.org }  })  

  console.log(JSON.stringify(query,null,2));


  var done = false;
  var from = 0;
  const maxCount = 5000;

  var result = [];

  var cTotal = 0;
  var cStart = 0;
  var cSubmit = 0;
  
  while (!done) {
    
    var t = await es.search({
      index: idxName,
      size: maxCount,
      from: from,
      body: {
        query: query,
        sort: { buildTime: "asc" }
      }
    });

    from += maxCount;
    if (from > t.hits.total.value) {
      done = true;
    }
    
    //result = result.concat(t.hits.hits);

    t.hits.hits.map((h) => {
      try {
        result.push(h._source);
      }
      catch (ex) {
        console.log('invalid date found', ex);
      }
    })
  }

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
    },
    body: JSON.stringify(result)
  };
}
