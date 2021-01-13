const path = require('path')
const fs = require('fs')
const AWS = require('aws-sdk')
const gm = require('gm')
const async = require('async')


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

// A few files
function upload() {  
    return new Promise((resolve, reject) => {
        console.log('Directory: ', __dirname)
        const directoryPath = path.join(__dirname, '')
        fs.readdir(directoryPath, async function (err, files) {
            if (err) {
                console.log('Error!')
                console.log('Unable to scan directory: ' + err)
                return reject('Unable to scan directory')
            }
            console.log('Scanning directory...') 
            const totalFiles = files.length
            console.log(`${totalFiles} files found`)
            const allowedFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'webP' , 'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG', 'svg']
            await files.forEach(async function (file, index) {
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
                            Bucket: BUCKET_NAME+'/images',
                            Key: file,
                        }).promise()
                        console.log(`⚠️  File ${file} exist in s3, skiping...`)
                      } catch (headErr) {
                        if (headErr.code === 'NotFound') {
                          // Uploading file
                          console.log(`📁 File ${index+1} of ${totalFiles}`)
                          console.log(`${totalFiles-(index+1)} files pending`)
                            gm(file)
                            .compress('JPEG')
                            .write(file, async function(error) {
                             console.log(`compressing file ${file}...`)   
                            if (error) {
                                console.log(`Error compressing JPEG`)
                                console.log(error)
                                reject(`Error compressing JPEG`)
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
                    console.log(`❌ File ${file} is not an image, skipping...`)
                }
            })
            setTimeout(function(){}, 1000 * 60 * 60 * 24)
        })
    })
}


function transform() {  
    return new Promise((resolve, reject) => {
        console.log('Directory: ', __dirname)
        const directoryPath = path.join(__dirname, '')
        fs.readdir(directoryPath, async function (err, files) {
            if (err) {
                console.log('Error!')
                console.log('Unable to scan directory: ' + err)
                return reject('Unable to scan directory')
            }
            console.log('Scanning directory...') 
            const totalFiles = files.length
            console.log(`${totalFiles} files found`)
            const allowedFormats = ['png', 'jpg', 'jpeg']
            files.forEach(async function (file, index) {
                const ext = getFileExtension(file)
                if(allowedFormats.includes(ext.toLowerCase())) {
                    // Uploading file
                    console.log(`📁 File ${index+1} of ${totalFiles}`)
                    console.log(`${totalFiles-(index+1)} files pending`)
                    gm(file)
                    .compress('JPEG')
                    .write(file, async function(error) {
                        console.log(`compressing file ${file}...`)   
                    if (error) {
                        console.log(`Error compressing JPEG`)
                        console.log(error)
                        return reject(`Error compressing JPEG`)
                    }
                    const newfile = changeExt(file, 'webp')
                    const newFileDir = file.replace(file, newfile)
                    gm(file)
                    .toBuffer('webp', async (err, buffer) => {
                    if (err) {
                        console.log('Error creating webp')
                        console.log(error)
                        return reject('Error creating webp')
                    }
                    console.log('generating Webp...')
                    await fs.promises.writeFile(newFileDir, buffer)
                    console.log(`Webp ${file} Successfully created. ✅`)
                })
            })      
        } else {
            console.log(`❌ File ${file} is not an image, skipping...`)
        }
            })
            resolve('Starting transformation.')
        })
    })
}



// Lots of files
function asyncUpload() {
    return new Promise((resolve, reject) => {
        console.log('Directory: ', __dirname)
        const directoryPath = path.join(__dirname, '')
        const filesToUpload = []
        fs.readdir(directoryPath, async function (err, files) {
            if (err) {
                console.log('Error!')
                console.log('Unable to scan directory: ' + err)
                return reject('Unable to scan directory')
            }
            console.log('Scanning directory...') 
            const totalFiles = files.length
            console.log(`${totalFiles} files found`)
            const allowedFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'webP', 'svg']
            files.forEach(async function (file, index) {
                const ext = getFileExtension(file)
                if(allowedFormats.includes(ext.toLowerCase())) {
                    // Uploading file
                    console.log(`📁 File ${index+1} of ${totalFiles}`)
                    console.log(`${totalFiles-(index+1)} files pending`)
                    gm(file)
                    .compress('JPEG')
                    .write(file, async function(error) {
                        console.log(`compressing file ${file}...`)   
                    if (error) {
                        console.log(`Error compressing JPEG`)
                        console.log(error)
                        return reject(`Error compressing JPEG`)
                    }
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
                            // console.log(`File ${file} Successfully uploaded. ✅`)
                            // unlinkUploadedImages(filesToUpload)
                        })
                    }
                })
            })  
            } else {
                console.log(`❌ File ${file} is not an image, skipping...`)  
            }
            })
        })
        const ID = 'ID'
        const SECRET = 'SECRET'
        const BUCKET_NAME = 'BUCKET_NAME'
        const Bucket = BUCKET_NAME+'/images'
        const s3 = new AWS.S3({accessKeyId: ID,secretAccessKey: SECRET})
        const PARALLEL_UPLOADS = 10;
        const q = async.queue((task, callback) => {
            console.log('starting queue');
            s3.upload(task, callback)
        }, PARALLEL_UPLOADS);

        q.drain = function() {
            console.log('All items have been processed');
            resolve('All items have been processed');
        };
        q.push([...filesToUpload]);
        q();
    })
}

async function start() {
    try {
        const res = await transform()
        console.log(res); 
    } catch(e) {
        console.error(e)
    }
}

start() 
