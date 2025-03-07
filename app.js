const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const express = require("express")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const { userModel } = require("./models/user")

require('dotenv').config()

const PORT = process.env.PORT || 8080;


const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI)

const generateHashedPassword = async (password) => {
    const salt = await bcrypt.genSalt(10)  //salt=cost factor value
    return bcrypt.hash(password, salt)
}

app.post("/login",(req,res)=>{
    let input = req.body
    userModel.find({"emailid":req.body.emailid}).then(
    (response)=>{
        if(response.length > 0){
            let dbPassword = response[0].password
           // console.log(dbPassword)
            bcrypt.compare(input.password,dbPassword,(error,isMatch)=>{ //input pswd and hashed pswd is  compared
                if (isMatch) {
                    //if login success generate token
                    jwt.sign({emailid:input.emailid},process.env.JWT_SECRET,{expiresIn:"1d"},
                        (error,token)=>{
                            if (error) {
                                res.json({"status":"unable to create token"})
                            } else {
                                res.json({"status":"success","userId":response[0]._id,"token":token})
                            }
                        }
                    )
                } else {
                    res.json({"status":"incorrect"})
                }
            })
            
        } else {
            res.json({"status":"user not found"})
        }
    }
    ).catch()
  
})
//---------------------USER SIGNUP----------------------------------------------------------------

app.post("/usersignup", async (req, res) => {

    let input = req.body
    let hashedPassword = await generateHashedPassword(input.password)
    //console.log(hashedPassword)

    input.password = hashedPassword     //stored the hashed password to server
    let user = new userModel(input)
    user.save()
    //console.log(user)
    res.json({ "status": "success" })
})

app.listen(PORT, () => {
    console.log(`server started on PORT ${PORT}`)
})