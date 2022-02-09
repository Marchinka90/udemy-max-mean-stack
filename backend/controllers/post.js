const multer = require('multer');

const Post = require('../models/post');

exports.createPost = (req, res, next) => {
    const url = req.protocol + '://' + req.get('host');
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        imagePath: url + '/images/' +  req.file.filename,
        creator: req.userData.userId
    });

    post.save()
        .then(createdPost => {
            res.status(201).json({
                message: 'Post added successfully!',
                post: {
                    ...createdPost,
                    id: createdPost._id,
                }
            });
        })
        .catch(error => {
            res.status(500).json({message: 'Creating a post failed!'});
        });
}

exports.updatePost = (req, res, next) => {
    let imagePath;
    if(req.file) {
        const url = req.protocol + '://' + req.get('host');
        imagePath = url + '/images/' +  req.file.filename;
    }
    
    const post = new Post({
        _id: req.body.id,
        title: req.body.title,
        content: req.body.content,
        imagePath: imagePath,
        creator: req.userData.userId
    });

    Post.updateOne({ _id: req.params.id, creator: req.userData.userId }, post).then(result => {
        if (result.n > 0) {
            res.status(201).json({ message: 'Post updated successfully!', postId: post._id});
        } else {
            res.status(403).json({ message: 'Not authorized!'});
        }
    })
    .catch(error => {
        res.status(500).json({message: 'Could not update post!'});
    });
}

exports.fetchAllPosts = (req, res, next) => {
    const pageSize = Number(req.query.pagesize);
    const currentPage = Number(req.query.page);
    let fetchedPosts;
    const postQuery = Post.find();
    if (pageSize && currentPage) {
        postQuery
            .skip(pageSize * (currentPage - 1))
            .limit(pageSize);
    }
    
    postQuery.then(responceData => {
        fetchedPosts = responceData;
        return Post.countDocuments();
    })
    .then(count => {
        res.status(200).json({
            message: 'Posts fetched successfully!',
            posts: fetchedPosts,
            maxPosts: count
        });
    })
    .catch(error => {
        res.status(500).json({message: 'Fetching post failed!'});
    });
}

exports.getPost = (req, res, next) => {
    Post.findById(req.params.id).then(post => {
        if (post) {
            res.status(200).json(post);
        } else {
            res.status(404).json({ message: 'Post not found!' });
        }
    })
    .catch(error => {
        res.status(500).json({message: 'Fetching post failed!'});
    });
}

exports.deletePost = (req, res, next) => {
    Post.deleteOne({ _id: req.params.id, creator: req.userData.userId }).then(result => {  
        if (result.n > 0) {
            res.status(201).json({ message: 'Post deleted successfully!' });
        } else {
            res.status(403).json({ message: 'Not authorized!'});
        }   
    })
    .catch(error => {
        res.status(500).json({message: 'Deleting post failed!'});
    });
}
