import aws from "aws-sdk"

const sns = new aws.SNS()

exports.handler = async function (event) {


  try {
    console.log('sns subscribe', event)
    console.log('sns subscribe', event.pathParameters.gender)
    console.log('sns subscribe', event.pathParameters.state)
    console.log('sns subscribe', event.pathParameters.phone)
    console.log('sns subscribe', process.env.TopicName)


    if (!event.pathParameters.gender || !event.pathParameters.state || !event.pathParameters.phone) {
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

    // make a subscription
    //const subscriptionArn = await awsUtil.snsSubscribe(envVars.SNS_TOPIC_REVIEW, orgName, data.url)


    // Create subscribe parameters
    const params = {
      Protocol: 'sms',
      TopicArn: process.env.TopicName,
      Endpoint: event.pathParameters.phone,
      ReturnSubscriptionArn: true, // so that we can log it, possibly save it somewhere?
      Attributes: {
        FilterPolicy: `{"state": ["${event.pathParameters.state}"],"gender": ["${event.pathParameters.gender}"]}` // lame api choice from amazon.  why force a string here?
      }
    }

    // Create promise and SNS service object
    const unsubarn = await sns.subscribe(params).promise()
      .then(function (data) {
        console.log("Subscription ARN is " + data.SubscriptionArn)
        return data.SubscriptionArn // return an empty object so we can use object type check for error detection
      }).catch(function (err) {
        console.error(err)
        throw err
      })

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
      },
      body: JSON.stringify({ msg: 'subscription ok' })
    }


  } catch (ex) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
      },
      body: JSON.stringify({ err: ex.message })
    }
  }

  // if the sns work was successful, save a record of what subscription arn this org is using.
  // (if the org already existed the lambda should have exited by now, otherwise this would write over the unsubscribe data)

  // await awsUtil.save(process.env.BucketName, orgName, { subscriptionArn: subscriptionArn })

}

export default exports.handler
