const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
const {User,Post} = require('./models');
const secretKey = 'YourSecretKey123';

mongoose.connect('mongodb://localhost/assignment',{
    useNewUrlParser:true,
    useUnifiedTopology:true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:',error);
});

app.post('/register',async (req,res) => {
    try {
        const {name,email,password} = req.body;
        const user = new User({name,email,password});
        await user.save();
        res.json({status:'success',user});
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});

app.post('/login', async (req,res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({email,password});
        if(!user) {
            return res.status(401).json({error:'Invalid credentials'});
        }
        const token = jwt.sign({userId:user.id},secretKey);
        res.json({status:'success',token});
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});

app.post('/posts', async (req,res) => {
    try {
        const {title,body,image} = req.body;
        if(!req.headers.authorization) {
            return res.status(401).json({error:'Authorization header is missing '});
        }
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token,secretKey);
        const userId = decoded.userId;
        const post = new Post({title,body,image, user:userId});
        await post.save();
        res.json({status:'post created', post});
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});

app.put('/posts/:postId', async (req,res) => {
    try {
        const {title,body,image} = req.body;
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token,secretKey);
        const userId = decoded.userId;
        const post = await Post.findOneAndUpdate({_id:req.params.postId,user:userId},{title,body,image},{new:true});
        if(!post) {
            return res.status(404).json({error:'post not found'});
        }
        res.json({status:'success',post});
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});

app.delete('/posts/:postId', async (req,res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token,secretKey);
        const userId = decoded.userId;
        const post = await Post.findByIdAndDelete({_id:req.params.postId,user:userId});
        if(!post) {
            return res.status(404).json({error:'post not found'});
        }
        res.json({status:'successfully deleted'});
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});

app.get('/posts', async (req,res) => {
    try {
        const posts = await Post.find();
        res.json({status:'success',posts});
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});