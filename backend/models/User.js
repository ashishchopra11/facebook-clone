const SignUpModel = require('./signupdata')
const commentModel = require('./commentModel')
const PostModel = require('./postModel')
const LikeModel = require('./likeModel')
const ShareModel = require('./shareModel')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {SECRET} = require('../config/config')

const saveSignUpData  = async(req,res,data)=>{
    let existingUser
    let modeldata = new SignUpModel(data)
    existingUser = await SignUpModel.find({email: data.email})
    if(existingUser.length == 0){
        response = await modeldata.save()
        return res.status(200).send({msg:'User saved Successfully'})
    }
    else{
        return res.status(400).send({msg:'User already Existed'})
    }   
}

const loginUser = async(req,res)=>{
    let checkUser = await SignUpModel.find({email: req.body.email})
    if(checkUser.length != 0){
        let password = checkUser[0].password
        let status = bcryptjs.compareSync(req.body.password,password)
        if(status){
            jwt.sign({userToken: checkUser[0]._id},SECRET,{ expiresIn: '24h'},(err,token)=>{
                return res.status(200).send({msg:'Login Successful',token: token})
            })
        }
        else{
            return res.status(400).send({msg:'Incorrect Login Credentials'})
        }
    }
}

const particularUserData  = async(req,res)=>{
    try{
        let fetchId = await PostModel.findOne({_id: req.query._id})
        if(fetchId.length!=0){
            return res.status(200).send(fetchId.data);
        }
    }
    catch(error){
        return res.status(200).send({message: 'No Posts exist for this user'})
    }
}
//get post of all users
const getAllPosts = async(req,res)=>{
    try{
        let post = await PostModel.find().sort({"postedAt":'desc'})
        console.log(post)
        return null;
        }
    catch(error){
        return error
    }
}

const checkUserToken = async(req,res)=>{
    jwt.verify(req.headers.token,SECRET,(err,authData)=>{
        if(err){
            return res.status(401).send({'msg':'Invalid Token'})
        }
        return res.status(200).send({'msg':'Valid Token'})
    })
}
//save post data
const saveUserPost = async( req, res )=>{
    try{
        //get user detail of person who created post
        let signUpUser = await SignUpModel.find({_id:req.headers.tokenValue})
        req.body.userId = signUpUser[0].email;
        req.body.userName=signUpUser[0].firstName +" "+ signUpUser[0].lastName;
        let savePost = new PostModel(req.body)
        await savePost.save();
        return {
            status:200,
            msg:'new user post added'
            }

    }catch(err){
        return {
            status:400,
            msg:'something went wrong',
            error:err
        }
    }
}

const userComment = async( req , res ) =>{

    try{
        let comment = await commentModel.find({postId:req.headers.tokenValue});
        let signUpUser = await SignUpModel.find({_id:req.headers.tokenValue})
        // let postid = await commentModel.find({postid:postmodel[0].postid});
        req.body.postId = req.headers.tokenValue;
        req.body.comments[0].commentator=signUpUser[0].firstName +" "+ signUpUser[0].lastName;
        console.log("commentator name"+ req.body.comments[0].commentator)
        console.log(comment);
        if ( comment.length != 0 ){
            debugger
         console.log(req.body)
            await commentModel.findOneAndUpdate({
                postId:req.body.postId,
            },
            {
                $push:{
                    comments:req.body.comments,
                }
            }).sort({commentData : -1});
            return {
                'status':200,
                'msg':'multiple comments added'
            }
        }
        else
        {
            let commentData = new commentModel(req.body);
            await commentData.save();
            return {
                status:200,
                msg:'new comment added'
                }
            }
        }
        catch(err){
            return {
                'status':404,
                'msg':'something went wrong',
                'error':err
            }
        }
    }
const getComments = async(req , res )=>{
    try{
        let data = await commentModel.find();
        return data;
    }
    catch( error ){
        console.log(error)
    }
}

const saveLikes = async(req,res)=>{
    let likeData = new LikeModel({
        'userId' : req.headers.tokenValue,
        'postId' : req.body.postId
    })
    await likeData.save()
    return res.status(200).send({msg:'Like Added Successfully'})
}

const deleteLikes = async(req,res)=>{
    await LikeModel.findOneAndDelete({'postId':req.body.postId})
    return res.status(200).send({msg:'Like deleted Successfully'})
}

const saveSharedPost = async(req,res)=>{
    let existingShare = await ShareModel.find({$and: [{'userId':req.headers.userToken}, {'postId':req.body.postId}]})
    if(existingShare.length == 0){
        let shareData = new ShareModel({
            'userId':req.headers.userToken,
            'postId':req.body.postId
        })
        await shareData.save()

        let existingUser = await SignUpModel.findById({'_id':req.headers.tokenValue})
        let postData = new PostModel({
            userName: existingShare.firstName+' '+existingShare.lastName,
            userId: req.headers.tokenValue,
            likeCounts: 0,
            shareCounts: 0,
            postData: req.body.postData
        })
        postData.save()
        return res.sendStatus(200)
    }
}
module.exports = {
    saveSignUpData,
    loginUser,
    particularUserData,
    getAllPosts,
    checkUserToken,
    saveUserPost,
    userComment,
    getComments,
    saveLikes,
    deleteLikes,
    saveSharedPost
}
