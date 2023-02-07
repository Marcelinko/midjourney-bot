const jimp = require("jimp");

//unused
const readImages = (url) => jimp.read(url)
    .then((image) => {

        const images = sliceImage(image);
        let imagesBase64 = []
        images.forEach(image => {
            image.getBase64(jimp.MIME_PNG, (err, base64) => {
                if (err) throw err;
                imagesBase64.push(base64);
            });
        })

        return imagesBase64;
    })
    .catch((err) => {
        console.log(err);
    });

const sliceImage = (image, imageNo) => {
    //get image size
    const imageWidth = image.getWidth();
    const imageHeight = image.getHeight();

    //cut all 4 images
    let images = [];

    for (let i = 0; i < 4; i++){
        images.push(image.clone());
    }

    images[0] = images[0].crop(0,0,imageWidth/2,imageHeight/2);
    images[1] = images[1].crop(imageWidth/2,0,imageWidth/2,imageHeight/2);
    images[2] = images[2].crop(0,imageHeight/2,imageWidth/2,imageHeight/2);
    images[3] = images[3].crop(imageWidth/2,imageHeight/2,imageWidth/2,imageHeight/2);

    return images;
}

module.exports = { readImages }