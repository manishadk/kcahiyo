import fs from 'fs'
import path from 'path'
import md5 from 'md5'
const appRoot = path.resolve()

export default (images, destFolder) => {
  return new Promise((resolve, reject) => {
    let uploadedImages = []
    images.forEach((image, index, images) => {
      fs.readFile(image.path, (err, data) => {
        console.log(image.path)
        if (err) {
          reject(err)
        }
        let uploadDir = appRoot + '/src/public/images/' + destFolder + '/'
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir)
        }
        let filename = md5(image.path + '|' + JSON.stringify(image.lastModifiedDate) + image.name) + path.extname(image.name)
        let filePath = uploadDir + filename
        fs.writeFile(filePath, data, (err) => {
          if (err) {
            // might wanna read filenames array and delete all the images from uploadDir that have been
            // already uploaded
            // something like this please feel free to make changes as you like
            uploadedImages.forEach((path, idx, upImages) => {
              fs.unlink(uploadPath+path, (err) => {
                if(idx === upImages.length - 1){
                  reject(err)
                }
            })})
          } else {
            uploadedImages.push(filename)
            if (index === images.length - 1) {
              resolve(uploadedImages)
            }
          }
        })
      })
    })
  })
}
