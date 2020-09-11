import aws from "aws-sdk"

const sns = new aws.SNS()

exports.handler = async function (event) {

  console.log('sns subscribe', event)
  console.log('sns subscribe', event.pathParameters.state)
  console.log('sns subscribe', event.pathParameters.name)
  console.log('sns subscribe', process.env.TopicName)

  let bodyData = JSON.parse(event.body)
  let webhookURL = bodyData.url

  if (!webhookURL || !event.pathParameters.state || !event.pathParameters.name) {
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

  // Create subscribe parameters
  const params = {
    Protocol: 'https',
    TopicArn: process.env.TopicName,
    Endpoint: webhookURL,
    ReturnSubscriptionArn: true, // so that we can log it, possibly save it somewhere?
    Attributes: {
      FilterPolicy: `{"state": ["${event.pathParameters.state}"]}` // lame api choice from amazon.  why force a string here?
    }
  }

  // Create promise and SNS service object
  const unsubarn = await sns.subscribe(params).promise()
    .then(function (data) {
      console.log("Subscription ARN is " + data.SubscriptionArn)
    }).catch(function (err) {
      console.error(err)
    })

  // if the sns work was successful, save a record of what subscription arn this org is using.
  // (if the org already existed the lambda should have exited by now, otherwise this would write over the unsubscribe data)

  // await awsUtil.save(process.env.BucketName, orgName, { subscriptionArn: subscriptionArn })

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

export default exports.handler
