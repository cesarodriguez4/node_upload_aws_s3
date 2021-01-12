const path = require('path')
const fs = require('fs')
const AWS = require('aws-sdk')
const gm = require('gm')


function getFileExtension(filename) {
    return filename.split('.').pop()
}
// Optionally, if you want to delete sources
function unlinkUploadedImages(imagesToUpload) {
    try {
      imagesToUpload.forEach(image => {
        fs.unlink(image.Key, () => {
          console.log(`File ${image.Key} locally deleted successfully`)
        })
      })
  
    } catch (e) {
      console.log(`error unlinking file ${image.Key}`)
      console.log(e)
    }
}

function changeExt(fileName, newExt) {
    var pos = fileName.includes(".") ? fileName.lastIndexOf(".") : fileName.length
    var fileRoot = fileName.substr(0, pos)
    var output = `${fileRoot}.${newExt}`
    return output
  }


function upload() {  
    return new Promise((resolve, reject) => {
        const directoryPath = path.join(__dirname, '')
        fs.readdir(directoryPath, function (err, files) {
            if (err) {
                console.log('Error!')
                console.log('Unable to scan directory: ' + err)
                return reject('Unable to scan directory')
            }
            console.log('Scanning directory...') 
            const totalFiles = files.length
            console.log(`${totalFiles} files found`)
            const allowedFormats = ['png', 'jpg', 'jpeg', 'gif']
            files.forEach(async function (file, index) {
                const ext = getFileExtension(file)
                if(allowedFormats.includes(ext)) {
        
                    const ID = 'YOUR_ID'
                    const SECRET = 'YOUR_SECRET'
                    const BUCKET_NAME = 'BUCKET_NAME'
        
                    let Bucket = BUCKET_NAME+'/images'
                    const s3 = new AWS.S3({
                        accessKeyId: ID,
                        secretAccessKey: SECRET
                    })
                    const filesToUpload = []
                    try {
                        await s3.headObject({
                            Bucket: BUCKET_NAME,
                            Key: file,
                        }).promise()
                        console.log('File exist in s3, skiping...')
                      } catch (headErr) {
                        if (headErr.code === 'NotFound') {
                          // Uploading file
                          console.log(`📁 File ${index+1} of ${totalFiles}`)
                          console.log(`${totalFiles-(index+1)} files pending`)
                            gm(file)
                            .compress('JPEG')
                            .write(file, async function(error) {
                             console.log('compressing file...')   
                            if (error) {
                                console.log('Error compressing JPEG')
                                console.log(error)
                                reject('Error compressing JPEG')
                            }

                            if (!error) {
                                const fileContent = fs.readFileSync(file)
                                const originalImage = {
                                Bucket,
                                Key: file,
                                Body: fileContent
                                }
                                filesToUpload.push(originalImage)
                                const newfile = changeExt(file, 'webp')
                                const newFileDir = file.replace(file, newfile)
                                gm(file)
                                .toBuffer('webp', async (err, buffer) => {
                                if (err) {
                                    console.log('Error creating webp')
                                    console.log(error)
                                    reject('Error creating webp')
                                }
                                if (!err) {
                                    console.log('generating Webp...')
                                    await fs.writeFile(newFileDir, buffer, async function() {
                                        const fileContent = fs.readFileSync(newFileDir)
                                        const webpImage = {
                                        Bucket,
                                        Key: newfile,
                                        Body: fileContent
                                        }
                                        filesToUpload.push(webpImage)
                                        await Promise.all(
                                        filesToUpload.map(param => s3.upload(param).promise())
                                        )
                                        console.log(`File ${file} Successfully uploaded. ✅`)
                                        // unlinkUploadedImages(filesToUpload)
                                    })
                                }
                              })
                            }
                          })  
                        }
                    }
                } else {
                    console.log(`File ${file} is not an image, skipping...`)
                }
            })
        })
    })
}

async function start() {
    await upload()
}

try {
    start()
} catch(e) {
    console.error(e)
}