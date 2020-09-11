
import aws from "aws-sdk"

const sns = new aws.SNS()


exports.handler = async function (event) {
  
  console.log('sns subscribe', event)
  console.log('sns subscribe', event.pathParameters.gender)
  console.log('sns subscribe', event.pathParameters.state)
  console.log('sns subscribe', process.env.TopicName)


  if (!event.pathParameters.gender || !event.pathParameters.state ) {
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

  const body = JSON.parse(event.body);
  const msg = body.msg

  // make a subscription
  //const subscriptionArn = await awsUtil.snsSubscribe(envVars.SNS_TOPIC_REVIEW, orgName, data.url)

  let textGender = 'non-binary'
  if ('M' === event.pathParameters.gender) { textGender ='male' }
  if ('F' === event.pathParameters.gender) { textGender = 'female' }

  const params = {
    TopicArn: process.env.TopicName,
    Message: JSON.stringify(
    {
        'default': `New audition for ${textGender} actors in ${event.pathParameters.state}! Apply Now!`,
        'sms': `New audition for ${textGender} actors in ${event.pathParameters.state}! ${msg}  --Sent by SMS at ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')} Apply Now!`,
        'https': `New audition for ${textGender} actors in ${event.pathParameters.state}! ${msg}  --Sent by API at ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')} Apply Now!`
    })
    ,
    MessageStructure: 'json',
    MessageAttributes: {
      state: {
        DataType: 'String',
        StringValue: event.pathParameters.state
      },
      gender: {
        DataType: 'String',
        StringValue: event.pathParameters.gender
      }
    }
  } 

  console.log(params)
  await sns.publish(params).promise()
    .then(function (data) {console.log(data)})
    .catch(function (err) {console.error(err)})


  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      "Cache-Control": "must-revalidate,no-store,proxy-revalidate",
    },
    body: JSON.stringify({ msg: 'publish ok' })
  }

}
