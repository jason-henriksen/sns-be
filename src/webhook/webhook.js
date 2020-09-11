
import { w3cwebsocket as W3CWebSocket } from "websocket"
import fetch from 'node-fetch'

const idxName = 'web-hook-log';

let es = require('elasticsearch').Client({
  hosts: [process.env.ESURL], // get host from template.yaml
  log: [{
    type: 'stdio',
    levels: ['info', 'debug'] // viatally important! debug logs to console
  }],
  apiVersion: '7.4',
  connectionClass: require('http-aws-es')
});

// used to await the opening of the web socket
const waitForOpenConnection = (socket) => {
  return new Promise((resolve, reject) => {
    const maxNumberOfAttempts = 10
    const intervalTime = 200 //ms
    let currentAttempt = 0
    const interval = setInterval(() => {
      if (currentAttempt > maxNumberOfAttempts - 1) {
        clearInterval(interval)
        reject(new Error('Maximum number of attempts exceeded'))
      } else if (socket.readyState === socket.OPEN) {
        clearInterval(interval)
        resolve()
      }
      currentAttempt++
    }, intervalTime)
  })
}

// used to safely send a message
const sendMessage = async (socket, msg) => {
  if (socket.readyState !== socket.OPEN) {
    try {
      await waitForOpenConnection(socket)
      socket.send(msg)
    } catch (err) { console.error(err) }
  } else {
    socket.send(msg)
  }
}


exports.handler = async function (event, context) {


  if (event.headers) {
    console.log(event.headers['x-amz-sns-message-type']);
    console.log(event.headers["x-amz-sns-message-id"]);
    console.log(event.headers['x-amz-sns-topic-arn']);
    console.log(event.headers["x-amz-sns-subscription-arn"]);
  }

  let configMessage = '';

  // SNS Confirmation
  if (event.headers && event.headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
    let dataSNS = JSON.parse(event.body);

    await fetch(dataSNS.SubscribeURL, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => { res.text(); })
      .then(text => { console.log(text); })
      // JJHNOTE add error handling here when I'm not feeling like murdering whoever wrote SNS.
      .catch(err => { console.error(err); })
    console.log('post-fetch ');

    // tell AWS that this really is all good.
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
      },
      body: JSON.stringify({ msg: 'ok' })
    };
  }

  console.log(JSON.stringify(event, null, 2));

  console.log(event.pathParameters.state);
  console.log(event.pathParameters.name);


  // add the item to the logs
  let bodyJSON = JSON.parse(event.body);
  console.log(bodyJSON.Type);
  console.log(bodyJSON.Message);

  let data = {
    state: event.pathParameters.state,
    name: event.pathParameters.name,
    msg: bodyJSON.Message,
    buildTime: Date.now(),
  }
  data.id= `${data.state}_${data.name}_${data.buildTime}`


  var t = await es.index({
    index: idxName,
    id: data.id,
    body: data
  });

  // tell all of the people active on websockets to reload their pages
  try {
    let client = new W3CWebSocket('wss://4makz5wwl5.execute-api.us-west-2.amazonaws.com/Prod')
    await sendMessage(client, JSON.stringify({ "action": "sendmessage", "data": "ping" }) )
  }
  catch (ex) {
    console.log(ex)
  }


  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
    },
    body: JSON.stringify({})
  };
}


