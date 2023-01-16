const AWS = require('aws-sdk');
const util = require('util');
const bucketName = process.env.AWS_BUCKET_NAME;

const creds = new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    signatureVersion: 'v4',
    credentials: creds
});

const s3 = new AWS.S3();
const _uploadImage = util.promisify(s3.upload).bind(s3);
const _getImageUrl = util.promisify(s3.getSignedUrl).bind(s3);

const uploadImage = async (imageName, buffer) => {
    try {
        if (!imageName || !buffer) {
            throw new Error('Missing required parameter: imageName or buffer');
        }
        console.log(`Uploading image ${imageName} to S3 bucket ${bucketName}`);

        const params = {
            Bucket: bucketName,
            Key: imageName,
            Body: buffer,
            ContentType: 'image/jpeg'
        };
        await _uploadImage(params);
        console.log(`Image ${imageName} uploaded successfully.`);
    }
    catch (err) {
        console.error(`Failed to upload image ${imageName} to S3 bucket ${bucketName}.`, err);
    }
}

const getImageUrl = async (imageName) => {
    try {
        if (!imageName) {
            throw new Error('Missing required parameter: imageName');
        }
        console.log(`Creating link for image ${imageName} from S3 bucket ${bucketName}`);
        const params = {
            Bucket: bucketName,
            Key: imageName,
            Expires: 14400
        };
        const imageUrl = await _getImageUrl('getObject', params);
        console.log(`Link for image ${imageName} generated: ${imageUrl}`);
        return imageUrl;
    }
    catch (err) {
        console.error(`Failed to retrieve link for image ${imageName} from S3 bucket ${bucketName}.`, err);
    }
}

module.exports = {
    uploadImage,
    getImageUrl
};

