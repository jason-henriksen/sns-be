// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const { TABLE_NAME } = process.env;

exports.handler = async event => {
  let connectionData;

  let postData = JSON.parse(event.body).data;
  console.log(postData);

  try {
    connectionData = await ddb.scan({ TableName: TABLE_NAME }).promise();
  } catch (e) {
    console.log(e);
    return { statusCode: 500, body: e.stack };
  }


  try {

    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    })

    const postCalls = connectionData.Items.map(async ({ connectionId }) => {
      try {
        if ('LASTMSG' !== connectionId) {
          await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise()
        }
      } catch (e) {
        if (e.statusCode === 410) {
          console.log(`Found stale connection, deleting ${connectionId}`);
          await ddb.delete({ TableName: process.env.TABLE_NAME, Key: { connectionId } }).promise();
        } else {
          throw e;
        }
      }
    });

    // await all of the message sends in parallel.
    await Promise.all(postCalls);
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};