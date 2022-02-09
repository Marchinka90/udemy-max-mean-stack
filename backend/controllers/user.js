const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.createUser = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash,
            });
        
        user.save()
            .then(createdUser => {
                res.status(201).json({
                    message: 'User Created!',
                    user: createdUser
                });
            })
            .catch(err => {
                res.status(500).json({message: 'Invalid authentication credentials!'});
            });
        });
}

exports.loginUser = (req, res, next) => {
    let fetchedUser;
    User.findOne({email: req.body.email})
        .then(user => {
            fetchedUser = user;
            if(!user) {
                return res.status(401).json({
                    message: 'Auth failed',
                    user: ''
                });
            }
            return bcrypt.compare(req.body.password, user.password);  
        })
        .then(result => {
            if (!result) {
                return res.status(401).json({
                    message: 'Auth failed',
                    user: ''
                });
            }
            const token = jwt.sign(
                { email: fetchedUser.email, userId: fetchedUser._id }, 
                process.env.JWT_KEY ? process.env.JWT_KEY : 'secret_this_should_be_longer',
                { expiresIn: '1h'}
            );
            
            res.status(200).json({
                message: 'Auth success',
                token: token,
                expiresIn: 3600,
                userId: fetchedUser._id
            });
        })
        .catch(err => {
            return res.status(401).json({
                message: 'Invalid authentication credentials!' });
        });
}