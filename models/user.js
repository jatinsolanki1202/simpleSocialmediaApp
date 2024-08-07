const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: String,
    email: String,
    password: String,
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    }],
    profilePic: {
        type: String,
        default: "defaultAvatar.jpg"
    }
})

module.exports = mongoose.model("user", userSchema);