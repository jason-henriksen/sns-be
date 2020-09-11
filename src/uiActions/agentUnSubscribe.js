import aws from "aws-sdk"
import fetch from 'node-fetch'

const sns = new aws.SNS()

exports.handler = async function (event) {

  try {

    console.log('sns unsubscribe', event)
    console.log('sns unsubscribe', event.pathParameters.state)
    console.log('sns unsubscribe', event.pathParameters.name)
    console.log('sns unsubscribe', process.env.TopicName)

    let bodyData = JSON.parse(event.body)
    let webhookURL = bodyData.url
    console.log('sns unsubscribe', process.env.webhookURL)

    if (!webhookURL) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
          "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
        },
        body: JSON.stringify({ err: 'unable to find correct parameters' })
      }
    }

    let foundARN = ''
    let result = 'err'


    
    const params = {
      TopicArn: process.env.TopicName,
    }
    
    await sns.listSubscriptionsByTopic(params).promise()
      .then(function (data) {
        // for each returned subscription
        data.Subscriptions.map((s) => {
          if (s.Endpoint === webhookURL ) { // match on the url that was subscribed with
            foundARN = s.SubscriptionArn;
          }
        })
      }).catch(function (err) {  throw err  })

    if (foundARN) {
      await fetch(`https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=${foundARN}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(async function (fetchData) { result = fetchData })
      .catch(function (err) {            throw err })


      /**  If you think that using the api to do this is easier:  
       *   WARNING! THIS DOES NOT WORK!
       *   You will be denied permissions.  I've never found a lambda permission that will work, 
       *   But just raw calling that URL up there works fine!   Silly Amazon, Tricks are for kids!
       *
      await sns.unsubscribe({ SubscriptionArn: foundARN }).promise()
        .then(function (data) {
          console.log("unsub result ", data)
        })
        .catch(function (err2) {
          // unsub failed
          console.error('unsub', err2)
        })
        */
    }
    else {
      console.log('no arn found')
      result = 'no subscription found'
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
      },
      body: JSON.stringify({ msg: result })
    }
  }
  catch (ex) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
      },
      body: JSON.stringify({ err: ex.msg })
    }
  }
}

export default exports.handler
