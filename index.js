const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const app = express();

// Set up multer storage engine with dynamic destination path
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, req.query.path || '');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Set up multer instance with storage engine and file filter
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Invalid file type'));
    } else {
      cb(null, true);
    }
  }
});

function generateSessionHash() {
    const random = Math.random().toString(36).substring(2, 13);
    return random;
}

// Handle POST request to '/upload' endpoint with multer middleware
app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No PDF file uploaded');
  }
  const file = req.file
  let globalVariable = ""
  console.log("from the response")
    console.log(globalVariable)
    console.log("after the response")
    const fileName = file.filename
    const fileSize = file.size
    var sessionhash = generateSessionHash()
    console.log(fileName)
    console.log(fileSize)
  const formData = new FormData();
    formData.append("files", fs.createReadStream(file.path));

    axios.post('https://fffiloni-langchain-chat-with-pdf-openai.hf.space/upload', formData, {
    headers: formData.getHeaders()
    })
    .then(response => {
        console.log("inside starts here")
        console.log(response.data[0])
        const baseUrl = 'https://fffiloni-langchain-chat-with-pdf-openai.hf.space/file=';
        const url = baseUrl+response.data[0]
        console.log(url)
        console.log("inside ends here")
        const payload = {
            "data": [{
                "blob":{},
                "data": url,
                "is_file":true,
                "name": response.data[0],
                "orig_name":fileName,
                "size":file.size
            } , "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"],
            "event_data" : null,
            "fn_index" : 1,
            "session_hash ": sessionhash
        };
    
        axios.post('https://fffiloni-langchain-chat-with-pdf-openai.hf.space/run/predict', payload)
            .then(response => {
                console.log(response.data);
                res.status(200).json({data : sessionhash , success : true})
            })
            .catch(error => {
                console.error(error);
                res.status(501).json({success : false})
            });
    })
    .catch(error => {
    console.error(error);
    });
    

});

// Start server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
