const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
  endpoint: "https://s3.us-east-1.wasabisys.com",
  signatureVersion: "v4"
});

module.exports = s3;
