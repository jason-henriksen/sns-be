import aws from "aws-sdk"
import fetch from 'node-fetch'
import aws4 from "aws4"
import https from 'https'

const sns = new aws.SNS()

exports.handler = async function (event) {

  try {

    console.log('sns subscribe', event)
    console.log('sns subscribe', event.pathParameters.phone)
    console.log('sns subscribe', process.env.TopicName)


    if (!event.pathParameters.phone) {
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


    // Create subscription list
    const params = {
      TopicArn: process.env.TopicName,
    }

    console.log(params)

    let foundARN = ''

    // Create promise and SNS service object
    await sns.listSubscriptionsByTopic(params).promise()
      .then(function (data) {
        console.log("List Subs is ", data)

        // for each returned subscription
        data.Subscriptions.map((s) => {
          if (s.Endpoint === event.pathParameters.phone ||
            s.Endpoint === '+' + event.pathParameters.phone) {
            foundARN = s.SubscriptionArn;
            console.log('found arn: ' + foundARN);
          }
        })

      }).catch(function (err) {
        // list failed
        console.error('list', err)
        throw err
      })

    //https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:050440021590:sns-be-audition-topic:e4be8847-1b0e-4483-96ba-fa8f3b71fc69    
    //https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:050440021590:sns-be-audition-topic:0b6e2678-e672-4972-89a2-79a580bf8788
    // this should be factored out, but for a demo it's nice to see it all in one place.

    if (foundARN) {

      opts = { service: 'sqs', region: 'us-east-1', path: '/?Action=ListQueues' }
      aws4.sign(opts)

      await fetch(`https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=${foundARN}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(async function (fetchData) {
          // if we get here the sns unsub was successful
          console.log(fetchData)
        }).catch(function (err) {
          console.error('SNS unsubscribe failed', err)
          throw err
        })


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
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
      },
      body: JSON.stringify({ msg: 'subscription ok' })
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
